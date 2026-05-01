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

// Roast system
export { generateRoast, generateRoasts, generateTemplateRoast } from './roasts';
export type { RoastTemplate, RoastConfig, BrainrotEntry } from './roasts';
export { brainrotLibrary } from './roasts';

// Scoring engine
export { calculateScore, SEVERITY_MULTIPLIER, CATEGORY_POINTS } from './scoring';

// Rank system
export { RANK_LADDER, evaluateRank } from './ranks';
export type { RankEvaluation } from './ranks';

// Achievement system
export { ACHIEVEMENTS, checkAchievements } from './achievements';
export type { AchievementDefinition } from './achievements';

// Personality & suffering
export { calculateSuffering, classifyPersonality } from './personality';
export type { SufferingResult, PersonalityResult } from './personality';

// Unified pipeline
export { evaluate } from './evaluate';
export type { PlayerState, EvaluationResult } from './evaluate';
