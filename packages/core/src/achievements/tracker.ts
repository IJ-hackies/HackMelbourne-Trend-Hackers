import type { Achievement, PlayerStats } from '../types';
import { ACHIEVEMENTS } from './definitions';

export function checkAchievements(
  stats: PlayerStats,
  previouslyUnlocked: Set<string>,
): Achievement[] {
  const results: Achievement[] = [];

  for (const def of ACHIEVEMENTS) {
    if (previouslyUnlocked.has(def.id)) continue;

    const { unlocked, progress } = def.condition(stats);
    if (unlocked || progress > 0) {
      results.push({
        id: def.id,
        name: def.name,
        description: def.description,
        unlocked,
        progress,
      });
    }
  }

  return results;
}
