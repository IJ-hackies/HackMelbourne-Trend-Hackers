import type { Achievement, PlayerStats } from '../types';
import { ACHIEVEMENTS } from './definitions';

function getStatValue(stats: PlayerStats, key: string): number {
  if (key === 'uniqueBranches') return stats.uniqueBranches.size;
  return (stats as any)[key] ?? 0;
}

export function checkAchievements(
  stats: PlayerStats,
  previouslyUnlocked: Set<string>,
): Achievement[] {
  const results: Achievement[] = [];

  for (const def of ACHIEVEMENTS) {
    const currentValue = getStatValue(stats, def.trigger.statKey ?? '');
    const threshold = def.trigger.threshold ?? 1;
    const progress = Math.min(1, currentValue / threshold);
    const unlocked = previouslyUnlocked.has(def.id) || currentValue >= threshold;

    // Special case: README Avoider requires score >= 300 AND zero readme edits
    if (def.id === 'readme-avoider') {
      const meetsScore = stats.score >= 300;
      const noReadme = stats.readmeEdits === 0;
      results.push({
        id: def.id,
        name: def.name,
        description: def.description,
        unlocked: previouslyUnlocked.has(def.id) || (meetsScore && noReadme),
        progress: noReadme ? Math.min(1, stats.score / 300) : 0,
      });
      continue;
    }

    results.push({
      id: def.id,
      name: def.name,
      description: def.description,
      unlocked,
      progress,
    });
  }

  return results;
}
