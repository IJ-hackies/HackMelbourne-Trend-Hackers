import type { Rank } from '../types';

export const RANK_LADDER: Rank[] = [
  { id: 'bronze',   name: 'Bronze Committer',       tier: 1, threshold: 0 },
  { id: 'silver',   name: 'Silver Rebaser',          tier: 2, threshold: 100 },
  { id: 'gold',     name: 'Gold Merger',              tier: 3, threshold: 300 },
  { id: 'platinum', name: 'Platinum Merge Survivor',  tier: 4, threshold: 600 },
  { id: 'diamond',  name: 'Diamond Git Wizard',       tier: 5, threshold: 1000 },
];
