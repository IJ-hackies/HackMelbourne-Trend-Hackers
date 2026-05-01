import type { PlayerStats, PersonalityResult } from '../types';

interface Archetype {
    type: string;
    description: string;
    score: (stats: PlayerStats) => number;
}

const ARCHETYPES: Archetype[] = [
    {
        type: 'Commit Goblin',
        description: 'Tiny commits. All the time. Your git log looks like a Twitter feed.',
        score: (s) => {
            if (s.totalCommits < 5) return 0;
            const avgSize = s.averageCommitSize || 0;
            const freq = s.totalCommits;
            return avgSize < 10 ? freq * 2 : 0;
        },
    },
    {
        type: 'Chaos Mage',
        description: 'Force pushes, rebases, and dark rituals. Your git history is a myth.',
        score: (s) => {
            const risky = s.totalForcePushes + s.totalRebases + s.totalDirectMainPushes;
            return risky >= 2 ? risky * 10 : 0;
        },
    },
    {
        type: 'README Avoider',
        description: 'Code without documentation. Your repos are archaeological mysteries.',
        score: (s) => {
            if (s.totalCommits < 10) return 0;
            return s.readmeEdits === 0 ? s.totalCommits : 0;
        },
    },
    {
        type: 'Monolith Merchant',
        description: 'Giant commits, few branches. You ship the whole codebase every time.',
        score: (s) => {
            if (s.totalCommits < 3) return 0;
            return s.averageCommitSize > 200 ? s.averageCommitSize / 10 : 0;
        },
    },
    {
        type: 'Branch Hoarder',
        description: 'Many branches. Zero merges. Your repo is a forest of abandoned WIPs.',
        score: (s) => {
            if (s.totalCommits < 5) return 0;
            return s.branchCount > 10 ? s.branchCount * 2 : 0;
        },
    },
    {
        type: 'The Perfectionist',
        description: 'Clean history, high score, long pauses. You treat commits like art.',
        score: (s) => {
            if (s.totalCommits < 5) return 0;
            const risky = s.totalForcePushes + s.totalRebases + s.totalDirectMainPushes;
            if (risky > 0) return 0;
            // High score implies good habits
            return s.totalCommits * 3;
        },
    },
    {
        type: 'Night Owl',
        description: 'Midnight commits and weekend pushes. Your circadian rhythm is in another timezone.',
        score: (s) => {
            return (s.lateNightCommits + s.weekendCommits) * 2;
        },
    },
    {
        type: 'Merge Conflict Survivor',
        description: 'You live in the conflict zone. Git merge is your daily workout.',
        score: (s) => {
            return s.totalMergeConflicts >= 3 ? s.totalMergeConflicts * 5 : 0;
        },
    },
];

export function classifyPersonality(stats: PlayerStats): PersonalityResult {
    const scored = ARCHETYPES.map(a => ({
        type: a.type,
        description: a.description,
        score: a.score(stats),
    }));

    scored.sort((a, b) => b.score - a.score);

    const top = scored[0];
    if (top.score === 0) {
        return {
            type: 'Git Novice',
            description: 'Not enough data to classify. Keep committing — we are building your dossier.',
        };
    }

    return {
        type: top.type,
        description: top.description,
    };
}
