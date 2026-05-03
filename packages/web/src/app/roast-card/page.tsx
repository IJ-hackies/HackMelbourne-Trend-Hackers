export const dynamic = 'force-dynamic';

const ROASTS = [
  {
    title: 'Top 1% Worst Commit Messages',
    body: '"fix" — 47 times this month. Your commit history reads like a cryptic crossword with no clues.',
    stat: '47 vague commits',
    color: 'from-red-500 to-orange-500',
  },
  {
    title: 'Force Push Felon',
    body: 'You force-pushed 12 times this quarter. Shared history is just a suggestion to you.',
    stat: '12 force pushes',
    color: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Midnight Marauder',
    body: '68 commits after midnight. The only thing darker than your IDE theme is your sleep schedule.',
    stat: '68 late-night commits',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    title: 'Merge Conflict Survivor',
    body: 'You survived 29 merge conflicts this year. Your git log looks like a war documentary.',
    stat: '29 conflicts survived',
    color: 'from-emerald-500 to-cyan-500',
  },
];

export default function RoastCardPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-black mb-2">Roast Cards</h1>
        <p className="text-neutral-400">Auto-generated cards for social media. Share the shame.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ROASTS.map((card, i) => (
          <div
            key={i}
            className={`rounded-xl p-8 bg-gradient-to-br ${card.color} text-white shadow-lg`}
          >
            <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">
              Git Gud Certified
            </div>
            <h2 className="text-2xl font-black mb-3">{card.title}</h2>
            <p className="text-sm opacity-90 mb-6 leading-relaxed">{card.body}</p>
            <div className="text-3xl font-black">{card.stat}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
