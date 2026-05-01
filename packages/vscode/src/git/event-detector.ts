import { GitEventType } from '@git-gud/core';
import type { GitEvent } from '@git-gud/core';
import * as vscode from 'vscode';

const outputChannel = vscode.window.createOutputChannel('Git Gud');

export function getOutputChannel(): vscode.OutputChannel {
    return outputChannel;
}

export function logEvent(event: GitEvent): void {
    outputChannel.appendLine(`[${new Date(event.timestamp).toISOString()}] ${event.type}`);
}

export function detectGitEvents(
    onEvent: (event: GitEvent) => void,
    disposables: vscode.Disposable[]
): void {
    const gitExtension = vscode.extensions.getExtension('vscode.git');
    if (gitExtension) {
        const git = gitExtension.exports;
        if (git && git.repositories) {
            for (const repo of git.repositories) {
                const stateDisposable = repo.state.onDidChange(() => {
                    const branch = repo.state.HEAD?.name || 'unknown';
                    const commit = repo.state.HEAD?.commit;
                    if (commit) {
                        onEvent({
                            type: GitEventType.Commit,
                            timestamp: Date.now(),
                            metadata: {
                                branch,
                                commit,
                                message: '', // We will try to get this from file watchers or git API
                            },
                        });
                    }
                });
                disposables.push(stateDisposable);
            }
        }
    }

    // File system watchers for events the Git API doesn't surface
    const watcherPatterns = [
        { pattern: '**/.git/refs/**/*', type: GitEventType.ForcePush, label: 'force-push' },
        { pattern: '**/.git/MERGE_HEAD', type: GitEventType.MergeConflict, label: 'merge-conflict' },
        { pattern: '**/.git/rebase-merge/**', type: GitEventType.Rebase, label: 'rebase' },
        { pattern: '**/.git/rebase-apply/**', type: GitEventType.Rebase, label: 'rebase' },
        { pattern: '**/.git/HEAD', type: GitEventType.BranchSwitch, label: 'branch-switch' },
    ];

    for (const { pattern, type, label } of watcherPatterns) {
        const watcher = vscode.workspace.createFileSystemWatcher(pattern);
        const debounced = debounce((uri: vscode.Uri) => {
            onEvent({
                type,
                timestamp: Date.now(),
                metadata: { path: uri.fsPath, detectedVia: 'file-watcher' },
            });
            outputChannel.appendLine(`[File Watcher] ${label} detected at ${uri.fsPath}`);
        }, 300);

        watcher.onDidCreate(debounced);
        watcher.onDidChange(debounced);
        watcher.onDidDelete(() => {});
        disposables.push(watcher);
    }
}

function debounce<T extends (...args: any[]) => void>(fn: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), wait);
    };
}
