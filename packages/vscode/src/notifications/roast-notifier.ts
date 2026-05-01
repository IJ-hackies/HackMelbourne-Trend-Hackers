import type { AnalysisResult, Roast, RankEvaluation, Achievement } from '@git-gud/core';
import * as vscode from 'vscode';

export function showRoastNotification(roast: Roast, analysis: AnalysisResult): void {
    const config = vscode.workspace.getConfiguration('gitgud');
    if (!config.get<boolean>('notificationsEnabled', true)) {
        return;
    }

    const intensity = config.get<string>('roastIntensity', 'medium');
    if (intensity === 'mild' && roast.severity === 'savage') {
        // Downgrade savage to medium for mild setting
        roast.severity = 'medium';
    }
    if (intensity === 'savage' && roast.severity === 'mild') {
        // Upgrade mild to medium for savage setting
        roast.severity = 'medium';
    }

    const hasCritical = analysis.verdicts.some(v => v.severity === 'critical');
    const hasWarning = analysis.verdicts.some(v => v.severity === 'warning');

    const title = hasCritical ? 'Git Gud — CRITICAL OFFENSE' : hasWarning ? 'Git Gud — Warning' : 'Git Gud';
    const body = `${roast.message}\n\n💡 ${roast.advice}`;

    if (hasCritical) {
        vscode.window.showErrorMessage(`${title}: ${body}`, 'View Dashboard').then((choice) => {
            if (choice === 'View Dashboard') {
                vscode.commands.executeCommand('gitgud.showDashboard');
            }
        });
    } else if (hasWarning) {
        vscode.window.showWarningMessage(`${title}: ${body}`, 'View Dashboard').then((choice) => {
            if (choice === 'View Dashboard') {
                vscode.commands.executeCommand('gitgud.showDashboard');
            }
        });
    } else {
        vscode.window.showInformationMessage(`${title}: ${body}`);
    }
}

export function showRankChangeNotification(rankEval: RankEvaluation): void {
    if (rankEval.promoted) {
        vscode.window.showInformationMessage(
            `🎉 RANK UP! You are now a ${rankEval.rank.name}!`,
            'View Dashboard'
        ).then((choice) => {
            if (choice === 'View Dashboard') {
                vscode.commands.executeCommand('gitgud.showDashboard');
            }
        });
    } else if (rankEval.demoted) {
        vscode.window.showWarningMessage(
            `💔 RANK DOWN. You fell to ${rankEval.rank.name}. Time to git gud.`,
            'View Dashboard'
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
            'View Dashboard'
        ).then((choice) => {
            if (choice === 'View Dashboard') {
                vscode.commands.executeCommand('gitgud.showDashboard');
            }
        });
    }
}
