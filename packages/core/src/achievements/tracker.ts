import type { Achievement, PlayerStats, GitEvent } from '../types';
import { ACHIEVEMENTS } from './definitions';

export function checkAchievements(
    event: GitEvent,
    stats: PlayerStats
): Achievement[] {
    return ACHIEVEMENTS.map(def => {
        const result = def.condition(stats);
        return {
            id: def.id,
            name: def.name,
            description: def.description,
            unlocked: result.unlocked,
            progress: result.progress,
        };
    });
}
