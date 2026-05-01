export const dynamic = 'force-dynamic';

const LEADERBOARD = [
  { name: 'Alex "The Perfectionist" Chen', rank: 'Diamond Git Wizard', score: 1420, personality: 'The Perfectionist', suffering: 8 },
  { name: 'Jordan "Chaos Mage" Smith', rank: 'Platinum Merge Survivor', score: 890, personality: 'Chaos Mage', suffering: 78 },
  { name: 'Taylor "Commit Goblin" Doe', rank: 'Gold Merger', score: 520, personality: 'Commit Goblin', suffering: 34 },
  { name: 'Morgan "README Avoider" Lee', rank: 'Gold Merger', score: 480, personality: 'README Avoider', suffering: 42 },
  { name: 'Casey "Monolith Merchant" Kim', rank: 'Silver Rebaser', score: 260, personality: 'Monolith Merchant', suffering: 55 },
  { name: 'Riley "Night Owl" Brown', rank: 'Silver Rebaser', score: 210, personality: 'Night Owl', suffering: 28 },
  { name: 'Jamie "Branch Hoarder" Patel', rank: 'Bronze Committer', score: 95, personality: 'Branch Hoarder', suffering: 15 },
  { name: 'Drew "Merge Conflict Survivor" Wong', rank: 'Bronze Committer', score: 45, personality: 'Merge Conflict Survivor', suffering: 60 },
];

export default function LeaderboardPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <header className="mb-10">
        <h1 className="text-4xl font-black mb-2">Leaderboard</h1>
        <p className="text-neutral-400">The most dangerously overconfident developers ranked by git skill.</p>
      </header>

      <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900">
        <table className="w-full text-left">
          <thead className="bg-neutral-800 text-sm uppercase tracking-wider text-neutral-400">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Developer</th>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Personality</th>
              <th className="px-4 py-3">Suffering</th>
            </tr>
          </thead>
          <tbody>
            {LEADERBOARD.map((dev, i) => (
              <tr key={i} className="border-t border-neutral-800 hover:bg-neutral-800/50 transition">
                <td className="px-4 py-3 font-bold">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </td>
                <td className="px-4 py-3 font-semibold">{dev.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${rankColor(dev.rank)}`}>
                    {dev.rank}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono">{dev.score}</td>
                <td className="px-4 py-3 text-sm text-neutral-400">{dev.personality}</td>
                <td className="px-4 py-3">
                  <span className={`font-bold ${dev.suffering > 50 ? 'text-red-400' : dev.suffering > 25 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                    {dev.suffering}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function rankColor(rank: string): string {
  if (rank.includes('Diamond')) return 'bg-purple-900/40 text-purple-300 border border-purple-700';
  if (rank.includes('Platinum')) return 'bg-cyan-900/40 text-cyan-300 border border-cyan-700';
  if (rank.includes('Gold')) return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700';
  if (rank.includes('Silver')) return 'bg-slate-700/40 text-slate-300 border border-slate-600';
  return 'bg-orange-900/40 text-orange-300 border border-orange-700';
}
