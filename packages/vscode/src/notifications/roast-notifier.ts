import type { AnalysisResult, Roast, RankEvaluation, Achievement } from '@git-gud/core';
import * as vscode from 'vscode';

// Slang prefixes for different severities
const ROAST_PREFIXES = {
    savage: [
        'BROOO 💀',
        'NAHHHH 💀💀',
        'AINT NO WAY',
        'FATALITY ☠️',
        'REPORTED',
        'CLIP THAT',
        'UNHINGED BEHAVIOR',
    ],
    medium: [
        'Aye yo 👀',
        'Respectfully...',
        'Bruh moment',
        'Gonna need you to',
        'We need to talk',
    ],
    mild: [
        'Friendly heads up',
        'Quick suggestion',
        'Lowkey...',
        'Minor L',
    ],
};

const ADVICE_EMOJIS = ['💡', '🎯', '📝', '🔧', '🎓'];

function randomPick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function showRoastNotification(roast: Roast, analysis: AnalysisResult): void {
    const config = vscode.workspace.getConfiguration('gitgud');
    if (!config.get<boolean>('notificationsEnabled', true)) {
        return;
    }

    const intensity = config.get<string>('roastIntensity', 'medium');

    // Determine effective severity
    let effectiveSeverity = roast.severity;
    if (intensity === 'mild' && roast.severity === 'savage') {
        effectiveSeverity = 'medium';
    }
    if (intensity === 'savage' && roast.severity === 'mild') {
        effectiveSeverity = 'medium';
    }

    const hasCritical = analysis.verdicts.some(v => v.severity === 'critical');
    const hasWarning = analysis.verdicts.some(v => v.severity === 'warning');

    // Pick notification style based on severity
    const prefix = randomPick(ROAST_PREFIXES[effectiveSeverity]);
    const adviceEmoji = randomPick(ADVICE_EMOJIS);

    // Format the message with meme energy
    const title = effectiveSeverity === 'savage'
        ? `${prefix} | CRITICAL OFFENSE`
        : effectiveSeverity === 'medium'
            ? `${prefix} | Git Gud`
            : `${prefix}`;

    const body = `${roast.message}\n\n${adviceEmoji} ${roast.advice}`;

    if (effectiveSeverity === 'savage' || hasCritical) {
        vscode.window.showErrorMessage(`${title}: ${body}`, 'View Dashboard', 'Bet').then((choice) => {
            if (choice === 'View Dashboard') {
                vscode.commands.executeCommand('gitgud.showDashboard');
            }
        });
    } else if (effectiveSeverity === 'medium' || hasWarning) {
        vscode.window.showWarningMessage(`${title}: ${body}`, 'View Dashboard', 'Say less').then((choice) => {
            if (choice === 'View Dashboard') {
                vscode.commands.executeCommand('gitgud.showDashboard');
            }
        });
    } else {
        vscode.window.showInformationMessage(`${title}: ${body}`, 'View Dashboard');
    }
}

export function showRankChangeNotification(rankEval: RankEvaluation): void {
    if (rankEval.promoted) {
        vscode.window.showInformationMessage(
            `🎉 RANK UP! You are now a ${rankEval.rank.name}! No cap, you actually improved.`,
            'View Dashboard',
            'W'
        ).then((choice) => {
            if (choice === 'View Dashboard') {
                vscode.commands.executeCommand('gitgud.showDashboard');
            }
        });
    } else if (rankEval.demoted) {
        vscode.window.showWarningMessage(
            `💔 RANK DOWN. You fell to ${rankEval.rank.name}. Sheeeesh, that was rough. Time to touch grass and git gud.`,
            'View Dashboard',
            'RIP'
        ).then((choice) => {
            if (choice === 'View Dashboard') {
                vscode.commands.executeCommand('gitgud.showDashboard');
            }
        });
    }
}

export function showAchievementNotification(achievements: Achievement[]): void {
    const newlyUnlocked = achievements.filter(a => a.unlocked);
    for (const ach of newlyUnlocked) {
        vscode.window.showInformationMessage(
            `🏆 Achievement Unlocked: ${ach.name}! ${ach.description}`,
            'View Dashboard',
            'POGGERS'
        ).then((choice) => {
            if (choice === 'View Dashboard') {
                vscode.commands.executeCommand('gitgud.showDashboard');
            }
        });
    }
}
