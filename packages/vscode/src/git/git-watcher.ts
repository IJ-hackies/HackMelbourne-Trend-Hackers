import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import type { GitEventType } from '@git-gud/core';

interface GitEventPayload {
  type: GitEventType;
  timestamp: number;
  repoPath: string;
  metadata: Record<string, unknown>;
}

type EventHandler = (event: GitEventPayload) => Promise<void> | void;

export class GitWatcher {
  private disposables: vscode.Disposable[] = [];
  private mergeConflictActive = false;
  private rebaseActive = false;
  private remoteHashes: Record<string, string | null> = {};
  private lastHead: string | null = null;
  private lastCommitMsg: string | null = null;
  private out: vscode.OutputChannel;

  constructor(private onEvent: EventHandler) {
    this.out = vscode.window.createOutputChannel('Git Gud');
  }

  start() {
    const root = this.workspacePath();
    if (!root) { this.out.appendLine('No workspace folder open.'); return; }
    const gitDir = path.join(root, '.git');
    if (!fs.existsSync(gitDir)) { this.out.appendLine(`No .git directory at ${gitDir}`); return; }

    this.lastHead = this.readGitFile('HEAD');
    this.lastCommitMsg = this.readGitFile('COMMIT_EDITMSG');
    this.out.appendLine(`Git Gud watching ${gitDir}`);
    this.out.appendLine(`Initial HEAD: ${this.lastHead}`);

    this.setupWatchers(root);
    this.checkConflictAndRebaseState(gitDir);
    this.out.show(true);
  }

  private workspacePath(): string | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  private readGitFile(...parts: string[]): string | null {
    const root = this.workspacePath();
    if (!root) return null;
    const p = path.join(root, '.git', ...parts);
    try { return fs.readFileSync(p, 'utf-8').trim(); } catch { return null; }
  }

  private currentBranch(): string {
    const head = this.readGitFile('HEAD') ?? '';
    return head.replace('ref: refs/heads/', '');
  }

  private emit(type: GitEventType, metadata: Record<string, unknown> = {}) {
    const root = this.workspacePath();
    if (!root) return;
    this.out.appendLine(`→ event: ${type} ${JSON.stringify(metadata)}`);
    void Promise.resolve(this.onEvent({ type, timestamp: Date.now(), repoPath: root, metadata })).catch(err => {
      this.out.appendLine(`[ERROR] ${type}: ${err}`);
    });
  }

  private setupWatchers(root: string) {
    const folder = vscode.workspace.workspaceFolders![0];
    const gitDir = path.join(root, '.git');

    const pattern = new vscode.RelativePattern(folder, '.git/**');
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);

    const handle = (uri: vscode.Uri) => {
      const rel = path.relative(gitDir, uri.fsPath).replace(/\\/g, '/');
      this.handleGitFileChange(rel, gitDir);
    };
    this.disposables.push(
      watcher.onDidChange(handle),
      watcher.onDidCreate(handle),
      watcher.onDidDelete(handle),
      watcher,
    );
  }

  private handleGitFileChange(rel: string, gitDir: string) {
    if (rel === 'COMMIT_EDITMSG') {
      const msg = this.readGitFile('COMMIT_EDITMSG') ?? '';
      if (msg && msg !== this.lastCommitMsg) {
        this.lastCommitMsg = msg;
        const branch = this.currentBranch();
        const DEFAULT_BRANCHES = new Set(['main', 'master', 'develop', 'development', 'dev']);
        this.emit('commit', {
          message: msg,
          branch,
          commitMessage: msg,
          branchName: branch,
          isDefaultBranch: DEFAULT_BRANCHES.has(branch.toLowerCase()),
        });
      }
      return;
    }

    if (rel === 'HEAD') {
      const newHead = this.readGitFile('HEAD');
      if (newHead && newHead !== this.lastHead) {
        const prev = this.lastHead?.replace('ref: refs/heads/', '') ?? '';
        const next = newHead.replace('ref: refs/heads/', '');
        this.lastHead = newHead;
        if (prev !== next) {
          this.emit('branch-switch', { branchName: next, previousBranch: prev, branch: next });
        }
      }
      return;
    }

    if (rel === 'MERGE_HEAD' || rel.startsWith('rebase-merge') || rel.startsWith('rebase-apply')) {
      this.checkConflictAndRebaseState(gitDir);
      return;
    }

    const remoteLogMatch = rel.match(/^logs\/refs\/remotes\/origin\/(.+)$/);
    if (remoteLogMatch) {
      this.handleRemoteLogChange(path.join(gitDir, rel), remoteLogMatch[1]);
      return;
    }
  }

  private checkConflictAndRebaseState(gitDir: string) {
    const mergeExists = fs.existsSync(path.join(gitDir, 'MERGE_HEAD'));
    if (mergeExists && !this.mergeConflictActive) {
      this.mergeConflictActive = true;
      this.emit('merge-conflict', { branchName: this.currentBranch() });
    } else if (!mergeExists && this.mergeConflictActive) {
      this.mergeConflictActive = false;
      this.emit('merge-conflict-resolved', { branchName: this.currentBranch() });
    }

    const rebaseExists =
      fs.existsSync(path.join(gitDir, 'rebase-merge')) ||
      fs.existsSync(path.join(gitDir, 'rebase-apply'));
    if (rebaseExists && !this.rebaseActive) {
      this.rebaseActive = true;
      this.emit('rebase', { branchName: this.currentBranch() });
    } else if (!rebaseExists && this.rebaseActive) {
      this.rebaseActive = false;
      this.emit('rebase-complete', { branchName: this.currentBranch() });
    }
  }

  private handleRemoteLogChange(logPath: string, branchName: string) {
    const lines = this.readLogLines(logPath);
    if (lines.length === 0) return;
    const last = lines[lines.length - 1];
    const parts = last.split('\t')[0].split(' ');
    const newHash = parts[1];
    const prev = this.remoteHashes[branchName];
    if (newHash === prev) return;
    this.remoteHashes[branchName] = newHash;

    const onMain = this.currentBranch() === branchName && (branchName === 'main' || branchName === 'master');
    if (onMain) this.emit('push-to-main', { branchName });

    if (last.includes('forced-update') || last.toLowerCase().includes('force')) {
      this.emit('force-push', { branchName });
    }
  }

  private readLogLines(logPath: string): string[] {
    try {
      return fs.readFileSync(logPath, 'utf-8').trim().split('\n').filter(Boolean);
    } catch { return []; }
  }

  dispose() {
    for (const d of this.disposables) { try { d.dispose(); } catch {} }
    this.disposables = [];
    this.out.dispose();
  }
}
