import { Achievement, GitEvent, UserStats, checkAchievements } from '@git-gud/core';
import { StorageManager } from './storage';

export class AchievementManager {
  constructor(private storage: StorageManager) {}

  async check(event: GitEvent, stats: UserStats): Promise<Achievement[]> {
    const updated = checkAchievements(
      stats.achievements,
      event.type,
      stats.eventCounts,
      stats.goodCommitStreak,
    );

    const newlyUnlocked: Achievement[] = [];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].unlocked && !stats.achievements[i].unlocked) {
        newlyUnlocked.push(updated[i]);
      }
    }

    if (newlyUnlocked.length > 0) {
      await this.storage.saveStats({ ...stats, achievements: updated });
    }

    return newlyUnlocked;
  }
}
