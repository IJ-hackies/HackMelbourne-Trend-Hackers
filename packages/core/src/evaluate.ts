import type { GitEvent, Rank, Roast, Score, Achievement, PlayerStats } from './types';
import type { AnalysisContext, AnalysisResult } from './analysis/types';
import type { RankEvaluation } from './ranks/evaluator';
import type { SufferingResult } from './personality/suffering';
import type { PersonalityResult } from './personality/classifier';
import { analyzeEvent } from './analysis/analyze-event';
import { generateRoasts } from './roasts/generator';
import { calculateScore } from './scoring/engine';
import { evaluateRank } from './ranks/evaluator';
import { checkAchievements } from './achievements/tracker';
import { calculateSuffering } from './personality/suffering';
import { classifyPersonality } from './personality/classifier';

export interface PlayerState {
  score: Score;
  rank: Rank;
  stats: PlayerStats;
  unlockedAchievements: Set<string>;
}

export interface EvaluationResult {
  analysis: AnalysisResult;
  roasts: Roast[];
  score: Score;
  rankEvaluation: RankEvaluation;
  achievements: Achievement[];
  suffering: SufferingResult;
  personality: PersonalityResult;
}

export function evaluate(
  event: GitEvent,
  playerState: PlayerState,
  context?: AnalysisContext,
): EvaluationResult {
  const analysis = analyzeEvent(event, context);

  const roasts = generateRoasts(analysis.verdicts);

  const score = calculateScore(analysis.verdicts, playerState.score);

  const rankEvaluation = evaluateRank(score.total, playerState.rank);

  const statsWithScore: PlayerStats = { ...playerState.stats, score: score.total };

  const achievements = checkAchievements(statsWithScore, playerState.unlockedAchievements);

  const suffering = calculateSuffering(statsWithScore);

  const personality = classifyPersonality(statsWithScore);

  return {
    analysis,
    roasts,
    score,
    rankEvaluation,
    achievements,
    suffering,
    personality,
  };
}
