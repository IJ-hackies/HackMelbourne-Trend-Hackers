export type GitEventType =
  | 'commit'
  | 'branch-switch'
  | 'push'
  | 'force-push'
  | 'rebase'
  | 'merge'
  | 'merge-conflict';

export interface GitEvent {
  type: GitEventType;
  timestamp: number;
  metadata: Record<string, unknown>;
}

export interface Score {
  total: number;
  delta: number;
  breakdown: Record<string, number>;
}

export interface Rank {
  id: string;
  name: string;
  tier: number;
  threshold: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress: number;
}

export interface Roast {
  message: string;
  severity: 'mild' | 'medium' | 'savage';
  advice: string;
}

export interface PlayerStats {
  totalCommits: number;
  totalForcePushes: number;
  totalMergeConflicts: number;
  totalBranchSwitches: number;
  totalPushes: number;
  totalRebases: number;
  totalMerges: number;
  directMainPushes: number;
  hardResets: number;
  deletedRemoteBranches: number;
  cleanCommitStreak: number;
  longestCleanStreak: number;
  totalFilesChanged: number;
  totalInsertions: number;
  totalDeletions: number;
  uniqueBranches: Set<string>;
  readmeEdits: number;
  sessionsOver4Hours: number;
  lateNightCommits: number;
  weekendCommits: number;
  panicBursts: number;
  commitsInCurrentSession: number;
  averageCommitSize: number;
  score: number;
}
