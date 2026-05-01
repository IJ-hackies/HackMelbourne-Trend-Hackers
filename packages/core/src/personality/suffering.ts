import type { PlayerStats, SufferingResult } from '../types';

export function calculateSuffering(stats: PlayerStats): SufferingResult {
    let score = 0;

    // Force pushes: maximum chaos
    score += Math.min(40, stats.totalForcePushes * 10);

    // Merge conflicts
    score += Math.min(20, stats.totalMergeConflicts * 3);

    // Direct main pushes
    score += Math.min(20, stats.totalDirectMainPushes * 8);

    // Rebases
    score += Math.min(10, stats.totalRebases * 2);

    // Average commit size (giant commits = more chaos)
    if (stats.averageCommitSize > 100) {
        score += 10;
    }

    score = Math.min(100, Math.max(0, score));

    let title: string;
    if (score < 10) {
        title = 'Mild Annoyance';
    } else if (score < 25) {
        title = 'Active Hazard';
    } else if (score < 45) {
        title = 'Team Morale Threat';
    } else if (score < 65) {
        title = 'Git War Criminal';
    } else if (score < 85) {
        title = 'Geneva Convention Violation';
    } else {
        title = 'Apocalyptic Git Event';
    }

    return {
        score,
        title,
    };
}
