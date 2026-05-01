import { GitEventType } from '@git-gud/core';
import type { GitEvent } from '@git-gud/core';
import * as vscode from 'vscode';
import * as cp from 'child_process';

const outputChannel = vscode.window.createOutputChannel('Git Gud');

export function getOutputChannel(): vscode.OutputChannel {
    return outputChannel;
}

export function detectGitEvents(
    onEvent: (event: GitEvent) => void,
    disposables: vscode.Disposable[]
): void {
    const workspaceFolders = vscode.workspace.workspaceFolders || [];

    for (const folder of workspaceFolders) {
        // Check if it's a git repo by looking for .git folder
        const gitWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(folder, '.git/logs/HEAD')
        );

        let lastCommitHash = '';

        const handleGitActivity = debounce(async () => {
            try {
                const info = await getLastCommitInfo(folder.uri.fsPath);
                if (!info || !info.commitHash || info.commitHash === lastCommitHash) {
                    return;
                }
                lastCommitHash = info.commitHash;

                const isDefaultBranch = ['main', 'master', 'develop'].includes(info.branch);

                onEvent({
                    type: GitEventType.Commit,
                    timestamp: Date.now(),
                    metadata: {
                        message: info.message,
                        branch: info.branch,
                        isDefaultBranch,
                        filesChanged: info.filesChanged || 1,
                        insertions: info.insertions || 0,
                        deletions: info.deletions || 0,
                    },
                });
                outputChannel.appendLine(`[Git Gud] Commit detected: "${info.message}" on ${info.branch}`);
            } catch (err: any) {
                outputChannel.appendLine(`[Git Gud] Error: ${err?.message || err}`);
            }
        }, 800);

        gitWatcher.onDidChange(handleGitActivity);
        gitWatcher.onDidCreate(handleGitActivity);
        disposables.push(gitWatcher);

        // Watch MERGE_HEAD for conflicts
        const mergeWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(folder, '.git/MERGE_HEAD')
        );
        mergeWatcher.onDidCreate(() => {
            onEvent({
                type: GitEventType.MergeConflict,
                timestamp: Date.now(),
                metadata: { detectedVia: 'MERGE_HEAD' },
            });
            outputChannel.appendLine('[Git Gud] Merge conflict detected');
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
                metadata: { detectedVia: 'HEAD change' },
            });
            outputChannel.appendLine('[Git Gud] Branch switch detected');
        });
        disposables.push(headWatcher);
    }
}

function getLastCommitInfo(repoPath: string): Promise<{
    commitHash: string;
    message: string;
    branch: string;
    filesChanged: number;
    insertions: number;
    deletions: number;
}> {
    return new Promise((resolve, reject) => {
        // Get commit hash + message + stats all in one command
        cp.exec(
            'git log -1 --pretty=format:"%H|%s" --shortstat',
            { cwd: repoPath, encoding: 'utf-8' },
            (err: cp.ExecException | null, stdout: string) => {
                if (err || !stdout) {
                    reject(err);
                    return;
                }
                const lines = stdout.trim().split('\n');
                const parts = lines[0].split('|');
                const commitHash = parts[0];
                const message = parts.slice(1).join('|');

                // Parse stats from the second line (if present)
                const statsLine = lines[1] || '';
                let filesChanged = 0, insertions = 0, deletions = 0;
                const fcMatch = statsLine.match(/(\d+) file/);
                const insMatch = statsLine.match(/(\d+) insertion/);
                const delMatch = statsLine.match(/(\d+) deletion/);
                if (fcMatch) filesChanged = parseInt(fcMatch[1]);
                if (insMatch) insertions = parseInt(insMatch[1]);
                if (delMatch) deletions = parseInt(delMatch[1]);

                // Get current branch
                cp.exec(
                    'git branch --show-current',
                    { cwd: repoPath, encoding: 'utf-8' },
                    (err2: cp.ExecException | null, branchOut: string) => {
                        const branch = (!err2 && branchOut) ? branchOut.trim() : 'unknown';
                        resolve({ commitHash, message, branch, filesChanged, insertions, deletions });
                    }
                );
            }
        );
    });
}

function debounce<T extends (...args: any[]) => void>(fn: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), wait);
    };
}
