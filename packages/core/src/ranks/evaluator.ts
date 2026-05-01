import type { Rank, RankEvaluation } from '../types';
import { getRankForScore } from './definitions';

export function evaluateRank(score: number, previousRank?: Rank): RankEvaluation {
    const rank = getRankForScore(score);
    const promoted = previousRank ? rank.tier > previousRank.tier : false;
    const demoted = previousRank ? rank.tier < previousRank.tier : false;

    return {
        rank,
        promoted,
        demoted,
        previousRank: previousRank || null,
    };
}
