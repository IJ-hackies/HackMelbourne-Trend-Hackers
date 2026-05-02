import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { GitEventType } from '@git-gud/core';

const pexec = promisify(exec);

type Emit = (type: GitEventType, metadata: Record<string, unknown>) => Promise<void> | void;

interface BlockDescriptor {
  id: number;
  ours: string;
  theirs: string;
  anchorBefore: string;
  anchorAfter: string;
}

interface FileState {
  totalBlocks: number;
  blocks: BlockDescriptor[];
}

const ANCHOR_LINES = 3;
const SNIPPET_MAX = 400;

export class MergeConflictTracker {
  private files: Map<string, FileState> = new Map();
  private disposables: vscode.Disposable[] = [];
  private active = false;

  constructor(private repoPath: string, private emit: Emit) {}

  async start(seedFiles?: string[]) {
    if (this.active) return;
    this.active = true;

    let files = (seedFiles ?? []).map(f => path.isAbsolute(f) ? f : path.join(this.repoPath, f));
    if (files.length === 0) {
      for (let attempt = 0; attempt < 5 && files.length === 0; attempt++) {
        files = await this.listConflictedFiles();
        if (files.length === 0) await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
      }
    }

    for (const f of files) {
      this.initFile(f);
      fs.watchFile(f, { interval: 600 }, () => {
        try {
          const content = fs.readFileSync(f, 'utf-8');
          this.onSave(f, content);
        } catch {}
      });
    }

    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument(doc => this.onSave(doc.uri.fsPath, doc.getText())),
    );

    for (const [absPath, state] of this.files) {
      const relPath = path.relative(this.repoPath, absPath);
      for (const block of state.blocks) {
        await this.emit('conflict-block-preview' as GitEventType, {
          filePath: relPath,
          blockIndex: block.id,
          totalBlocks: state.totalBlocks,
          oursSnippet: this.truncate(block.ours),
          theirsSnippet: this.truncate(block.theirs),
        });
      }
    }
  }

  stop() {
    this.active = false;
    for (const f of this.files.keys()) { try { fs.unwatchFile(f); } catch {} }
    this.files.clear();
    for (const d of this.disposables) { try { d.dispose(); } catch {} }
    this.disposables = [];
  }

  private async listConflictedFiles(): Promise<string[]> {
    try {
      const { stdout } = await pexec('git diff --name-only --diff-filter=U', { cwd: this.repoPath });
      return stdout.trim().split('\n').filter(Boolean).map(f => path.join(this.repoPath, f));
    } catch { return []; }
  }

  private initFile(absPath: string) {
    try {
      const content = fs.readFileSync(absPath, 'utf-8');
      const blocks = this.extractBlocks(content);
      this.files.set(absPath, { totalBlocks: blocks.length, blocks });
    } catch {}
  }

  private extractBlocks(content: string): BlockDescriptor[] {
    const lines = content.split('\n');
    const blocks: BlockDescriptor[] = [];
    let i = 0, id = 0;
    while (i < lines.length) {
      if (lines[i].startsWith('<<<<<<<')) {
        const startIdx = i;
        const oursLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('=======') && !lines[i].startsWith('>>>>>>>')) {
          oursLines.push(lines[i]); i++;
        }
        if (i >= lines.length || !lines[i].startsWith('=======')) { i++; continue; }
        i++;
        const theirsLines: string[] = [];
        while (i < lines.length && !lines[i].startsWith('>>>>>>>')) {
          theirsLines.push(lines[i]); i++;
        }
        if (i >= lines.length) break;
        const endIdx = i;
        const anchorBefore = lines.slice(Math.max(0, startIdx - ANCHOR_LINES), startIdx).join('\n');
        const anchorAfter = lines.slice(endIdx + 1, endIdx + 1 + ANCHOR_LINES).join('\n');
        blocks.push({ id: id++, ours: oursLines.join('\n'), theirs: theirsLines.join('\n'), anchorBefore, anchorAfter });
        i++;
      } else { i++; }
    }
    return blocks;
  }

  private classifyResolution(resolution: string, ours: string, theirs: string): string {
    const r = resolution.trim(), o = ours.trim(), t = theirs.trim();
    if (r === '') return 'deleted';
    if (r === o) return 'kept_ours';
    if (r === t) return 'kept_theirs';
    if (o.length > 0 && r.includes(o) && t.length > 0 && r.includes(t)) return 'merged_both';
    return 'custom_edit';
  }

  private extractResolution(newContent: string, anchorBefore: string, anchorAfter: string): string | null {
    if (!anchorBefore && !anchorAfter) return null;
    const idxBefore = anchorBefore ? newContent.indexOf(anchorBefore) : 0;
    if (idxBefore < 0) return null;
    const startSearch = idxBefore + anchorBefore.length;
    const idxAfter = anchorAfter ? newContent.indexOf(anchorAfter, startSearch) : newContent.length;
    if (idxAfter < 0 || idxAfter < startSearch) return null;
    return newContent.slice(startSearch, idxAfter).replace(/^\n|\n$/g, '');
  }

  private truncate(s: string, max = SNIPPET_MAX): string {
    return s.length <= max ? s : s.slice(0, max) + '...';
  }

  private async onSave(absPath: string, content: string) {
    if (!this.active) return;
    const state = this.files.get(absPath);
    if (!state) {
      if (/^<{7}/m.test(content)) this.initFile(absPath);
      return;
    }

    const currentBlocks = this.extractBlocks(content);
    if (currentBlocks.length >= state.blocks.length) return;

    const stillPresentIds = new Set<number>();
    for (const cur of currentBlocks) {
      const match = state.blocks.find(b => !stillPresentIds.has(b.id) && b.ours === cur.ours && b.theirs === cur.theirs);
      if (match) stillPresentIds.add(match.id);
    }

    const resolved = state.blocks.filter(b => !stillPresentIds.has(b.id));
    state.blocks = state.blocks.filter(b => stillPresentIds.has(b.id));
    const remaining = state.blocks.length;
    const relPath = path.relative(this.repoPath, absPath);

    for (const block of resolved) {
      const resolution = this.extractResolution(content, block.anchorBefore, block.anchorAfter);
      const resolutionType = resolution !== null ? this.classifyResolution(resolution, block.ours, block.theirs) : 'custom_edit';
      await this.emit('conflict-block-resolved' as GitEventType, {
        filePath: relPath, remainingBlocks: remaining, totalBlocks: state.totalBlocks,
        resolutionType, resolvedSnippet: resolution ? this.truncate(resolution) : undefined,
        oursSnippet: this.truncate(block.ours), theirsSnippet: this.truncate(block.theirs), blockIndex: block.id,
      });
    }

    if (remaining === 0) {
      await this.emit('file-fully-resolved' as GitEventType, { filePath: relPath, totalBlocks: state.totalBlocks });
      this.files.delete(absPath);
      try { fs.unwatchFile(absPath); } catch {}
    }
  }
}
