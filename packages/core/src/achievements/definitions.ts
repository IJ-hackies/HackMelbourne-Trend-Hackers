import type { Achievement, PlayerStats } from '../types';

export interface AchievementDefinition {
    id: string;
    name: string;
    description: string;
    condition: (stats: PlayerStats) => { unlocked: boolean; progress: number };
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
    {
        id: 'merge-conflict-survivor',
        name: 'Merge Conflict Survivor',
        description: 'Resolve 5 merge conflicts. The scars never heal.',
        condition: (s) => ({
            unlocked: s.totalMergeConflicts >= 5,
            progress: Math.min(1, s.totalMergeConflicts / 5),
        }),
    },
    {
        id: 'force-push-felon',
        name: 'Force Push Felon',
        description: 'Force push 3 times. Your teammates fear you.',
        condition: (s) => ({
            unlocked: s.totalForcePushes >= 3,
            progress: Math.min(1, s.totalForcePushes / 3),
        }),
    },
    {
        id: 'branch-necromancer',
        name: 'Branch Necromancer',
        description: 'Switch to a branch with 2+ weeks of dust on it.',
        condition: () => ({
            unlocked: false, // Requires timestamp data per branch — best effort
            progress: 0,
        }),
    },
    {
        id: 'commit-goblin',
        name: 'Commit Goblin',
        description: '10+ commits in a single session. Quantity over quality.',
        condition: (s) => ({
            unlocked: s.currentStreak >= 10,
            progress: Math.min(1, s.currentStreak / 10),
        }),
    },
    {
        id: 'clean-streak',
        name: 'Clean Streak',
        description: '5 consecutive good commits. Unbroken excellence.',
        condition: (s) => ({
            unlocked: s.currentStreak >= 5,
            progress: Math.min(1, s.currentStreak / 5),
        }),
    },
    {
        id: 'readme-avoider',
        name: 'README Avoider',
        description: 'Reach 500 score without ever editing a README. Suspicious.',
        condition: (s) => ({
            unlocked: s.totalCommits >= 20 && s.readmeEdits === 0,
            progress: Math.min(1, s.totalCommits / 20),
        }),
    },
    {
        id: 'late-night-warrior',
        name: 'Late Night Warrior',
        description: 'Commit after midnight 10 times. Your sleep schedule is a meme.',
        condition: (s) => ({
            unlocked: s.lateNightCommits >= 10,
            progress: Math.min(1, s.lateNightCommits / 10),
        }),
    },
    {
        id: 'weekend-warrior',
        name: 'Weekend Warrior',
        description: '10 commits on weekends. Touch grass challenge: failed.',
        condition: (s) => ({
            unlocked: s.weekendCommits >= 10,
            progress: Math.min(1, s.weekendCommits / 10),
        }),
    },
    {
        id: 'diamond-hands',
        name: 'Diamond Hands',
        description: 'Reach Diamond Git Wizard rank. The summit of version control.',
        condition: (s) => ({
            unlocked: false, // Will be set by rank evaluation
            progress: 0,
        }),
    },
    {
        id: 'first-blood',
        name: 'First Blood',
        description: 'Your first roast. Welcome to competitive Git.',
        condition: (s) => ({
            unlocked: s.totalCommits >= 1,
            progress: Math.min(1, s.totalCommits / 1),
        }),
    },
];
