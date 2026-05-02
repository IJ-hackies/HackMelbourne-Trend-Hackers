import * as vscode from 'vscode';
import { evaluate } from '@git-gud/core';
import { GitEventDetector } from './git/event-detector';
import { mapToGitEvent, buildAnalysisContext } from './git/event-mapper';
import { showRoastNotifications } from './notifications/roast-notifier';
import { StateManager } from './storage/state-manager';
import { SidebarProvider } from './webview/sidebar-provider';
import { SoundPlayer } from './audio/sound-player';
import { getConfig, getRoastConfig, onConfigChange } from './config';
import type { GitGudConfig } from './config';

const outputChannel = vscode.window.createOutputChannel('Git Gud');

export function activate(context: vscode.ExtensionContext) {
  outputChannel.appendLine('Git Gud is now active — watching your every move.');

  let config = getConfig();

  const stateManager = new StateManager(context.globalState);
  let playerState = stateManager.loadPlayerState();

  const sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewId, sidebarProvider),
  );

  const soundPlayer = new SoundPlayer(sidebarProvider);
  soundPlayer.enabled = config.soundEnabled;

  function refreshSidebar() {
    const data = sidebarProvider.buildSidebarData(
      playerState,
      stateManager.getEventHistory(),
      config.soundEnabled,
      { apiKey: config.ollamaApiKey, model: config.ollamaModel, baseUrl: config.ollamaBaseUrl },
    );
    sidebarProvider.updateState(data);
  }

  refreshSidebar();

  context.subscriptions.push(
    onConfigChange((newConfig) => {
      config = newConfig;
      soundPlayer.enabled = config.soundEnabled;
      refreshSidebar();
    }),
  );

  const detector = new GitEventDetector();
  context.subscriptions.push(detector);

  detector.initialize().then((ok) => {
    if (ok) {
      outputChannel.appendLine('Git repository detected. Event monitoring active.');
    } else {
      outputChannel.appendLine('No git repository found. Open a git project to get roasted.');
    }
  });

  detector.onEvent(async (signal) => {
    outputChannel.appendLine(`[${signal.type}] Event detected from ${signal.source}`);

    if (!config.enabled) return;

    const gitEvent = mapToGitEvent(signal);
    const recentDates = stateManager.getRecentCommitDates();
    const analysisContext = buildAnalysisContext(signal, recentDates);
    const roastConfig = getRoastConfig(config);

    try {
      const result = await evaluate(gitEvent, playerState, analysisContext, roastConfig);

      outputChannel.appendLine(`  Score: ${result.score.total} (${result.score.delta >= 0 ? '+' : ''}${result.score.delta})`);
      outputChannel.appendLine(`  Rank: ${result.rankEvaluation.rank.name}`);
      outputChannel.appendLine(`  Verdicts: ${result.analysis.verdicts.length}`);
      outputChannel.appendLine(`  Roasts: ${result.roasts.length}`);

      const newAchievements = result.achievements.filter(
        a => a.unlocked && !playerState.unlockedAchievements.has(a.id),
      );

      if (config.notificationsEnabled) {
        showRoastNotifications(result.roasts, result.rankEvaluation, newAchievements);
      }

      if (config.soundEnabled) {
        soundPlayer.playSoundsForResult(result.roasts, result.rankEvaluation, newAchievements);
      }

      playerState = await stateManager.saveAfterEvaluation(gitEvent, result, playerState);
      refreshSidebar();
    } catch (err) {
      outputChannel.appendLine(`  Error during evaluation: ${err}`);
    }
  });

  context.subscriptions.push(
    vscode.commands.registerCommand('gitgud.showStatus', () => {
      vscode.window.showInformationMessage(
        `Git Gud | Rank: ${playerState.rank.name} | Score: ${playerState.score.total} | Commits: ${playerState.stats.totalCommits}`,
      );
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('gitgud.resetStats', async () => {
      const confirm = await vscode.window.showWarningMessage(
        'Reset all Git Gud stats? This cannot be undone.',
        { modal: true },
        'Reset',
      );
      if (confirm === 'Reset') {
        await stateManager.resetState();
        playerState = stateManager.loadPlayerState();
        refreshSidebar();
        vscode.window.showInformationMessage('Git Gud stats reset. Fresh start, same bad habits.');
        outputChannel.appendLine('Stats reset by user.');
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('gitgud.showProfile', () => {
      const stats = playerState.stats;
      const lines = [
        `\u{1F3C5} Rank: ${playerState.rank.name}`,
        `\u{1F4CA} Score: ${playerState.score.total}`,
        `\u{1F4DD} Commits: ${stats.totalCommits}`,
        `\u{1F525} Force Pushes: ${stats.totalForcePushes}`,
        `\u{1F500} Merge Conflicts: ${stats.totalMergeConflicts}`,
        `\u{1F3C6} Clean Streak: ${stats.cleanCommitStreak} (Best: ${stats.longestCleanStreak})`,
        `\u{1F396}\u{FE0F} Achievements: ${playerState.unlockedAchievements.size}`,
      ];
      outputChannel.appendLine('\n--- Player Profile ---');
      for (const line of lines) outputChannel.appendLine(line);
      outputChannel.show(true);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('gitgud.showDashboard', () => {
      sidebarProvider.focus();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('gitgud.toggleSound', () => {
      const current = config.soundEnabled;
      vscode.workspace.getConfiguration('gitgud').update('soundEnabled', !current, true);
      vscode.window.showInformationMessage(
        current ? 'Git Gud sound effects disabled.' : 'Git Gud sound effects enabled.',
      );
    }),
  );
}

export function deactivate() {}
