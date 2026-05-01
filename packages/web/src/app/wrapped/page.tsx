export const dynamic = 'force-dynamic';

const WRAPPED = {
  year: 2025,
  totalCommits: 437,
  questionableCommits: 142,
  mergeConflictsSurvived: 29,
  forcePushes: 12,
  lateNightCommits: 68,
  weekendCommits: 94,
  longestStreak: 14,
  averageCommitSize: 38,
  topPersonality: 'Chaos Mage',
  topRoast: '"This commit message is so bad I am forwarding it to your therapist."',
  rankAtEnd: 'Gold Merger',
  suffering: 62,
  title: 'Git War Criminal',
};

export default function WrappedPage() {
  const w = WRAPPED;

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-black mb-2">Git Wrapped {w.year}</h1>
        <p className="text-neutral-400">Your year in competitive Git, summarized.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <BigStat label="Total Commits" value={w.totalCommits} />
        <BigStat label="Questionable Commits" value={w.questionableCommits} color="text-yellow-400" />
        <BigStat label="Merge Conflicts Survived" value={w.mergeConflictsSurvived} color="text-red-400" />
        <BigStat label="Force Pushes" value={w.forcePushes} color="text-red-500" />
        <BigStat label="Late Night Commits" value={w.lateNightCommits} color="text-purple-400" />
        <BigStat label="Weekend Commits" value={w.weekendCommits} color="text-orange-400" />
        <BigStat label="Longest Streak" value={`${w.longestStreak} days`} color="text-emerald-400" />
        <BigStat label="Avg Commit Size" value={`${w.averageCommitSize} files`} />
      </div>

      <section className="border border-neutral-800 rounded-lg p-8 bg-neutral-900 text-center mb-10">
        <h2 className="text-lg uppercase tracking-wider text-neutral-500 mb-4">Top Roast of the Year</h2>
        <blockquote className="text-2xl font-bold italic text-white mb-4">
          “{w.topRoast}”
        </blockquote>
        <p className="text-neutral-400">It is not just a roast. It is a lifestyle.</p>
      </section>

      <section className="border border-neutral-800 rounded-lg p-8 bg-neutral-900 text-center mb-10">
        <h2 className="text-lg uppercase tracking-wider text-neutral-500 mb-4">Year-End Rank</h2>
        <div className="text-4xl font-bold text-emerald-400 mb-2">{w.rankAtEnd}</div>
        <p className="text-neutral-400">{w.suffering}/100 — {w.title}</p>
      </section>

      <section className="text-center">
        <a
          href="/roast-card"
          className="inline-block px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-black rounded-lg text-lg hover:opacity-90 transition"
        >
          Generate Shareable Roast Card
        </a>
      </section>
    </main>
  );
}

function BigStat({ label, value, color = 'text-white' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900 text-center">
      <div className={`text-4xl font-black mb-2 ${color}`}>{value}</div>
      <div className="text-sm text-neutral-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}
