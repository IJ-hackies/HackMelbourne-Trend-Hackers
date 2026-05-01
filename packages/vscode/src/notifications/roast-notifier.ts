import * as vscode from 'vscode';
import type { Roast, RankEvaluation, Achievement } from '@git-gud/core';

export function showRoastNotifications(
  roasts: Roast[],
  rankEvaluation: RankEvaluation,
  newAchievements: Achievement[],
): void {
  for (const roast of roasts) {
    const text = `${roast.message}\n💡 ${roast.advice}`;

    switch (roast.severity) {
      case 'savage':
        vscode.window.showErrorMessage(`🔥 ${text}`);
        break;
      case 'medium':
        vscode.window.showWarningMessage(`⚠️ ${text}`);
        break;
      default:
        vscode.window.showInformationMessage(`ℹ️ ${text}`);
        break;
    }
  }

  if (rankEvaluation.promoted) {
    vscode.window.showInformationMessage(
      `🏆 RANK UP! You are now ${rankEvaluation.rank.name}!`,
    );
  } else if (rankEvaluation.demoted && rankEvaluation.previousRank) {
    vscode.window.showWarningMessage(
      `📉 Demoted from ${rankEvaluation.previousRank.name} to ${rankEvaluation.rank.name}. Do better.`,
    );
  }

  for (const achievement of newAchievements) {
    if (achievement.unlocked) {
      vscode.window.showInformationMessage(
        `🎖️ Achievement Unlocked: ${achievement.name} — ${achievement.description}`,
      );
    }
  }
}
