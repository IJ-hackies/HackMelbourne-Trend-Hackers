import * as vscode from 'vscode';
import type { Roast, RankEvaluation, Achievement } from '@git-gud/core';

const SEVERITY_RANK: Record<string, number> = { savage: 3, medium: 2, mild: 1 };

// Slang prefixes per severity level
const SLANG_PREFIXES: Record<string, string[]> = {
  savage: ['BROOO', 'NAHHHH', 'FATALITY', 'CLIP THAT', 'AINT NO WAY', 'REPORTED', 'UNHINGED BEHAVIOR'],
  medium: ['Ayo', 'Bro really said', 'Not the vibe', 'Bruh moment', 'We need to talk'],
  mild: ['Lowkey', 'NGL', 'Real talk', 'Quick suggestion', 'Minor L'],
};

// Meme button labels for navigating to dashboard
const MEME_BUTTONS: string[] = ['Bet', 'Say less', 'POGGERS', 'W', 'RIP'];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickBestRoast(roasts: Roast[]): Roast | undefined {
  if (roasts.length === 0) return undefined;
  return roasts.reduce((best, r) =>
    (SEVERITY_RANK[r.severity] ?? 0) > (SEVERITY_RANK[best.severity] ?? 0) ? r : best,
  );
}

/** Adjust severity based on the roastIntensity setting */
function adjustSeverity(severity: string, intensity: string): string {
  if (intensity === 'mild' && severity === 'savage') return 'medium';
  if (intensity === 'mild' && severity === 'medium') return 'mild';
  if (intensity === 'savage' && severity === 'mild') return 'medium';
  return severity;
}

export async function showRoastNotifications(
  roasts: Roast[],
  rankEvaluation: RankEvaluation,
  newAchievements: Achievement[],
): Promise<void> {
  const config = vscode.workspace.getConfiguration('gitgud');
  if (!config.get<boolean>('notificationsEnabled', true)) {
    return;
  }

  const intensity = config.get<string>('roastIntensity', 'savage') ?? 'savage';

  const roast = pickBestRoast(roasts);
  if (roast) {
    const effectiveSeverity = adjustSeverity(roast.severity, intensity);
    const prefix = randomPick(SLANG_PREFIXES[effectiveSeverity] ?? SLANG_PREFIXES.mild);
    const memeButton = randomPick(MEME_BUTTONS);

    const onAction = (action: string | undefined) => {
      if (action === 'Show Advice') {
        vscode.window.showInformationMessage(`💡 ${roast.advice}`);
      } else if (action && MEME_BUTTONS.includes(action)) {
        vscode.commands.executeCommand('gitgud.showDashboard');
      }
    };
    switch (effectiveSeverity) {
      case 'savage':
        vscode.window.showErrorMessage(`🔥 ${prefix} — ${roast.message}`, 'Show Advice', memeButton).then(onAction);
        break;
      case 'medium':
        vscode.window.showWarningMessage(`⚠️ ${prefix} — ${roast.message}`, 'Show Advice', memeButton).then(onAction);
        break;
      default:
        vscode.window.showInformationMessage(`ℹ️ ${prefix} — ${roast.message}`, 'Show Advice', memeButton).then(onAction);
        break;
    }
  }

  if (rankEvaluation.promoted) {
    vscode.window.showInformationMessage(
      `🏆 RANK UP! You are now ${rankEvaluation.rank.name}!`,
      'W',
    ).then((action) => {
      if (action === 'W') {
        vscode.commands.executeCommand('gitgud.showDashboard');
      }
    });
  } else if (rankEvaluation.demoted && rankEvaluation.previousRank) {
    vscode.window.showWarningMessage(
      `📉 Demoted from ${rankEvaluation.previousRank.name} to ${rankEvaluation.rank.name}. Do better.`,
      'RIP',
    ).then((action) => {
      if (action === 'RIP') {
        vscode.commands.executeCommand('gitgud.showDashboard');
      }
    });
  }

  for (const achievement of newAchievements) {
    if (achievement.unlocked) {
      vscode.window.showInformationMessage(
        `🎖️ Achievement Unlocked: ${achievement.name} — ${achievement.description}`,
        'POGGERS',
      ).then((action) => {
        if (action === 'POGGERS') {
          vscode.commands.executeCommand('gitgud.showDashboard');
        }
      });
    }
  }
}
