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
import { SourceControlManager } from './git/source-control';
import { generateCommitMessage } from './git/commit-message-ai';
import { exec } from 'child_process';
import { promisify } from 'util';

const pexec = promisify(exec);
let gitWatcher: GitWatcher | undefined;

const COLLAPSED_KEY = 'gitgud.collapsedSections';

export function activate(context: vscode.ExtensionContext) {
  let config = getConfig();
  const stateManager = new StateManager(context.globalState);
  let playerState = stateManager.loadPlayerState();

  const sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewId, sidebarProvider),
  );

  const sourceControl = new SourceControlManager(() => refreshSidebar());
  context.subscriptions.push({ dispose: () => sourceControl.dispose() });
  void sourceControl.init();

  let conflictTracker: MergeConflictTracker | undefined;

  function getCollapsed(): Record<string, boolean> {
    return context.globalState.get<Record<string, boolean>>(COLLAPSED_KEY, {});
  }

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
        commitMessageStyle: config.commitMessageStyle,
      },
      sourceControl.snapshot(),
      getCollapsed(),
    );
    sidebarProvider.updateState(data);
  }

  sidebarProvider.setHandlers({
    onSCGenerate: async () => {
      try {
        const root = sourceControl.rootUri();
        if (!root) throw new Error('No Git repository.');
        const diff = await sourceControl.getDiff();
        let porcelain = '';
        try {
          const { stdout } = await pexec('git status --porcelain', { cwd: root.fsPath, maxBuffer: 1024 * 256, timeout: 4000 });
          porcelain = stdout.trim();
        } catch {}
        const message = await generateCommitMessage(config, {
          diff,
          porcelain,
          style: config.commitMessageStyle,
        });
        sidebarProvider.postMessage({ type: 'sc:generated', message });
      } catch (e: any) {
        sidebarProvider.postMessage({ type: 'sc:generated', error: String(e?.message ?? e) });
      }
    },
    onSCCommit: async (message, push, amend) => {
      try {
        await sourceControl.stageAllAndCommit(message, amend);
        if (push) {
          const res = await sourceControl.push();
          if (!res.ok) {
            sidebarProvider.postMessage({ type: 'sc:committed', needsPull: !!res.needsPull, error: res.error });
            return;
          }
        }
        sidebarProvider.postMessage({ type: 'sc:committed' });
      } catch (e: any) {
        sidebarProvider.postMessage({ type: 'sc:committed', error: String(e?.message ?? e) });
      }
    },
    onSCPullAndPush: async () => {
      const res = await sourceControl.pullAndPush();
      if (!res.ok) {
        sidebarProvider.postMessage({ type: 'sc:pushResult', error: res.error });
        vscode.window.showErrorMessage(`Git Gud: pull & push failed — ${res.error}`);
      } else {
        sidebarProvider.postMessage({ type: 'sc:pushResult' });
      }
    },
    onSCCheckout: async (branchFull, isRemote) => {
      try {
        const branches = sourceControl.snapshot().branches;
        const target = branches.find(b => b.full === branchFull && b.isRemote === isRemote);
        if (!target) throw new Error(`Branch not found: ${branchFull}`);
        await sourceControl.checkout(target);
      } catch (e: any) {
        vscode.window.showErrorMessage(`Git Gud: checkout failed — ${String(e?.message ?? e)}`);
      }
    },
    onCollapsedChange: (key, collapsed) => {
      const cur = getCollapsed();
      cur[key] = collapsed;
      void context.globalState.update(COLLAPSED_KEY, cur);
    },
  });

  refreshSidebar();

  context.subscriptions.push(
    onConfigChange((newConfig) => { config = newConfig; refreshSidebar(); }),
  );

  const handleEvent = async (event: GitEvent) => {
    if (!config.enabled) return;

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
  );
}

export function deactivate() {
  gitWatcher?.dispose();
}
