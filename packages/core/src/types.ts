export enum GitEventType {
    Commit = 'commit',
    BranchSwitch = 'branch-switch',
    Push = 'push',
    ForcePush = 'force-push',
    Rebase = 'rebase',
    Merge = 'merge',
    MergeConflict = 'merge-conflict',
}

export interface GitEvent {
    type: GitEventType;
    timestamp: number;
    metadata: Record<string, unknown>;
}

export interface Score {
    total: number;
    delta: number;
    breakdown: Record<string, number>;
}

export interface Rank {
    id: string;
    name: string;
    tier: number;
    threshold: number;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    unlocked: boolean;
    progress: number;
}

export interface Roast {
    message: string;
    severity: 'mild' | 'medium' | 'savage';
    advice: string;
}

export interface AnalysisVerdict {
    severity: 'info' | 'warning' | 'critical';
    category: string;
    message: string;
    advice: string;
}

export interface CommitMessageVerdict extends AnalysisVerdict {
    category: 'commit-message';
    issues: string[];
}

export interface BranchNameVerdict extends AnalysisVerdict {
    category: 'branch-name';
    isDefaultBranch: boolean;
}

export interface CommitSizeVerdict extends AnalysisVerdict {
    category: 'commit-size';
    filesChanged: number;
    insertions: number;
    deletions: number;
}

export interface RiskyActionVerdict extends AnalysisVerdict {
    category: 'risky-action';
    actionType: string;
}

export interface SessionVerdict extends AnalysisVerdict {
    category: 'session-duration';
    sessionLengthMinutes: number;
    lateNight: boolean;
    weekend: boolean;
    burstMode: boolean;
}

export interface AnalysisResult {
    event: GitEvent;
    verdicts: AnalysisVerdict[];
    summary: string;
}

export interface RankEvaluation {
    rank: Rank;
    promoted: boolean;
    demoted: boolean;
    previousRank: Rank | null;
}

export interface SufferingResult {
    score: number;
    title: string;
}

export interface PersonalityResult {
    type: string;
    description: string;
}

export interface AnalysisContext {
    commitTimestamps?: number[];
    branch?: string;
    isDefaultBranch?: boolean;
}

export interface PlayerStats {
    totalCommits: number;
    totalForcePushes: number;
    totalMergeConflicts: number;
    totalRebases: number;
    totalDirectMainPushes: number;
    averageCommitSize: number;
    currentStreak: number;
    bestStreak: number;
    lateNightCommits: number;
    weekendCommits: number;
    branchCount: number;
    readmeEdits: number;
    eventHistory: GitEvent[];
    commitTimestamps: number[];
}

export interface PlayerState {
    score: Score;
    rank: Rank;
    achievements: Achievement[];
    stats: PlayerStats;
    personality: PersonalityResult;
    suffering: SufferingResult;
}

export interface EvaluationResult {
    roast: Roast;
    score: Score;
    rank: RankEvaluation;
    achievements: Achievement[];
    suffering: SufferingResult;
    personality: PersonalityResult;
    analysis: AnalysisResult;
    stats: PlayerStats;
}
