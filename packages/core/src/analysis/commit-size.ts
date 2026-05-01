import type { CommitSizeVerdict } from '../types';

export const THRESHOLDS = {
    FILES_GIANT: 15,
    FILES_LARGE: 8,
    LINES_GIANT: 500,
    LINES_LARGE: 200,
    MICRO_FILES: 1,
    MICRO_LINES: 3,
    HIGH_DELETE_RATIO: 0.8,
} as const;

export function analyzeCommitSize(stats: { filesChanged: number; insertions: number; deletions: number }): CommitSizeVerdict {
    const { filesChanged, insertions, deletions } = stats;
    const totalLines = insertions + deletions;
    const deleteRatio = totalLines > 0 ? deletions / totalLines : 0;

    if (filesChanged >= THRESHOLDS.FILES_GIANT || totalLines >= THRESHOLDS.LINES_GIANT) {
        return {
            severity: 'warning',
            category: 'commit-size',
            message: `Monolithic commit: ${filesChanged} files, +${insertions}/-${deletions} lines. This is a code review war crime.`,
            advice: 'Break large changes into smaller, focused commits. Each commit should do one thing well.',
            filesChanged,
            insertions,
            deletions,
        };
    }

    if (filesChanged >= THRESHOLDS.FILES_LARGE || totalLines >= THRESHOLDS.LINES_LARGE) {
        return {
            severity: 'info',
            category: 'commit-size',
            message: `Large commit: ${filesChanged} files, +${insertions}/-${deletions} lines. Consider splitting next time.`,
            advice: 'Commits that touch many files are hard to review and revert. Aim for focused changes.',
            filesChanged,
            insertions,
            deletions,
        };
    }

    if (filesChanged <= THRESHOLDS.MICRO_FILES && totalLines <= THRESHOLDS.MICRO_LINES) {
        return {
            severity: 'info',
            category: 'commit-size',
            message: `Micro-commit: ${filesChanged} file, ${totalLines} lines. Are you saving or committing?`,
            advice: 'Commit when a logical unit of work is complete, not after every keystroke.',
            filesChanged,
            insertions,
            deletions,
        };
    }

    if (deleteRatio >= THRESHOLDS.HIGH_DELETE_RATIO && totalLines > 50) {
        return {
            severity: 'warning',
            category: 'commit-size',
            message: `High deletion ratio (${Math.round(deleteRatio * 100)}%). Did you accidentally delete something important?`,
            advice: 'Double-check before committing mass deletions. Use git diff --stat to review.',
            filesChanged,
            insertions,
            deletions,
        };
    }

    return {
        severity: 'info',
        category: 'commit-size',
        message: `Commit size looks reasonable (${filesChanged} files, +${insertions}/-${deletions}).`,
        advice: 'Consistent commit sizing makes your history readable and bisectable.',
        filesChanged,
        insertions,
        deletions,
    };
}
