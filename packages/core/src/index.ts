export type {
  GitEventType,
  GitEvent,
  Score,
  Rank,
  Achievement,
  Roast,
  PlayerStats,
} from './types';

export type {
  Severity,
  AnalysisVerdict,
  CommitMessageVerdict,
  BranchNameVerdict,
  CommitSizeVerdict,
  RiskyActionVerdict,
  SessionVerdict,
  AnyVerdict,
  AnalysisContext,
  AnalysisResult,
  CommitSizeStats,
} from './analysis';

export {
  analyzeCommitMessage,
  analyzeBranchName,
  analyzeCommitSize,
  THRESHOLDS,
  classifyRiskyAction,
  analyzeSession,
  SESSION_THRESHOLDS,
  analyzeEvent,
} from './analysis';

// Stage 3 — Roast system
export { generateRoast, generateRoasts } from './roasts';
export type { RoastTemplate } from './roasts';

// Stage 3 — Scoring engine
export { calculateScore, SEVERITY_MULTIPLIER, CATEGORY_POINTS } from './scoring';

// Stage 3 — Rank system
export { RANK_LADDER, evaluateRank } from './ranks';
export type { RankEvaluation } from './ranks';

// Stage 3 — Achievement system
export { ACHIEVEMENTS, checkAchievements } from './achievements';
export type { AchievementDefinition } from './achievements';

// Stage 3 — Personality & suffering
export { calculateSuffering, classifyPersonality } from './personality';
export type { SufferingResult, PersonalityResult } from './personality';

// Stage 3 — Unified pipeline
export { evaluate } from './evaluate';
export type { PlayerState, EvaluationResult } from './evaluate';
