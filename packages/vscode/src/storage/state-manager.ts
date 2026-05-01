import type { GitEvent, PlayerState, Score, Rank, RankEvaluation, Achievement } from '@git-gud/core';
import * as vscode from 'vscode';

const STATE_KEY = 'gitgud.playerState.v1';

export function loadState(context: vscode.ExtensionContext): PlayerState {
    const raw = context.globalState.get<PlayerState>(STATE_KEY);
    if (raw) {
        return raw;
    }
    return createDefaultState();
}

export function saveState(context: vscode.ExtensionContext, state: PlayerState): void {
    context.globalState.update(STATE_KEY, state).then(undefined, (err) => {
        console.error('Git Gud: Failed to save state', err);
    });
}

export function resetState(context: vscode.ExtensionContext): PlayerState {
    const fresh = createDefaultState();
    context.globalState.update(STATE_KEY, fresh).then(undefined, (err) => {
        console.error('Git Gud: Failed to reset state', err);
    });
    return fresh;
}

function createDefaultState(): PlayerState {
    return {
        score: {
            total: 0,
            delta: 0,
            breakdown: {},
        },
        rank: {
            id: 'bronze',
            name: 'Bronze Committer',
            tier: 1,
            threshold: 0,
        },
        achievements: [
            { id: 'first-blood', name: 'First Blood', description: 'Your first roast. Welcome to competitive Git.', unlocked: false, progress: 0 },
            { id: 'merge-conflict-survivor', name: 'Merge Conflict Survivor', description: 'Resolve 5 merge conflicts.', unlocked: false, progress: 0 },
            { id: 'force-push-felon', name: 'Force Push Felon', description: 'Force push 3 times.', unlocked: false, progress: 0 },
            { id: 'commit-goblin', name: 'Commit Goblin', description: '10+ commits in a single session.', unlocked: false, progress: 0 },
            { id: 'clean-streak', name: 'Clean Streak', description: '5 consecutive good commits.', unlocked: false, progress: 0 },
            { id: 'readme-avoider', name: 'README Avoider', description: 'Reach 500 score without ever editing a README.', unlocked: false, progress: 0 },
            { id: 'late-night-warrior', name: 'Late Night Warrior', description: 'Commit after midnight 10 times.', unlocked: false, progress: 0 },
            { id: 'weekend-warrior', name: 'Weekend Warrior', description: '10 commits on weekends.', unlocked: false, progress: 0 },
            { id: 'diamond-hands', name: 'Diamond Hands', description: 'Reach Diamond Git Wizard rank.', unlocked: false, progress: 0 },
            { id: 'branch-necromancer', name: 'Branch Necromancer', description: 'Switch to a branch with 2+ weeks of dust.', unlocked: false, progress: 0 },
        ],
        stats: {
            totalCommits: 0,
            totalForcePushes: 0,
            totalMergeConflicts: 0,
            totalRebases: 0,
            totalDirectMainPushes: 0,
            averageCommitSize: 0,
            currentStreak: 0,
            bestStreak: 0,
            lateNightCommits: 0,
            weekendCommits: 0,
            branchCount: 0,
            readmeEdits: 0,
            eventHistory: [],
            commitTimestamps: [],
        },
        personality: {
            type: 'Git Novice',
            description: 'Not enough data to classify. Keep committing — we are building your dossier.',
        },
        suffering: {
            score: 0,
            title: 'Mild Annoyance',
        },
    };
}
