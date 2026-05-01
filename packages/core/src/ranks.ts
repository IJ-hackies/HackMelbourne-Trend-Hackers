import { Rank, Score } from './types';

export const RANK_THRESHOLDS: Record<Rank, number> = {
  'Bronze Committer': 0,
  'Silver Rebaser': 100,
  'Gold Pusher': 300,
  'Platinum Merge Survivor': 600,
  'Diamond Git Wizard': 1000,
};

export const EVENT_SCORE_DELTAS: Record<string, number> = {
  commit_good: 15,
  commit_ok: 5,
  commit_bad: -10,
  branch_switch: 2,
  merge_conflict_start: -15,
  merge_conflict_resolved: 20,
  rebase_start: -5,
  rebase_complete: 10,
  push_to_main: -30,
  force_push: -50,
  conflict_block_resolved: 5,
  file_fully_resolved: 10,
  conflict_block_preview: 0,
};

export function calculateRank(score: number): Rank {
  const ranks = Object.entries(RANK_THRESHOLDS).reverse() as [Rank, number][];
  for (const [rank, threshold] of ranks) {
    if (score >= threshold) return rank;
  }
  return 'Bronze Committer';
}

export function buildScore(total: number, delta: number): Score {
  const safe = Math.max(0, total);
  return { total: safe, rank: calculateRank(safe), lastEventDelta: delta };
}
