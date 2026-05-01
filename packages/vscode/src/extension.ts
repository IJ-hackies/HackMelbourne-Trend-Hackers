import * as vscode from 'vscode';
import { evaluate, RANK_LADDER } from '@git-gud/core';
import type { RoastConfig } from '@git-gud/core';
import { GitEventDetector } from './git/event-detector';
import { mapToGitEvent, buildAnalysisContext } from './git/event-mapper';
import { showRoastNotifications } from './notifications/roast-notifier';
import { StateManager } from './storage/state-manager';

const outputChannel = vscode.window.createOutputChannel('Git Gud');

export function activate(context: vscode.ExtensionContext) {
  outputChannel.appendLine('Git Gud is now active — watching your every move.');

  const stateManager = new StateManager(context.globalState);
  let playerState = stateManager.loadPlayerState();

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

    const config = vscode.workspace.getConfiguration('gitgud');
    if (!config.get<boolean>('enabled', true)) return;

    const gitEvent = mapToGitEvent(signal);
    const recentDates = stateManager.getRecentCommitDates();
    const analysisContext = buildAnalysisContext(signal, recentDates);

    const roastConfig = buildRoastConfig(config);

    try {
      const result = await evaluate(gitEvent, playerState, analysisContext, roastConfig);

      outputChannel.appendLine(`  Score: ${result.score.total} (${result.score.delta >= 0 ? '+' : ''}${result.score.delta})`);
      outputChannel.appendLine(`  Rank: ${result.rankEvaluation.rank.name}`);
      outputChannel.appendLine(`  Verdicts: ${result.analysis.verdicts.length}`);
      outputChannel.appendLine(`  Roasts: ${result.roasts.length}`);

      const newAchievements = result.achievements.filter(
        a => a.unlocked && !playerState.unlockedAchievements.has(a.id),
      );

      if (config.get<boolean>('notificationsEnabled', true)) {
        showRoastNotifications(result.roasts, result.rankEvaluation, newAchievements);
      }

      playerState = await stateManager.saveAfterEvaluation(gitEvent, result, playerState);
    } catch (err) {
      outputChannel.appendLine(`  Error during evaluation: ${err}`);
    }
  });

  context.subscriptions.push(
    vscode.commands.registerCommand('gitgud.showStatus', () => {
      const rank = playerState.rank;
      const score = playerState.score;
      vscode.window.showInformationMessage(
        `Git Gud | Rank: ${rank.name} | Score: ${score.total} | Commits: ${playerState.stats.totalCommits}`,
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
        vscode.window.showInformationMessage('Git Gud stats reset. Fresh start, same bad habits.');
        outputChannel.appendLine('Stats reset by user.');
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('gitgud.showProfile', () => {
      const stats = playerState.stats;
      const lines = [
        `🏅 Rank: ${playerState.rank.name}`,
        `📊 Score: ${playerState.score.total}`,
        `📝 Commits: ${stats.totalCommits}`,
        `🔥 Force Pushes: ${stats.totalForcePushes}`,
        `🔀 Merge Conflicts: ${stats.totalMergeConflicts}`,
        `🏆 Clean Streak: ${stats.cleanCommitStreak} (Best: ${stats.longestCleanStreak})`,
        `🎖️ Achievements: ${playerState.unlockedAchievements.size}`,
      ];
      outputChannel.appendLine('\n--- Player Profile ---');
      for (const line of lines) outputChannel.appendLine(line);
      outputChannel.show(true);
    }),
  );
}

function buildRoastConfig(config: vscode.WorkspaceConfiguration): RoastConfig | undefined {
  const apiKey = config.get<string>('ollamaApiKey', '');
  if (!apiKey) return undefined;

  return {
    ollamaApiKey: apiKey,
    ollamaModel: config.get<string>('ollamaModel') || undefined,
    ollamaBaseUrl: config.get<string>('ollamaBaseUrl') || undefined,
  };
}

export function deactivate() {}
