import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import type { RawGitSignal } from './types';

type GitAPI = {
  repositories: GitRepository[];
  onDidOpenRepository: vscode.Event<GitRepository>;
};

type GitRepository = {
  state: {
    HEAD?: { name?: string; commit?: string };
    onDidChange: vscode.Event<void>;
  };
  rootUri: vscode.Uri;
};

export class GitEventDetector implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private lastHeadCommit: string | undefined;
  private lastBranchName: string | undefined;
  private gitRepo: GitRepository | undefined;
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  private readonly _onEvent = new vscode.EventEmitter<RawGitSignal>();
  readonly onEvent = this._onEvent.event;

  async initialize(): Promise<boolean> {
    const gitExtension = vscode.extensions.getExtension<{ getAPI(version: number): GitAPI }>('vscode.git');
    if (!gitExtension) {
      return false;
    }

    const git = gitExtension.isActive
      ? gitExtension.exports.getAPI(1)
      : (await gitExtension.activate()).getAPI(1);

    if (git.repositories.length > 0) {
      this.watchRepository(git.repositories[0]);
    }

    this.disposables.push(
      git.onDidOpenRepository((repo) => {
        if (!this.gitRepo) {
          this.watchRepository(repo);
        }
      }),
    );

    return !!this.gitRepo;
  }

  private watchRepository(repo: GitRepository): void {
    this.gitRepo = repo;
    this.lastHeadCommit = repo.state.HEAD?.commit;
    this.lastBranchName = repo.state.HEAD?.name;

    this.disposables.push(
      repo.state.onDidChange(() => this.onRepositoryChange()),
    );

    this.setupFileWatchers(repo.rootUri.fsPath);
  }

  private onRepositoryChange(): void {
    if (!this.gitRepo) return;

    const head = this.gitRepo.state.HEAD;
    const currentCommit = head?.commit;
    const currentBranch = head?.name;

    if (currentBranch && currentBranch !== this.lastBranchName) {
      const previousBranch = this.lastBranchName;
      this.lastBranchName = currentBranch;
      this.emit({
        source: 'git-api',
        type: 'branch-switch',
        timestamp: Date.now(),
        branchName: currentBranch,
        previousBranchName: previousBranch,
      });
    }

    if (currentCommit && currentCommit !== this.lastHeadCommit) {
      this.lastHeadCommit = currentCommit;
      this.lastBranchName = currentBranch;
      this.detectCommit();
    }
  }

  private detectCommit(): void {
    if (!this.gitRepo) return;
    const cwd = this.gitRepo.rootUri.fsPath;

    this.gitExec(cwd, ['log', '-1', '--format=%B'], (message) => {
      if (!message) return;

      this.gitExec(cwd, ['diff', '--stat', 'HEAD~1', 'HEAD'], (statOutput) => {
        const stats = this.parseDiffStat(statOutput ?? '');
        const branchName = this.gitRepo?.state.HEAD?.name;
        const DEFAULT_BRANCHES = new Set(['main', 'master', 'develop', 'development', 'dev']);

        this.emit({
          source: 'git-api',
          type: 'commit',
          timestamp: Date.now(),
          commitMessage: message.trim(),
          branchName,
          isDefaultBranch: branchName ? DEFAULT_BRANCHES.has(branchName.toLowerCase()) : false,
          ...stats,
        });
      });
    });
  }

  private parseDiffStat(output: string): { filesChanged: number; insertions: number; deletions: number } {
    const result = { filesChanged: 0, insertions: 0, deletions: 0 };
    const summary = output.trim().split('\n').pop();
    if (!summary) return result;

    const filesMatch = summary.match(/(\d+) files? changed/);
    const insertMatch = summary.match(/(\d+) insertions?\(\+\)/);
    const deleteMatch = summary.match(/(\d+) deletions?\(-\)/);

    if (filesMatch) result.filesChanged = parseInt(filesMatch[1], 10);
    if (insertMatch) result.insertions = parseInt(insertMatch[1], 10);
    if (deleteMatch) result.deletions = parseInt(deleteMatch[1], 10);

    return result;
  }

  private setupFileWatchers(repoRoot: string): void {
    const gitDir = path.join(repoRoot, '.git');
    if (!fs.existsSync(gitDir)) return;

    const mergeHeadWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(gitDir, 'MERGE_HEAD'),
    );
    mergeHeadWatcher.onDidCreate(() => {
      this.debounced('merge-conflict', () => {
        this.emit({
          source: 'file-watcher',
          type: 'merge-conflict',
          timestamp: Date.now(),
          branchName: this.gitRepo?.state.HEAD?.name,
        });
      });
    });
    this.disposables.push(mergeHeadWatcher);

    const rebaseWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(gitDir, '{rebase-merge,rebase-apply}/**'),
    );
    rebaseWatcher.onDidCreate(() => {
      this.debounced('rebase', () => {
        this.emit({
          source: 'file-watcher',
          type: 'rebase',
          timestamp: Date.now(),
          branchName: this.gitRepo?.state.HEAD?.name,
        });
      });
    });
    this.disposables.push(rebaseWatcher);
  }

  private debounced(key: string, fn: () => void, delayMs = 1000): void {
    const existing = this.debounceTimers.get(key);
    if (existing) clearTimeout(existing);
    this.debounceTimers.set(key, setTimeout(() => {
      this.debounceTimers.delete(key);
      fn();
    }, delayMs));
  }

  private emit(signal: RawGitSignal): void {
    this._onEvent.fire(signal);
  }

  private gitExec(cwd: string, args: string[], callback: (stdout: string | null) => void): void {
    cp.execFile('git', args, { cwd, timeout: 5000 }, (err, stdout) => {
      callback(err ? null : stdout);
    });
  }

  dispose(): void {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
    this._onEvent.dispose();
  }
}
