import * as vscode from 'vscode';
import type { Roast, RankEvaluation, Achievement } from '@git-gud/core';

const SEVERITY_RANK: Record<string, number> = { savage: 3, medium: 2, mild: 1 };

function pickBestRoast(roasts: Roast[]): Roast | undefined {
  if (roasts.length === 0) return undefined;
  return roasts.reduce((best, r) =>
    (SEVERITY_RANK[r.severity] ?? 0) > (SEVERITY_RANK[best.severity] ?? 0) ? r : best,
  );
}

export async function showRoastNotifications(
  roasts: Roast[],
  rankEvaluation: RankEvaluation,
  newAchievements: Achievement[],
): Promise<void> {
  const roast = pickBestRoast(roasts);
  if (roast) {
    const onAction = (action: string | undefined) => {
      if (action === 'Show Advice') {
        vscode.window.showInformationMessage(`💡 ${roast.advice}`);
      }
    };
    switch (roast.severity) {
      case 'savage':
        vscode.window.showErrorMessage(`🔥 ${roast.message}`, 'Show Advice').then(onAction);
        break;
      case 'medium':
        vscode.window.showWarningMessage(`⚠️ ${roast.message}`, 'Show Advice').then(onAction);
        break;
      default:
        vscode.window.showInformationMessage(`ℹ️ ${roast.message}`, 'Show Advice').then(onAction);
        break;
    }
  }

  if (rankEvaluation.promoted) {
    vscode.window.showInformationMessage(`🏆 RANK UP! You are now ${rankEvaluation.rank.name}!`);
  } else if (rankEvaluation.demoted && rankEvaluation.previousRank) {
    vscode.window.showWarningMessage(`📉 Demoted from ${rankEvaluation.previousRank.name} to ${rankEvaluation.rank.name}. Do better.`);
  }

  for (const achievement of newAchievements) {
    if (achievement.unlocked) {
      vscode.window.showInformationMessage(`🎖️ Achievement Unlocked: ${achievement.name} — ${achievement.description}`);
    }
  }
}
