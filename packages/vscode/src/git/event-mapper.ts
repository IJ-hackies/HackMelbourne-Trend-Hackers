import type { GitEvent, AnalysisContext, CommitSizeStats } from '@git-gud/core';
import type { RawGitSignal } from './types';

export function mapToGitEvent(signal: RawGitSignal): GitEvent {
  const metadata: Record<string, unknown> = {};

  if (signal.commitMessage !== undefined) {
    metadata.message = signal.commitMessage;
  }

  if (signal.branchName !== undefined) {
    metadata.branch = signal.branchName;
  }

  if (signal.isDefaultBranch !== undefined) {
    metadata.isDefaultBranch = signal.isDefaultBranch;
  }

  if (
    signal.filesChanged !== undefined ||
    signal.insertions !== undefined ||
    signal.deletions !== undefined
  ) {
    const stats: CommitSizeStats = {
      filesChanged: signal.filesChanged ?? 0,
      insertions: signal.insertions ?? 0,
      deletions: signal.deletions ?? 0,
    };
    if (signal.files) {
      stats.files = signal.files;
    }
    metadata.stats = stats;
  }

  return {
    type: signal.type,
    timestamp: signal.timestamp,
    metadata,
  };
}

export function buildAnalysisContext(
  signal: RawGitSignal,
  recentTimestamps: Date[],
): AnalysisContext {
  const DEFAULT_BRANCHES = new Set(['main', 'master', 'develop', 'development', 'dev']);
  const branch = signal.branchName;

  return {
    branchName: branch,
    isDefaultBranch: signal.isDefaultBranch ?? (branch ? DEFAULT_BRANCHES.has(branch.toLowerCase()) : false),
    recentCommitTimestamps: recentTimestamps,
  };
}
