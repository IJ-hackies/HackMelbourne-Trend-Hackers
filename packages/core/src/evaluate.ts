import type { GitEvent, Rank, Roast, Score, Achievement, PlayerStats } from './types';
import type { AnalysisContext, AnalysisResult } from './analysis/types';
import type { RankEvaluation } from './ranks/evaluator';
import type { PersonalityResult } from './personality/classifier';
import type { RoastConfig } from './roasts/generator';
import { analyzeEvent } from './analysis/analyze-event';
import { generateRoasts } from './roasts/generator';
import { calculateScore } from './scoring/engine';
import { evaluateRank } from './ranks/evaluator';
import { checkAchievements } from './achievements/tracker';
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
  combinedRoast: Roast | null;
  score: Score;
  rankEvaluation: RankEvaluation;
  achievements: Achievement[];
  personality: PersonalityResult;
}

export async function evaluate(
  event: GitEvent,
  playerState: PlayerState,
  context?: AnalysisContext,
  roastConfig?: RoastConfig,
): Promise<EvaluationResult> {
  const t0 = Date.now();
  const analysis = analyzeEvent(event, context);
  console.log(`[GitGud] Analysis: ${Date.now() - t0}ms`);

  const tRoasts = Date.now();
  const roasts = await generateRoasts(analysis.verdicts, roastConfig, event);
  console.log(`[GitGud] Roasts AI: ${Date.now() - tRoasts}ms`);

  const score = calculateScore(analysis.verdicts, playerState.score);

  const rankEvaluation = evaluateRank(score.total, playerState.rank);

  const statsWithScore: PlayerStats = { ...playerState.stats, score: score.total };

  const achievements = checkAchievements(statsWithScore, playerState.unlockedAchievements);

  const personality = classifyPersonality(statsWithScore);

  return {
    analysis,
    roasts,
    combinedRoast: null,
    score,
    rankEvaluation,
    achievements,
    personality,
  };
}
