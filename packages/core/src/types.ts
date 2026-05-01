export type GitEventType =
  | 'commit'
  | 'branch_switch'
  | 'merge_conflict_start'
  | 'merge_conflict_resolved'
  | 'conflict_block_preview'
  | 'conflict_block_resolved'
  | 'file_fully_resolved'
  | 'rebase_start'
  | 'rebase_complete'
  | 'push_to_main'
  | 'force_push';

export interface GitEventMetadata {
  commitMessage?: string;
  branchName?: string;
  previousBranch?: string;
  filesChanged?: number;
  insertions?: number;
  deletions?: number;
  diffSummary?: string;
  changedFiles?: string[];
  filePath?: string;
  remainingBlocks?: number;
  totalBlocks?: number;
  resolvedSnippet?: string;
  resolutionType?: 'kept_ours' | 'kept_theirs' | 'merged_both' | 'custom_edit' | 'deleted';
  oursSnippet?: string;
  theirsSnippet?: string;
  blockIndex?: number;
}

export interface GitEvent {
  type: GitEventType;
  timestamp: number;
  repoPath: string;
  metadata: GitEventMetadata;
}

export interface RoastResult {
  roast: string;
  advice: string;
  eventType: GitEventType;
  timestamp: number;
}

export type Rank =
  | 'Bronze Committer'
  | 'Silver Rebaser'
  | 'Gold Pusher'
  | 'Platinum Merge Survivor'
  | 'Diamond Git Wizard';

export interface Score {
  total: number;
  rank: Rank;
  lastEventDelta: number;
}

export interface AchievementTrigger {
  type: 'first_occurrence' | 'cumulative' | 'streak';
  eventType: GitEventType;
  threshold?: number;
}

export interface Achievement {
  id: string;
  _comment: string;
  name: string;
  description: string;
  imageKey: string;
  trigger: AchievementTrigger;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface UserStats {
  score: number;
  rank: Rank;
  roastHistory: RoastResult[];
  achievements: Achievement[];
  eventCounts: Partial<Record<GitEventType, number>>;
  streaks: Partial<Record<GitEventType, number>>;
  goodCommitStreak: number;
}
