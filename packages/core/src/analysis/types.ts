import type { GitEvent } from '../types';

export type Severity = 'info' | 'warning' | 'critical';

export interface AnalysisVerdict {
  severity: Severity;
  category: string;
  message: string;
  advice: string;
}

export interface CommitMessageVerdict extends AnalysisVerdict {
  category: 'commit-message';
  pattern: 'too-short' | 'generic' | 'no-context' | 'all-caps' | 'emoji-only' | 'default-message' | 'clean';
}

export interface BranchNameVerdict extends AnalysisVerdict {
  category: 'branch-name';
  pattern: 'default-branch' | 'meaningless' | 'no-prefix' | 'too-long' | 'bad-characters' | 'clean';
}

export interface CommitSizeVerdict extends AnalysisVerdict {
  category: 'commit-size';
  pattern: 'giant' | 'micro' | 'high-deletion-ratio' | 'generated-only' | 'clean';
}

export interface RiskyActionVerdict extends AnalysisVerdict {
  category: 'risky-action';
  pattern: 'force-push' | 'direct-push-default' | 'shared-rebase' | 'delete-remote-branch' | 'hard-reset';
}

export interface SessionVerdict extends AnalysisVerdict {
  category: 'session';
  pattern: 'long-session' | 'late-night' | 'weekend-warrior' | 'panic-mode' | 'clean';
}

export type AnyVerdict =
  | CommitMessageVerdict
  | BranchNameVerdict
  | CommitSizeVerdict
  | RiskyActionVerdict
  | SessionVerdict;

export interface AnalysisContext {
  recentCommitTimestamps?: Date[];
  branchName?: string;
  isDefaultBranch?: boolean;
}

export interface AnalysisResult {
  event: GitEvent;
  verdicts: AnyVerdict[];
  timestamp: number;
  highestSeverity: Severity;
}
