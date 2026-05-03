import type { PlayerState } from '@git-gud/core';

export const dynamic = 'force-dynamic';

const DEMO_STATE: PlayerState = {
  score: { total: 342, delta: 15, breakdown: { commitMessage: 5, commitSize: 3, branchName: 5, session: 2 } },
  rank: { id: 'gold', name: 'Gold Merger', tier: 3, threshold: 300 },
  achievements: [
    { id: 'first-blood', name: 'First Blood', description: 'Your first roast.', unlocked: true, progress: 1 },
    { id: 'merge-conflict-survivor', name: 'Merge Conflict Survivor', description: 'Resolve 5 merge conflicts.', unlocked: true, progress: 1 },
    { id: 'force-push-felon', name: 'Force Push Felon', description: 'Force push 3 times.', unlocked: true, progress: 1 },
    { id: 'commit-goblin', name: 'Commit Goblin', description: '10+ commits in a session.', unlocked: false, progress: 0.7 },
    { id: 'clean-streak', name: 'Clean Streak', description: '5 consecutive good commits.', unlocked: true, progress: 1 },
    { id: 'readme-avoider', name: 'README Avoider', description: 'Reach 500 score without README edits.', unlocked: false, progress: 0.68 },
    { id: 'late-night-warrior', name: 'Late Night Warrior', description: 'Commit after midnight 10 times.', unlocked: false, progress: 0.4 },
    { id: 'weekend-warrior', name: 'Weekend Warrior', description: '10 commits on weekends.', unlocked: true, progress: 1 },
    { id: 'diamond-hands', name: 'Diamond Hands', description: 'Reach Diamond rank.', unlocked: false, progress: 0.34 },
    { id: 'branch-necromancer', name: 'Branch Necromancer', description: 'Switch to an old branch.', unlocked: false, progress: 0 },
  ],
  stats: {
    totalCommits: 24,
    totalForcePushes: 4,
    totalMergeConflicts: 7,
    totalRebases: 3,
    totalDirectMainPushes: 2,
    averageCommitSize: 45,
    currentStreak: 3,
    bestStreak: 8,
    lateNightCommits: 4,
    weekendCommits: 11,
    branchCount: 6,
    readmeEdits: 0,
    eventHistory: [],
    commitTimestamps: [],
  },
  personality: { type: 'Chaos Mage', description: 'Force pushes, rebases, and dark rituals. Your git history is a myth.' },
  suffering: { score: 62, title: 'Git War Criminal' },
};

export default function ProfilePage() {
  const state = DEMO_STATE;
  const rankProgress = Math.min(100, ((state.score.total - state.rank.threshold) / (600 - state.rank.threshold)) * 100);

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <header className="mb-12">
        <h1 className="text-4xl font-black mb-2">Developer Profile</h1>
        <p className="text-neutral-400">Your competitive Git dossier.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900">
          <h2 className="text-sm uppercase tracking-wider text-neutral-500 mb-2">Current Rank</h2>
          <div className="text-3xl font-bold text-emerald-400 mb-2">{state.rank.name}</div>
          <div className="w-full bg-neutral-800 rounded h-2">
            <div className="bg-emerald-500 h-2 rounded" style={{ width: `${rankProgress}%` }} />
          </div>
          <p className="text-xs text-neutral-500 mt-1">{state.score.total} / 600 → Platinum Merge Survivor</p>
        </div>

        <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900">
          <h2 className="text-sm uppercase tracking-wider text-neutral-500 mb-2">Git Skill Score</h2>
          <div className="text-4xl font-bold">{state.score.total}</div>
          <p className="text-sm text-neutral-400 mt-1">Last event: {state.score.delta > 0 ? '+' : ''}{state.score.delta}</p>
        </div>

        <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900">
          <h2 className="text-sm uppercase tracking-wider text-neutral-500 mb-2">Personality</h2>
          <div className="text-2xl font-bold text-purple-400">{state.personality.type}</div>
          <p className="text-sm text-neutral-400 mt-1">{state.personality.description}</p>
        </div>

        <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900">
          <h2 className="text-sm uppercase tracking-wider text-neutral-500 mb-2">Teammate Suffering</h2>
          <div className="text-4xl font-bold text-red-400">{state.suffering.score}/100</div>
          <p className="text-sm text-neutral-400 mt-1">{state.suffering.title}</p>
        </div>
      </section>

      <section className="border border-neutral-800 rounded-lg p-6 bg-neutral-900 mb-10">
        <h2 className="text-xl font-bold mb-4">Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Commits" value={state.stats.totalCommits} />
          <Stat label="Force Pushes" value={state.stats.totalForcePushes} />
          <Stat label="Merge Conflicts" value={state.stats.totalMergeConflicts} />
          <Stat label="Rebases" value={state.stats.totalRebases} />
          <Stat label="Direct Main Pushes" value={state.stats.totalDirectMainPushes} />
          <Stat label="Current Streak" value={state.stats.currentStreak} />
          <Stat label="Best Streak" value={state.stats.bestStreak} />
          <Stat label="Late Night" value={state.stats.lateNightCommits} />
        </div>
      </section>

      <section className="border border-neutral-800 rounded-lg p-6 bg-neutral-900">
        <h2 className="text-xl font-bold mb-4">Achievements</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {state.achievements.map((a) => (
            <div
              key={a.id}
              className={`rounded p-3 text-center text-sm border ${
                a.unlocked
                  ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-300'
                  : 'bg-neutral-800/50 border-neutral-700 text-neutral-500'
              }`}
            >
              <div className="font-bold">{a.name}</div>
              <div className="text-xs mt-1">{a.unlocked ? 'Unlocked' : `${Math.round(a.progress * 100)}%`}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-neutral-500">{label}</div>
    </div>
  );
}
