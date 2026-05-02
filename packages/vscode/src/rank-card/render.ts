import type { PlayerState } from '@git-gud/core';
import { calculateSuffering, classifyPersonality } from '@git-gud/core';
import type { StoredEvent } from '../storage/state-manager';

const RANK_COLORS: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#00cec9',
  diamond: '#00d2ff',
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function topCrimes(events: StoredEvent[]): string[] {
  const counts: Record<string, number> = {};
  for (const e of events) {
    if (e.scoreDelta < 0) {
      counts[e.type] = (counts[e.type] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type, n]) => `${type} ×${n}`);
}

export function renderRankCardSvg(playerState: PlayerState, eventHistory: StoredEvent[]): string {
  const stats = { ...playerState.stats, score: playerState.score.total };
  const suffering = calculateSuffering(stats);
  const personality = classifyPersonality(stats);
  const rankColor = RANK_COLORS[playerState.rank.id] ?? '#c0c0c0';
  const crimes = topCrimes(eventHistory);
  if (crimes.length === 0) crimes.push('clean record (suspicious)');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f1419"/>
      <stop offset="100%" stop-color="#1e1b2e"/>
    </linearGradient>
    <linearGradient id="suffer" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#00b894"/>
      <stop offset="50%" stop-color="#fdcb6e"/>
      <stop offset="100%" stop-color="#d63031"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="8" fill="${rankColor}"/>

  <text x="60" y="80" font-family="Arial Black, sans-serif" font-size="28" fill="#6c5ce7" font-weight="900" letter-spacing="4">GIT GUD — RAP SHEET</text>

  <text x="60" y="180" font-family="Arial Black, sans-serif" font-size="84" fill="${rankColor}" font-weight="900">${escapeXml(playerState.rank.name)}</text>
  <text x="60" y="240" font-family="Arial, sans-serif" font-size="48" fill="#ffffff" font-weight="700">${playerState.score.total} pts</text>

  <text x="60" y="320" font-family="Arial, sans-serif" font-size="20" fill="#a29bfe" font-weight="700" letter-spacing="2">PERSONALITY</text>
  <text x="60" y="360" font-family="Arial, sans-serif" font-size="34" fill="#ffffff" font-weight="700">${escapeXml(personality.type)}</text>

  <text x="60" y="430" font-family="Arial, sans-serif" font-size="20" fill="#a29bfe" font-weight="700" letter-spacing="2">TEAMMATE SUFFERING</text>
  <text x="60" y="470" font-family="Arial, sans-serif" font-size="32" fill="#ffffff" font-weight="700">${suffering.score}/100 — "${escapeXml(suffering.title)}"</text>
  <rect x="60" y="490" width="540" height="14" fill="#2d2440" rx="7"/>
  <rect x="60" y="490" width="${Math.max(0, Math.min(100, suffering.score)) * 5.4}" height="14" fill="url(#suffer)" rx="7"/>

  <text x="700" y="320" font-family="Arial, sans-serif" font-size="20" fill="#a29bfe" font-weight="700" letter-spacing="2">TOP GIT CRIMES</text>
  ${crimes
    .map(
      (c, i) =>
        `<text x="700" y="${365 + i * 38}" font-family="Arial, sans-serif" font-size="26" fill="#ffffff" font-weight="600">${i + 1}. ${escapeXml(c)}</text>`,
    )
    .join('\n  ')}

  <text x="60" y="570" font-family="Arial, sans-serif" font-size="18" fill="#636e72">Commits: ${stats.totalCommits}  •  Force pushes: ${stats.totalForcePushes}  •  Merge conflicts: ${stats.totalMergeConflicts}  •  Best streak: ${stats.longestCleanStreak}</text>
  <text x="60" y="600" font-family="Arial, sans-serif" font-size="16" fill="#6c5ce7" font-weight="700" letter-spacing="2">git gud or get gud at git</text>
</svg>`;
}

export function tweetIntentUrl(playerState: PlayerState): string {
  const text = `I got ranked ${playerState.rank.name} (${playerState.score.total} pts) in Git Gud 💀 #GitGud`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}
