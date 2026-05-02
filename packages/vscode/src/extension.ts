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
