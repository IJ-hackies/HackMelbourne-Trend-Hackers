import type { PlayerStats } from '../types';

export interface SufferingResult {
  score: number;
  title: string;
}

const TITLES: { threshold: number; title: string }[] = [
  { threshold: 80, title: 'Geneva Convention Violation' },
  { threshold: 60, title: 'Active Hazard' },
  { threshold: 40, title: 'Emotional Damage' },
  { threshold: 20, title: 'Mild Annoyance' },
  { threshold: 0, title: 'Tolerable Coworker' },
];

export function calculateSuffering(stats: PlayerStats): SufferingResult {
  let raw = 0;

  raw += Math.min(30, stats.totalForcePushes * 6);
  raw += Math.min(20, stats.directMainPushes * 5);
  raw += Math.min(15, stats.totalMergeConflicts * 1.5);
  raw += Math.min(10, stats.hardResets * 5);
  raw += Math.min(10, stats.panicBursts * 2);

  if (stats.totalCommits > 0) {
    const avgSize = stats.averageCommitSize;
    if (avgSize > 500) raw += Math.min(10, (avgSize - 500) / 100);
  }

  raw += Math.min(5, stats.deletedRemoteBranches * 2.5);

  const score = Math.min(100, Math.max(0, Math.round(raw)));

  const title = TITLES.find(t => score >= t.threshold)!.title;

  return { score, title };
}
