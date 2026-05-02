import * as vscode from 'vscode';
import type { GitEvent } from '@git-gud/core';

const DEMO_EVENTS: Array<{ delayMs: number; event: Omit<GitEvent, 'timestamp'> }> = [
  {
    delayMs: 0,
    event: {
      type: 'branch-switch',
      metadata: { branchName: 'temp-final-FINAL-v2-67', branch: 'temp-final-FINAL-v2-67' },
    },
  },
  {
    delayMs: 1500,
    event: {
      type: 'commit',
      metadata: {
        message: 'fix',
        branchName: 'temp-final-FINAL-v2-67',
        stats: { filesChanged: 1, insertions: 2, deletions: 1 },
      },
    },
  },
  {
    delayMs: 1500,
    event: {
      type: 'commit',
      metadata: {
        message: 'stuff',
        branchName: 'main',
        stats: { filesChanged: 47, insertions: 2400, deletions: 1100 },
      },
    },
  },
  {
    delayMs: 1500,
    event: {
      type: 'merge-conflict',
      metadata: { changedFiles: ['src/auth.ts', 'src/db.ts', 'README.md'] },
    },
  },
  {
    delayMs: 1500,
    event: {
      type: 'force-push',
      metadata: { branchName: 'main', branch: 'main' },
    },
  },
  {
    delayMs: 1500,
    event: {
      type: 'push-to-main',
      metadata: { branchName: 'main', branch: 'main' },
    },
  },
];

export async function runDemo(handleEvent: (event: GitEvent) => Promise<void>): Promise<void> {
  vscode.window.showInformationMessage('🎬 Git Gud demo starting — strap in.');
  for (const step of DEMO_EVENTS) {
    if (step.delayMs > 0) {
      await new Promise((r) => setTimeout(r, step.delayMs));
    }
    await handleEvent({ ...step.event, timestamp: Date.now() });
  }
}
