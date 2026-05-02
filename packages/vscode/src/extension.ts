import * as vscode from 'vscode';
import { evaluate } from '@git-gud/core';
import type { GitEvent, AnalysisContext } from '@git-gud/core';
import { GitWatcher } from './git/git-watcher';
import { getCommitDiff, getPushDiff, getMergeConflictFiles } from './git/git-commands';
import { showRoastNotifications } from './notifications/roast-notifier';
import { StateManager } from './storage/state-manager';
import { SidebarProvider } from './webview/sidebar-provider';
import { MergeConflictTracker } from './git/merge-conflict-tracker';
import { getConfig, getRoastConfig, onConfigChange } from './config';
import { runDemo } from './demo/demo-runner';
import { renderRankCardSvg, tweetIntentUrl } from './rank-card/render';
import { showWeeklyReport } from './reports/weekly-panel';

let gitWatcher: GitWatcher | undefined;

export function activate(context: vscode.ExtensionContext) {
  let config = getConfig();
  const stateManager = new StateManager(context.globalState);
  let playerState = stateManager.loadPlayerState();

  const sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewId, sidebarProvider),
  );

  let conflictTracker: MergeConflictTracker | undefined;

  function refreshSidebar() {
    const data = sidebarProvider.buildSidebarData(
      playerState,
      stateManager.getEventHistory(),
      {
        aiProvider: config.aiProvider,
        ollamaApiKey: config.ollamaApiKey,
        ollamaModel: config.ollamaModel,
        ollamaBaseUrl: config.ollamaBaseUrl,
        geminiApiKey: config.geminiApiKey,
      },
    );
    sidebarProvider.updateState(data);
  }

  refreshSidebar();

  context.subscriptions.push(
    onConfigChange((newConfig) => { config = newConfig; refreshSidebar(); }),
  );

  const handleEvent = async (event: GitEvent) => {
    if (!config.enabled) return;

    // Enrich event with diff context
    try {
      if (event.type === 'commit' && event.repoPath) {
        Object.assign(event.metadata, await getCommitDiff(event.repoPath));
      } else if ((event.type === 'push-to-main' || event.type === 'force-push') && event.repoPath) {
        Object.assign(event.metadata, await getPushDiff(event.repoPath, (event.metadata.branchName as string) ?? 'main'));
      } else if (event.type === 'merge-conflict' && event.repoPath) {
        Object.assign(event.metadata, await getMergeConflictFiles(event.repoPath));
        if (!conflictTracker) {
          conflictTracker = new MergeConflictTracker(event.repoPath, async (type, metadata) => {
            await handleEvent({ type, timestamp: Date.now(), repoPath: event.repoPath, metadata });
          });
          await conflictTracker.start((event.metadata.changedFiles as string[]) ?? []);
        }
      } else if (event.type === 'merge-conflict-resolved') {
        conflictTracker?.stop();
        conflictTracker = undefined;
      }
    } catch {}

    // Build analysis context
    const branch = (event.metadata.branchName ?? event.metadata.branch) as string | undefined;
    const DEFAULT_BRANCHES = new Set(['main', 'master', 'develop', 'development', 'dev']);
    const analysisContext: AnalysisContext = {
      branchName: branch,
      isDefaultBranch: branch ? DEFAULT_BRANCHES.has(branch.toLowerCase()) : false,
      recentCommitTimestamps: stateManager.getRecentCommitDates(),
    };

    const roastConfig = getRoastConfig(config);
    const result = await evaluate(event, playerState, analysisContext, roastConfig);

    playerState = await stateManager.saveAfterEvaluation(event, result, playerState);

    const newAchievements = result.achievements.filter(
      a => a.unlocked && !playerState.unlockedAchievements.has(a.id),
    );

    const SILENT = new Set(['conflict-block-preview', 'file-fully-resolved']);
    if (!SILENT.has(event.type)) {
      if (config.voiceEnabled) {
        const savage = result.roasts.find((r) => r.severity === 'savage');
        if (savage) {
          sidebarProvider.postMessage({ type: 'speakRoast', text: savage.message });
        } else if (result.rankEvaluation.promoted) {
          sidebarProvider.postMessage({
            type: 'speakRoast',
            text: `Rank up! You are now ${result.rankEvaluation.rank.name}.`,
          });
        } else if (result.rankEvaluation.demoted && result.rankEvaluation.previousRank) {
          sidebarProvider.postMessage({
            type: 'speakRoast',
            text: `Demoted to ${result.rankEvaluation.rank.name}. Do better.`,
          });
        }
      }
      await showRoastNotifications(result.roasts, result.rankEvaluation, newAchievements);
    }

    refreshSidebar();
  };

  gitWatcher = new GitWatcher(handleEvent);
  gitWatcher.start();

  context.subscriptions.push(
    vscode.commands.registerCommand('gitgud.showDashboard', () => sidebarProvider.focus()),
    vscode.commands.registerCommand('gitgud.resetStats', async () => {
      await stateManager.resetState();
      playerState = stateManager.loadPlayerState();
      refreshSidebar();
      vscode.window.showInformationMessage('Git Gud: Stats reset.');
    }),
    vscode.commands.registerCommand('gitgud.weeklyReport', () => {
      showWeeklyReport(playerState, stateManager.getEventHistory());
    }),
    vscode.commands.registerCommand('gitgud.runDemo', async () => {
      await runDemo(handleEvent);
    }),
    vscode.commands.registerCommand('gitgud.exportRankCard', async () => {
      const svg = renderRankCardSvg(playerState, stateManager.getEventHistory());
      const folder = vscode.workspace.workspaceFolders?.[0]?.uri ?? context.globalStorageUri;
      const target = vscode.Uri.joinPath(folder, `git-gud-rank-card-${Date.now()}.svg`);
      await vscode.workspace.fs.writeFile(target, Buffer.from(svg, 'utf8'));
      const action = await vscode.window.showInformationMessage(
        `🃏 Rank card saved: ${target.fsPath}`,
        'Open',
        'Share to X',
      );
      if (action === 'Open') {
        await vscode.commands.executeCommand('vscode.open', target);
      } else if (action === 'Share to X') {
        await vscode.env.openExternal(vscode.Uri.parse(tweetIntentUrl(playerState)));
      }
    }),
    vscode.commands.registerCommand('gitgud.setApiKey', async () => {
      const key = await vscode.window.showInputBox({ prompt: 'Enter API key', password: true });
      if (key) {
        const cfg = vscode.workspace.getConfiguration('gitgud');
        if (config.aiProvider === 'gemini') {
          await cfg.update('geminiApiKey', key, true);
        } else {
          await cfg.update('ollamaApiKey', key, true);
        }
        vscode.window.showInformationMessage('Git Gud: API key saved.');
      }
    }),
    vscode.commands.registerCommand('gitgud.shareToTeam', async () => {
      const cfg = vscode.workspace.getConfiguration('gitgud');
      let teamCode = cfg.get<string>('teamCode', '');
      const syncUrl = cfg.get<string>('syncUrl', 'http://localhost:3000/api/sync');

      if (!teamCode) {
        const code = await vscode.window.showInputBox({ prompt: 'Enter your team code (or create one)' });
        if (code) {
          await cfg.update('teamCode', code, true);
          teamCode = code;
        } else {
          return;
        }
      }

      try {
        const response = await fetch(syncUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamCode,
            player: playerState,
            timestamp: Date.now(),
          }),
        });
        if (response.ok) {
          vscode.window.showInformationMessage('Git Gud: Stats synced to team leaderboard!');
        } else {
          vscode.window.showWarningMessage('Git Gud: Failed to sync stats.');
        }
      } catch {
        vscode.window.showWarningMessage('Git Gud: Could not connect to sync server.');
      }
    }),
  );
}

export function deactivate() {
  gitWatcher?.dispose();
}
