import type { GitEvent, Rank, Roast, Score, Achievement, PlayerStats } from './types';
import type { AnalysisContext, AnalysisResult } from './analysis/types';
import type { RankEvaluation } from './ranks/evaluator';
import type { SufferingResult } from './personality/suffering';
import type { PersonalityResult } from './personality/classifier';
import type { RoastConfig } from './roasts/generator';
import { analyzeEvent } from './analysis/analyze-event';
import { generateRoasts, generateCombinedRoast } from './roasts/generator';
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
  combinedRoast: Roast | null;
  score: Score;
  rankEvaluation: RankEvaluation;
  achievements: Achievement[];
  suffering: SufferingResult;
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

  // Templates for individual roasts (sidebar/history/voice), single AI call for the notification
  const tRoasts = Date.now();
  const roasts = await generateRoasts(analysis.verdicts, undefined, event);
  console.log(`[GitGud] Template roasts: ${Date.now() - tRoasts}ms`);

  const tAI = Date.now();
  const combinedRoast = await generateCombinedRoast(analysis.verdicts, roastConfig, event);
  console.log(`[GitGud] Combined AI roast: ${Date.now() - tAI}ms`);

  const score = calculateScore(analysis.verdicts, playerState.score);

  const rankEvaluation = evaluateRank(score.total, playerState.rank);

  const statsWithScore: PlayerStats = { ...playerState.stats, score: score.total };

  const achievements = checkAchievements(statsWithScore, playerState.unlockedAchievements);

  const suffering = calculateSuffering(statsWithScore);

  const personality = classifyPersonality(statsWithScore);

  return {
    analysis,
    roasts,
    combinedRoast,
    score,
    rankEvaluation,
    achievements,
    suffering,
    personality,
  };
}
