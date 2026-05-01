import type { Rank } from '../types';

export const RANKS: Rank[] = [
    { id: 'bronze', name: 'Bronze Committer', tier: 1, threshold: 0 },
    { id: 'silver', name: 'Silver Rebaser', tier: 2, threshold: 100 },
    { id: 'gold', name: 'Gold Merger', tier: 3, threshold: 300 },
    { id: 'platinum', name: 'Platinum Merge Survivor', tier: 4, threshold: 600 },
    { id: 'diamond', name: 'Diamond Git Wizard', tier: 5, threshold: 1000 },
];

export function getRankForScore(score: number): Rank {
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (score >= RANKS[i].threshold) {
            return RANKS[i];
        }
    }
    return RANKS[0];
}
