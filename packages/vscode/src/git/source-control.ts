import * as vscode from 'vscode';

export interface SCBranch {
  name: string;
  remote?: string;
  isRemote: boolean;
  full: string;
}

export interface SCChange {
  path: string;
  status: string;
}

export interface SourceControlSnapshot {
  available: boolean;
  branch: string | null;
  branches: SCBranch[];
  changes: SCChange[];
  ahead: number;
  behind: number;
  hasUpstream: boolean;
}

interface GitAPI {
  repositories: GitRepository[];
  onDidOpenRepository: vscode.Event<GitRepository>;
  onDidCloseRepository: vscode.Event<GitRepository>;
}

interface GitRepository {
  rootUri: vscode.Uri;
  state: {
    HEAD?: { name?: string; upstream?: { remote: string; name: string }; ahead?: number; behind?: number };
    refs: Array<{ type: number; name?: string; remote?: string }>;
    workingTreeChanges: Array<{ uri: vscode.Uri; status: number }>;
    indexChanges: Array<{ uri: vscode.Uri; status: number }>;
    mergeChanges: Array<{ uri: vscode.Uri; status: number }>;
    onDidChange: vscode.Event<void>;
  };
  add(resources: vscode.Uri[]): Promise<void>;
  commit(message: string, opts?: { amend?: boolean; all?: boolean; signoff?: boolean }): Promise<void>;
  push(remoteName?: string, branchName?: string, setUpstream?: boolean): Promise<void>;
  pull(): Promise<void>;
  checkout(treeish: string): Promise<void>;
  createBranch(name: string, checkout: boolean, ref?: string): Promise<void>;
  diff(cached?: boolean): Promise<string>;
}

const STATUS_MAP: Record<number, string> = {
  0: 'M', 1: 'A', 2: 'D', 3: 'R', 4: 'C',
  5: 'M', 6: 'D', 7: 'U', 8: 'I', 9: 'A',
  10: 'C', 11: 'C', 12: 'C', 13: 'C', 14: 'C', 15: 'C', 16: 'C',
};

export class SourceControlManager {
  private api: GitAPI | null = null;
  private repo: GitRepository | null = null;
  private disposables: vscode.Disposable[] = [];
  private debounceTimer: NodeJS.Timeout | undefined;

  constructor(private readonly onChange: (snap: SourceControlSnapshot) => void) {}

  async init(): Promise<void> {
    const ext = vscode.extensions.getExtension<{ getAPI(version: 1): GitAPI }>('vscode.git');
    if (!ext) {
      this.emit();
      return;
    }
    if (!ext.isActive) await ext.activate();
    this.api = ext.exports.getAPI(1);
    this.bindRepo();
    this.disposables.push(this.api.onDidOpenRepository(() => this.bindRepo()));
    this.disposables.push(this.api.onDidCloseRepository(() => this.bindRepo()));
    this.emit();
  }

  private bindRepo() {
    if (!this.api) return;
    const next = this.api.repositories[0] ?? null;
    if (next === this.repo) return;
    this.repo = next;
    if (this.repo) {
      this.disposables.push(this.repo.state.onDidChange(() => this.scheduleEmit()));
    }
    this.scheduleEmit();
  }

  private scheduleEmit() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.emit(), 150);
  }

  private emit() {
    this.onChange(this.snapshot());
  }

  snapshot(): SourceControlSnapshot {
    if (!this.repo) {
      return { available: false, branch: null, branches: [], changes: [], ahead: 0, behind: 0, hasUpstream: false };
    }
    const s = this.repo.state;
    const branch = s.HEAD?.name ?? null;
    const branches: SCBranch[] = [];
    const seen = new Set<string>();
    for (const ref of s.refs) {
      if (ref.type === 0 && ref.name) {
        if (seen.has(`L:${ref.name}`)) continue;
        seen.add(`L:${ref.name}`);
        branches.push({ name: ref.name, isRemote: false, full: ref.name });
      } else if (ref.type === 1 && ref.name) {
        const key = `R:${ref.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const [remote, ...rest] = ref.name.split('/');
        branches.push({ name: rest.join('/'), remote, isRemote: true, full: ref.name });
      }
    }
    const seenPaths = new Set<string>();
    const changes: SCChange[] = [];
    for (const c of [...s.indexChanges, ...s.workingTreeChanges, ...s.mergeChanges]) {
      const p = vscode.workspace.asRelativePath(c.uri);
      if (seenPaths.has(p)) continue;
      seenPaths.add(p);
      changes.push({ path: p, status: STATUS_MAP[c.status] ?? '?' });
    }
    return {
      available: true,
      branch,
      branches,
      changes,
      ahead: s.HEAD?.ahead ?? 0,
      behind: s.HEAD?.behind ?? 0,
      hasUpstream: !!s.HEAD?.upstream,
    };
  }

  rootUri(): vscode.Uri | null {
    return this.repo?.rootUri ?? null;
  }

  async getDiff(): Promise<string> {
    if (!this.repo) return '';
    try {
      return await this.repo.diff(false);
    } catch {
      return '';
    }
  }

  async stageAllAndCommit(message: string, amend: boolean): Promise<void> {
    if (!this.repo) throw new Error('No Git repository.');
    const snap = this.snapshot();
    if (snap.changes.length === 0 && !amend) throw new Error('No changes to commit.');
    await this.repo.commit(message, { all: true, amend });
  }

  async push(): Promise<{ ok: boolean; needsPull?: boolean; error?: string }> {
    if (!this.repo) return { ok: false, error: 'No Git repository.' };
    const snap = this.snapshot();
    try {
      if (!snap.hasUpstream && snap.branch) {
        await this.repo.push('origin', snap.branch, true);
      } else {
        await this.repo.push();
      }
      return { ok: true };
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      const needsPull = /non-fast-forward|fetch first|rejected/i.test(msg);
      return { ok: false, needsPull, error: msg };
    }
  }

  async pullAndPush(): Promise<{ ok: boolean; error?: string }> {
    if (!this.repo) return { ok: false, error: 'No Git repository.' };
    try {
      await this.repo.pull();
      await this.repo.push();
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: String(e?.message ?? e) };
    }
  }

  async checkout(branch: SCBranch): Promise<void> {
    if (!this.repo) throw new Error('No Git repository.');
    if (branch.isRemote) {
      const localName = branch.name;
      const existsLocal = this.snapshot().branches.some(b => !b.isRemote && b.name === localName);
      if (existsLocal) {
        await this.repo.checkout(localName);
      } else {
        await this.repo.createBranch(localName, true, branch.full);
      }
    } else {
      await this.repo.checkout(branch.name);
    }
  }

  dispose() {
    for (const d of this.disposables) { try { d.dispose(); } catch {} }
    this.disposables = [];
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }
}
