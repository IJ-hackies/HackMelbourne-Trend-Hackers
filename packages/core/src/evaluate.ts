import type {
    GitEvent,
    PlayerState,
    EvaluationResult,
    PlayerStats,
    AnalysisContext,
    AnalysisResult,
} from './types';
import { analyzeEvent } from './analysis';
import { generateRoast } from './roasts';
import { calculateScore } from './scoring';
import { evaluateRank } from './ranks';
import { checkAchievements } from './achievements';
import { classifyPersonality, calculateSuffering } from './personality';

export function evaluate(
    event: GitEvent,
    playerState: PlayerState,
    context?: AnalysisContext
): EvaluationResult {
    const analysis = analyzeEvent(event, context);
    const roast = generateRoast(analysis);
    const score = calculateScore(analysis, playerState.score.total);
    const rankEval = evaluateRank(score.total, playerState.rank);
    const updatedStats = updateStats(playerState.stats, event, analysis);
    const achievements = checkAchievements(event, updatedStats);
    const suffering = calculateSuffering(updatedStats);
    const personality = classifyPersonality(updatedStats);

    return {
        roast,
        score,
        rank: rankEval,
        achievements,
        suffering,
        personality,
        analysis,
        stats: updatedStats,
    };
}

function updateStats(stats: PlayerStats, event: GitEvent, analysis: AnalysisResult): PlayerStats {
    const updated: PlayerStats = {
        ...stats,
        eventHistory: [...stats.eventHistory, event].slice(-500),
        commitTimestamps: [...stats.commitTimestamps],
    };

    if (event.type === 'commit') {
        updated.totalCommits = stats.totalCommits + 1;
        updated.commitTimestamps.push(event.timestamp);
        if (updated.commitTimestamps.length > 1000) {
            updated.commitTimestamps = updated.commitTimestamps.slice(-1000);
        }

        const files = (event.metadata?.filesChanged as number) || 0;
        const prevTotalSize = stats.averageCommitSize * (stats.totalCommits);
        updated.averageCommitSize = (prevTotalSize + files) / updated.totalCommits;

        const hour = new Date(event.timestamp).getHours();
        if (hour >= 0 && hour < 5) {
            updated.lateNightCommits = stats.lateNightCommits + 1;
        }
        const day = new Date(event.timestamp).getDay();
        if (day === 0 || day === 6) {
            updated.weekendCommits = stats.weekendCommits + 1;
        }

        // Streak logic: good commit = +1, bad = reset
        const hasBad = analysis.verdicts.some((v: { severity: string }) => v.severity === 'critical' || v.severity === 'warning');
        if (hasBad) {
            updated.currentStreak = 0;
        } else {
            updated.currentStreak = stats.currentStreak + 1;
            updated.bestStreak = Math.max(stats.bestStreak, updated.currentStreak);
        }

        if ((event.metadata?.readmeEdited as boolean)) {
            updated.readmeEdits = stats.readmeEdits + 1;
        }

        const branch = (event.metadata?.branch as string);
        if (branch) {
            const branches = new Set(stats.eventHistory.map(e => e.metadata?.branch as string).filter(Boolean));
            branches.add(branch);
            updated.branchCount = branches.size;
        }
    }

    if (event.type === 'force-push') {
        updated.totalForcePushes = stats.totalForcePushes + 1;
    }
    if (event.type === 'merge-conflict') {
        updated.totalMergeConflicts = stats.totalMergeConflicts + 1;
    }
    if (event.type === 'rebase') {
        updated.totalRebases = stats.totalRebases + 1;
    }
    if (event.type === 'push' && (event.metadata?.branch === 'main' || event.metadata?.branch === 'master')) {
        updated.totalDirectMainPushes = stats.totalDirectMainPushes + 1;
    }

    return updated;
}

export { analyzeEvent, generateRoast, calculateScore, evaluateRank, checkAchievements, calculateSuffering, classifyPersonality };
