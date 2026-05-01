export type {
  GitEventType,
  GitEvent,
  Score,
  Rank,
  Achievement,
  Roast,
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
} from './analysis';

// Stage 3 — Roast system
export { generateRoast, generateRoasts } from './roasts';
export type { RoastTemplate } from './roasts';

// Stage 3 — Scoring engine
export { calculateScore, SEVERITY_MULTIPLIER, CATEGORY_POINTS } from './scoring';

// Stage 3 — Rank system
export { RANK_LADDER, evaluateRank } from './ranks';
export type { RankEvaluation } from './ranks';
