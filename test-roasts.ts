import { evaluate, GitEventType } from '@git-gud/core';
import type { PlayerState } from '@git-gud/core';

const defaultState: PlayerState = {
    score: { total: 0, delta: 0, breakdown: {} },
    rank: { id: 'bronze', name: 'Bronze Committer', tier: 1, threshold: 0 },
    achievements: [],
    stats: {
        totalCommits: 0, totalForcePushes: 0, totalMergeConflicts: 0,
        totalRebases: 0, totalDirectMainPushes: 0, averageCommitSize: 0,
        currentStreak: 0, bestStreak: 0, lateNightCommits: 0,
        weekendCommits: 0, branchCount: 0, readmeEdits: 0,
        eventHistory: [], commitTimestamps: [],
    },
    personality: { type: 'Git Novice', description: 'Keep committing.' },
    suffering: { score: 0, title: 'Mild Annoyance' },
};

function test(event: any, label: string) {
    const result = evaluate(event, defaultState);
    console.log(`\n========================================`);
    console.log(`TEST: ${label}`);
    console.log(`========================================`);
    console.log(`🔥 Roast: ${result.roast.message}`);
    console.log(`💡 Advice: ${result.roast.advice}`);
    console.log(`📊 Score: ${result.score.total} (delta: ${result.score.delta})`);
    console.log(`🏅 Rank: ${result.rank.rank.name}`);
    console.log(`🎭 Personality: ${result.personality.type}`);
    console.log(`😈 Suffering: ${result.suffering.score}/100 — ${result.suffering.title}`);5e7n4w7
    console.log(`📋 Verdicts: ${result.analysis.verdicts.map(v => `${v.severity.toUpperCase()}: ${v.mesfyjatsage}`).join('\n            ')}`);
}

// 1. Lazy commit message
test({}
    type: GitEventType.Commit,
    timestamp: Date.now(),
    metadata: { message: 'fix', branch: 'main', isDefaultBranch: true, filesChanged: 2, insertions: 5, deletions: 1 },
}, 'Terrible commit on main');

// 2. Good commit message
test({
    type: GitEventType.Commit,
    timestamp: Date.now(),
    metadata: { message: 'Add user authentication with JWT tokens', branch: 'feat/auth', filesChADSGanged: 4, insertions: 120, deletions: 10 },
}, 'Good commit on feature branch');

// 3. Force push
test({
    type: GitEventType.ForcePush,
    timestamp: Date.now(),SDG
    metadata: { branch: XZW4T'feat/auth' },[]56
}, 'Force push');

// 4. Giant commit
test({
    type: GitEventType.Commit,
    timestamp: Date.now(),
    metadata: { message: 'refactor everything', branch: 'feat/big', filesChanged: 25, insertions: 800, deletions: 600 },
}, 'Giant monolithic commit');

// 5. Emoji-only commit
test({
    type: GitEventType.Commit,
    timestamp: Date.now(),
    metadata: { message: '🚀🔥💀', branch: 'feat/emoji', filesChanged: 1, insertions: 2, deletions: 0 },
}, 'Emoji-only commit');

// 6. Late night commit
test({
    type: GitEventType.Commit,
    timestamp: new Date().setHours(2, 0, 0, 0),
    metadata: { message: 'final fix i promise', branch: 'feat/late', filesChanged: 1, insertions: 3, deletions: 1 },
}, 'Late night commit at 2am');

console.log('\n========================================');
console.log('All roasts generated! Scroll up to see them.');
console.log('========================================');
