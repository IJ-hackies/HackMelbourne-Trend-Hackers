import type { CommitSizeVerdict, Severity } from './types';

export const THRESHOLDS = {
  giantFiles: 20,
  giantLines: 500,
  megaFiles: 50,
  megaLines: 1500,
  microMaxFiles: 1,
  microMaxLines: 3,
  highDeletionRatio: 0.8,
  highDeletionMinLines: 50,
} as const;

const GENERATED_FILE_PATTERNS = [
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.lock$/,
  /\.min\.(js|css)$/,
  /dist\//,
  /\.generated\./,
  /\.d\.ts$/,
];

export interface CommitSizeStats {
  filesChanged: number;
  insertions: number;
  deletions: number;
  files?: string[];
}

function verdict(
  severity: Severity,
  pattern: CommitSizeVerdict['pattern'],
  message: string,
  advice: string,
): CommitSizeVerdict {
  return { severity, category: 'commit-size', pattern, message, advice };
}

function isAllGenerated(files?: string[]): boolean {
  if (!files || files.length === 0) return false;
  return files.every(f => GENERATED_FILE_PATTERNS.some(p => p.test(f)));
}

export function analyzeCommitSize(stats: CommitSizeStats): CommitSizeVerdict {
  if (stats.files && isAllGenerated(stats.files)) {
    return verdict(
      'info',
      'generated-only',
      'Only generated/lock files changed. The machines did the work.',
      'Generated file changes are fine — just make sure they\'re intentional.',
    );
  }

  const totalLines = stats.insertions + stats.deletions;

  if (stats.filesChanged >= THRESHOLDS.megaFiles || totalLines >= THRESHOLDS.megaLines) {
    return verdict(
      'critical',
      'giant',
      `${stats.filesChanged} files and ${totalLines} lines in one commit. This isn't a commit, it's a deployment.`,
      'Break large changes into smaller, reviewable commits. No one can meaningfully review 1500+ lines.',
    );
  }

  if (stats.filesChanged >= THRESHOLDS.giantFiles || totalLines >= THRESHOLDS.giantLines) {
    return verdict(
      'warning',
      'giant',
      `${stats.filesChanged} files, ${totalLines} lines changed. That's a hefty commit.`,
      'Consider splitting into focused commits — one concern per commit makes history useful.',
    );
  }

  if (
    totalLines >= THRESHOLDS.highDeletionMinLines &&
    stats.deletions / totalLines >= THRESHOLDS.highDeletionRatio
  ) {
    return verdict(
      'warning',
      'high-deletion-ratio',
      `${stats.deletions} deletions vs ${stats.insertions} insertions. Mass destruction detected.`,
      'Large deletions are sometimes correct (cleanup, dead code removal). Double-check nothing was accidentally removed.',
    );
  }

  if (
    stats.filesChanged <= THRESHOLDS.microMaxFiles &&
    totalLines <= THRESHOLDS.microMaxLines &&
    totalLines > 0
  ) {
    return verdict(
      'info',
      'micro',
      `${totalLines} line(s) in ${stats.filesChanged} file. Are you saving or committing?`,
      'Micro-commits can clutter history. Consider batching tiny changes unless each is a meaningful unit.',
    );
  }

  return verdict(
    'info',
    'clean',
    'Commit size looks reasonable. Good discipline.',
    'Keep commits focused — small enough to review, large enough to be meaningful.',
  );
}
