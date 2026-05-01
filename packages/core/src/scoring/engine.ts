import type { Score, AnalysisResult } from '../types';
import { SCORING_RULES } from './rules';

export function calculateScore(
    analysis: AnalysisResult,
    currentTotal: number = 0
): Score {
    let delta = 0;
    const breakdown: Record<string, number> = {};

    const add = (key: string, value: number) => {
        delta += value;
        breakdown[key] = (breakdown[key] || 0) + value;
    };

    // Base event scoring
    switch (analysis.event.type) {
        case 'commit':
            // Will be refined by verdicts below
            break;
        case 'force-push':
            add('forcePush', SCORING_RULES.FORCE_PUSH_PENALTY);
            break;
        case 'push':
            add('directMainPush', SCORING_RULES.DIRECT_MAIN_PENALTY);
            break;
        case 'rebase':
            add('rebase', SCORING_RULES.REBASE_PENALTY);
            break;
        case 'merge-conflict':
            add('mergeConflict', SCORING_RULES.MERGE_CONFLICT_PENALTY);
            break;
    }

    for (const v of analysis.verdicts) {
        const mult = SCORING_RULES.SEVERITY_MULTIPLIER[v.severity] || 1;

        switch (v.category) {
            case 'commit-message': {
                if (v.severity === 'info') {
                    add('commitMessage', SCORING_RULES.GOOD_MESSAGE_BONUS * mult);
                } else {
                    add('commitMessage', SCORING_RULES.BAD_MESSAGE_PENALTY * mult);
                }
                break;
            }
            case 'branch-name': {
                const isDefault = (v as any).isDefaultBranch;
                if (isDefault) {
                    add('branchName', SCORING_RULES.DEFAULT_BRANCH_PENALTY * mult);
                } else if (v.severity === 'info') {
                    add('branchName', SCORING_RULES.GOOD_BRANCH_BONUS * mult);
                }
                break;
            }
            case 'commit-size': {
                if (v.severity === 'info') {
                    add('commitSize', SCORING_RULES.REASONABLE_SIZE_BONUS * mult);
                } else {
                    add('commitSize', SCORING_RULES.GIANT_COMMIT_PENALTY * mult);
                }
                break;
            }
            case 'session-duration': {
                const sv = v as any;
                if (sv.lateNight) {
                    add('session', SCORING_RULES.LATE_NIGHT_PENALTY * mult);
                } else if (sv.burstMode) {
                    add('session', SCORING_RULES.BURST_MODE_PENALTY * mult);
                } else if (sv.sessionLengthMinutes >= 4 * 60) {
                    add('session', SCORING_RULES.LONG_SESSION_PENALTY * mult);
                } else {
                    add('session', SCORING_RULES.GOOD_SESSION_BONUS * mult);
                }
                break;
            }
            case 'risky-action': {
                // Already handled above, but scale by severity
                break;
            }
        }
    }

    const newTotal = Math.max(0, currentTotal + delta);

    return {
        total: newTotal,
        delta,
        breakdown,
    };
}
