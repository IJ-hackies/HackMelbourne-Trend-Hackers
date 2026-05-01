import type { Rank } from '../types';
import { RANK_LADDER } from './definitions';

export interface RankEvaluation {
  rank: Rank;
  promoted: boolean;
  demoted: boolean;
  previousRank: Rank | null;
}

export function evaluateRank(score: number, previousRank: Rank | null): RankEvaluation {
  let rank = RANK_LADDER[0];
  for (const r of RANK_LADDER) {
    if (score >= r.threshold) {
      rank = r;
    }
  }

  const promoted = previousRank !== null && rank.tier > previousRank.tier;
  const demoted = previousRank !== null && rank.tier < previousRank.tier;

  return { rank, promoted, demoted, previousRank };
}
