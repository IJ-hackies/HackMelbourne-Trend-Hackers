import Link from 'next/link';

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <section className="text-center py-20">
        <h1 className="text-6xl font-black tracking-tight mb-4">
          Git Gud
        </h1>
        <p className="text-xl text-neutral-400 mb-8">
          Competitive Git for dangerously overconfident developers.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/profile"
            className="px-6 py-3 bg-emerald-500 text-black font-bold rounded hover:bg-emerald-400 transition"
          >
            View Profile
          </Link>
          <Link
            href="/leaderboard"
            className="px-6 py-3 bg-neutral-800 text-white font-bold rounded hover:bg-neutral-700 transition"
          >
            Leaderboard
          </Link>
          <Link
            href="/wrapped"
            className="px-6 py-3 bg-neutral-800 text-white font-bold rounded hover:bg-neutral-700 transition"
          >
            Git Wrapped
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
        <Card title="📊 Rank System" desc="Bronze Committer → Diamond Git Wizard. Earn points for good habits, lose them for war crimes." />
        <Card title="🎭 Personality" desc="Are you a Commit Goblin, Chaos Mage, or README Avoider? Find out what your git history says about you." />
        <Card title="🏆 Achievements" desc="Unlock badges like Merge Conflict Survivor, Force Push Felon, and Clean Streak." />
      </section>

      <section className="py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Get the VS Code Extension</h2>
        <p className="text-neutral-400 mb-6">
          Install the Git Gud extension to get roasted in real-time as you code.
        </p>
        <a
          href="#"
          className="inline-block px-6 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-500 transition"
        >
          Install from VS Code Marketplace
        </a>
      </section>
    </main>
  );
}

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900">
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-neutral-400 text-sm">{desc}</p>
    </div>
  );
}
