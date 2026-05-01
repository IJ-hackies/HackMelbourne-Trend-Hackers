import type { GitEventType } from '@git-gud/core';

export interface RawGitSignal {
  source: 'git-api' | 'file-watcher';
  type: GitEventType;
  timestamp: number;
  commitMessage?: string;
  branchName?: string;
  previousBranchName?: string;
  filesChanged?: number;
  insertions?: number;
  deletions?: number;
  files?: string[];
  isDefaultBranch?: boolean;
}
