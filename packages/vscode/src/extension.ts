import * as vscode from 'vscode';
import { evaluate, GitEventType } from '@git-gud/core';
import type { GitEvent, PlayerState } from '@git-gud/core';
import { loadState, saveState, resetState } from './storage/state-manager';
import {
    showRoastNotification,
    showRankChangeNotification,
    showAchievementNotification,
} from './notifications/roast-notifier';
import { detectGitEvents, getOutputChannel } from './git/event-detector';
import { SidebarProvider } from './webview/sidebar-provider';

let playerState: PlayerState;
let sidebarProvider: SidebarProvider;

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = getOutputChannel();
    outputChannel.appendLine('Git Gud extension activated');

    // Set context key so sidebar view shows up
    vscode.commands.executeCommand('setContext', 'gitgud.enabled', true);

    // Load persisted state
    playerState = loadState(context);

    // Sidebar dashboard
    sidebarProvider = new SidebarProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('gitgud-dashboard', sidebarProvider)
    );

    // Update sidebar with current state
    sidebarProvider.update(playerState);

    // Commands
    const commands = [
        vscode.commands.registerCommand('gitgud.showStatus', () => {
            vscode.window.showInformationMessage(
                `Git Gud — ${playerState.rank.name} | Score: ${playerState.score.total} | Personality: ${playerState.personality.type}`
            );
        }),
        vscode.commands.registerCommand('gitgud.showDashboard', () => {
            vscode.commands.executeCommand('gitgud-sidebar.focus');
        }),
        vscode.commands.registerCommand('gitgud.resetStats', async () => {
            const choice = await vscode.window.showWarningMessage(
                'Reset all Git Gud stats? This cannot be undone.',
                { modal: true },
                'Yes, Reset Everything'
            );
            if (choice === 'Yes, Reset Everything') {
                playerState = resetState(context);
                sidebarProvider.update(playerState);
                vscode.window.showInformationMessage('Git Gud stats have been reset.');
            }
        }),
        vscode.commands.registerCommand('gitgud.toggleSound', () => {
            const config = vscode.workspace.getConfiguration('gitgud');
            const current = config.get<boolean>('soundEnabled', true);
            config.update('soundEnabled', !current, true);
            vscode.window.showInformationMessage(`Git Gud sounds ${!current ? 'enabled' : 'disabled'}.`);
        }),
        vscode.commands.registerCommand('gitgud.showProfile', () => {
            vscode.window.showInformationMessage(
                `Git Gud Profile — Rank: ${playerState.rank.name} | Score: ${playerState.score.total} | Personality: ${playerState.personality.type} | Achievements: ${playerState.achievements.length}`
            );
        }),
        vscode.commands.registerCommand('gitgud.testRoast', () => {
            const testEvent: GitEvent = {
                type: GitEventType.Commit,
                timestamp: Date.now(),
                metadata: {
                    message: 'fix',
                    branch: 'main',
                    isDefaultBranch: true,
                    filesChanged: 1,
                    insertions: 2,
                    deletions: 0,
                },
            };
            const timestamps = playerState.stats.commitTimestamps;
            const result = evaluate(testEvent, playerState, { commitTimestamps: timestamps });

            playerState = {
                ...playerState,
                score: result.score,
                rank: result.rank.rank,
                achievements: result.achievements,
                stats: result.stats,
                personality: result.personality,
                suffering: result.suffering,
            };
            saveState(context, playerState);
            sidebarProvider.update(playerState);

            showRoastNotification(result.roast, result.analysis);
            showRankChangeNotification(result.rank);
            showAchievementNotification(result.achievements);

            outputChannel.appendLine(`[Test] Demo roast fired!`);
        }),
    ];
    context.subscriptions.push(...commands);

    // Configuration change listener
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('gitgud')) {
                outputChannel.appendLine('Git Gud configuration changed');
            }
        })
    );

    // Git event pipeline
    const disposables: vscode.Disposable[] = [];
    detectGitEvents((event: GitEvent) => {
        const config = vscode.workspace.getConfiguration('gitgud');
        if (!config.get<boolean>('enabled', true)) {
            return;
        }

        const timestamps = playerState.stats.commitTimestamps;
        const result = evaluate(event, playerState, { commitTimestamps: timestamps });

        // Update state
        playerState = {
            ...playerState,
            score: result.score,
            rank: result.rank.rank,
            achievements: result.achievements,
            stats: result.stats,
            personality: result.personality,
            suffering: result.suffering,
        };

        // Persist
        saveState(context, playerState);

        // Update sidebar
        sidebarProvider.update(playerState);

        // Notifications
        showRoastNotification(result.roast, result.analysis);
        showRankChangeNotification(result.rank);
        showAchievementNotification(result.achievements);

        outputChannel.appendLine(`[Pipeline] ${event.type} | Score: ${result.score.total} (+${result.score.delta}) | Roast: ${result.roast.message.slice(0, 60)}...`);
    }, disposables);
    context.subscriptions.push(...disposables);

    // Initial sidebar render
    sidebarProvider.update(playerState);
}

export function deactivate() {
    // State is saved after each event, so no explicit save needed here
}
