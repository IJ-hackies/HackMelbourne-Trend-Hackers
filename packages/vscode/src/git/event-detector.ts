import { GitEventType } from '@git-gud/core';
import type { GitEvent } from '@git-gud/core';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const outputChannel = vscode.window.createOutputChannel('Git Gud');

export function getOutputChannel(): vscode.OutputChannel {
    return outputChannel;
}

export function detectGitEvents(
    onEvent: (event: GitEvent) => void,
    disposables: vscode.Disposable[]
): void {
    // We watch the .git directory of every workspace folder
    const workspaceFolders = vscode.workspace.workspaceFolders || [];

    for (const folder of workspaceFolders) {
        const gitDir = path.join(folder.uri.fsPath, '.git');
        if (!fs.existsSync(gitDir)) {
            continue; // Not a git repo
        }

        // Watch COMMIT_EDITMSG for commit messages being written
        const commitMsgPath = path.join(gitDir, 'COMMIT_EDITMSG');
        const logHeadPath = path.join(gitDir, 'logs', 'HEAD');
        const mergeHeadPath = path.join(gitDir, 'MERGE_HEAD');
        const rebaseDir = path.join(gitDir, 'rebase-merge');

        // Watch logs/HEAD for any git operation (commit, push, merge, etc.)
        const logWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(folder, '.git/logs/HEAD')
        );

        let lastCommitMessage = '';
        let lastCommitHash = '';

        const handleLogChange = debounce(async () => {
            try {
                // Try to read the commit message being prepared
                if (fs.existsSync(commitMsgPath)) {
                    const msg = fs.readFileSync(commitMsgPath, 'utf-8').trim();
                    if (msg && !msg.startsWith('#')) {
                        lastCommitMessage = msg.split('\n')[0].trim(); // First line only
                    }
                }

                // Get current branch
                const headRef = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf-8').trim();
                const branch = headRef.replace('ref: refs/heads/', '').trim();
                const isDefaultBranch = ['main', 'master', 'develop'].includes(branch);

                // Check for rebase
                if (fs.existsSync(rebaseDir)) {
                    onEvent({
                        type: GitEventType.Rebase,
                        timestamp: Date.now(),
                        metadata: { branch, detectedVia: 'file-watcher' },
                    });
                    outputChannel.appendLine(`[Git Gud] Rebase detected on ${branch}`);
                }

                // Check for merge conflict
                if (fs.existsSync(mergeHeadPath)) {
                    onEvent({
                        type: GitEventType.MergeConflict,
                        timestamp: Date.now(),
                        metadata: { branch, detectedVia: 'file-watcher' },
                    });
                    outputChannel.appendLine(`[Git Gud] Merge conflict detected on ${branch}`);
                }

                // Try to get last commit info
                const { commitHash, message, filesChanged, insertions, deletions } = await getLastCommitInfo(folder.uri.fsPath);

                if (commitHash && commitHash !== lastCommitHash && message) {
                    lastCommitHash = commitHash;

                    onEvent({
                        type: GitEventType.Commit,
                        timestamp: Date.now(),
                        metadata: {
                            message: message || lastCommitMessage,
                            branch,
                            isDefaultBranch,
                            filesChanged: filesChanged || 1,
                            insertions: insertions || 0,
                            deletions: deletions || 0,
                        },
                    });
                    outputChannel.appendLine(`[Git Gud] Commit detected: "${message || lastCommitMessage}" on ${branch}`);
                }

            } catch (err) {
                outputChannel.appendLine(`[Git Gud] Error: ${err}`);
            }
        }, 500);

        logWatcher.onDidChange(handleLogChange);
        logWatcher.onDidCreate(handleLogChange);
        disposables.push(logWatcher);

        // Also watch MERGE_HEAD for conflicts appearing/disappearing
        const mergeWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(folder, '.git/MERGE_HEAD')
        );
        mergeWatcher.onDidCreate(() => {
            onEvent({
                type: GitEventType.MergeConflict,
                timestamp: Date.now(),
                metadata: { branch: 'unknown', detectedVia: 'MERGE_HEAD watcher' },
            });
            outputChannel.appendLine('[Git Gud] MERGE_HEAD created — merge conflict in progress');
        });
        disposables.push(mergeWatcher);

        // Watch HEAD for branch switches
        const headWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(folder, '.git/HEAD')
        );
        headWatcher.onDidChange(() => {
            onEvent({
                type: GitEventType.BranchSwitch,
                timestamp: Date.now(),
                metadata: { detectedVia: 'HEAD watcher' },
            });
            outputChannel.appendLine('[Git Gud] Branch switch detected');
        });
        disposables.push(headWatcher);
    }
}

async function getLastCommitInfo(repoPath: string): Promise<{ commitHash: string; message: string; filesChanged: number; insertions: number; deletions: number }> {
    return new Promise((resolve) => {
        const cp = require('child_process');
        // Get last commit hash and message
        cp.exec('git log -1 --pretty=format:"%H|%s"', { cwd: repoPath }, (err: any, stdout: string) => {
            if (err || !stdout) {
                resolve({ commitHash: '', message: '', filesChanged: 0, insertions: 0, deletions: 0 });
                return;
            }
            const parts = stdout.trim().split('|');
            const commitHash = parts[0];
            const message = parts.slice(1).join('|');

            // Get stats for that commit
            cp.exec('git log -1 --shortstat --pretty=format:""', { cwd: repoPath }, (err2: any, statsOut: string) => {
                let filesChanged = 0, insertions = 0, deletions = 0;
                if (!err2 && statsOut) {
                    const fcMatch = statsOut.match(/(\d+) file/);
                    const insMatch = statsOut.match(/(\d+) insertion/);
                    const delMatch = statsOut.match(/(\d+) deletion/);
                    if (fcMatch) filesChanged = parseInt(fcMatch[1]);
                    if (insMatch) insertions = parseInt(insMatch[1]);
                    if (delMatch) deletions = parseInt(delMatch[1]);
                }
                resolve({ commitHash, message, filesChanged, insertions, deletions });
            });
        });
    });
}

function debounce<T extends (...args: any[]) => void>(fn: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), wait);
    };
}
