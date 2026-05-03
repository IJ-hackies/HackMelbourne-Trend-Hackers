import * as vscode from 'vscode';
import type { PlayerState, EvaluationResult } from '@git-gud/core';
import type { Score, Rank, PlayerStats, Achievement, GitEvent } from '@git-gud/core';
import { RANK_LADDER } from '@git-gud/core';
import { migrate, CURRENT_SCHEMA_VERSION } from './migration';

interface SerializedState {
  schemaVersion: number;
  score: Score;
  rank: Rank;
  stats: Omit<PlayerStats, 'uniqueBranches'> & { uniqueBranches: string[] };
  unlockedAchievements: string[];
  eventHistory: StoredEvent[];
  recentCommitTimestamps: number[];
}

export interface StoredEvent {
  type: string;
  timestamp: number;
  roastExcerpt: string;
  roastAdvice?: string;
  severity: string;
  scoreDelta: number;
  reactionImage?: string;
}

const STATE_KEY = 'gitgud.playerState';
const MAX_EVENTS = 20;
const MAX_RECENT_TIMESTAMPS = 20;

export class StateManager {
  constructor(private globalState: vscode.Memento) {}

  loadPlayerState(): PlayerState {
    const raw = this.globalState.get<SerializedState>(STATE_KEY);
    if (!raw) return this.defaultPlayerState();

    const migrated = migrate(raw);

    return {
      score: migrated.score,
      rank: migrated.rank,
      stats: {
        ...migrated.stats,
        uniqueBranches: new Set(migrated.stats.uniqueBranches),
      },
      unlockedAchievements: new Set(migrated.unlockedAchievements),
    };
  }

  async saveAfterEvaluation(
    event: GitEvent,
    result: EvaluationResult,
    currentState: PlayerState,
  ): Promise<PlayerState> {
    const updatedStats = this.updateStats(currentState.stats, event, result);
    const newlyUnlocked = result.achievements
      .filter(a => a.unlocked && !currentState.unlockedAchievements.has(a.id))
      .map(a => a.id);

    const unlockedAchievements = new Set(currentState.unlockedAchievements);
    for (const id of newlyUnlocked) {
      unlockedAchievements.add(id);
    }

    const newState: PlayerState = {
      score: result.score,
      rank: result.rankEvaluation.rank,
      stats: updatedStats,
      unlockedAchievements,
    };

    const SEVERITY_RANK: Record<string, number> = { savage: 3, medium: 2, mild: 1 };
    const bestRoast = [...result.roasts].sort(
      (a, b) => (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0),
    )[0];

    const storedEvent: StoredEvent = {
      type: event.type,
      timestamp: event.timestamp,
      roastExcerpt: result.roasts[0]?.message ?? '',
      roastAdvice: result.roasts[0]?.advice ?? '',
      severity: result.analysis.highestSeverity,
      roastExcerpt: bestRoast?.message ?? '',
      severity: bestRoast?.severity ?? result.analysis.highestSeverity,
      scoreDelta: result.score.delta,
      reactionImage: bestRoast?.reactionImage,
    };

    const history = this.getEventHistory();
    history.unshift(storedEvent);
    if (history.length > MAX_EVENTS) history.length = MAX_EVENTS;

    const timestamps = this.getRecentCommitTimestamps();
    if (event.type === 'commit') {
      timestamps.unshift(event.timestamp);
      if (timestamps.length > MAX_RECENT_TIMESTAMPS) timestamps.length = MAX_RECENT_TIMESTAMPS;
    }

    const serialized: SerializedState = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      score: newState.score,
      rank: newState.rank,
      stats: {
        ...newState.stats,
        uniqueBranches: [...newState.stats.uniqueBranches],
      },
      unlockedAchievements: [...newState.unlockedAchievements],
      eventHistory: history,
      recentCommitTimestamps: timestamps,
    };

    await this.globalState.update(STATE_KEY, serialized);
    return newState;
  }

  getEventHistory(): StoredEvent[] {
    const raw = this.globalState.get<SerializedState>(STATE_KEY);
    return raw?.eventHistory ?? [];
  }

  getRecentCommitTimestamps(): number[] {
    const raw = this.globalState.get<SerializedState>(STATE_KEY);
    return raw?.recentCommitTimestamps ?? [];
  }

  getRecentCommitDates(): Date[] {
    return this.getRecentCommitTimestamps().map(t => new Date(t));
  }

  async resetState(): Promise<void> {
    await this.globalState.update(STATE_KEY, undefined);
  }

  private updateStats(
    current: PlayerStats,
    event: GitEvent,
    result: EvaluationResult,
  ): PlayerStats {
    const stats = { ...current, uniqueBranches: new Set(current.uniqueBranches) };
    const branch = event.metadata.branch as string | undefined;
    if (branch) stats.uniqueBranches.add(branch);

    const isClean = result.analysis.highestSeverity === 'info';

    switch (event.type) {
      case 'commit': {
        stats.totalCommits++;
        stats.commitsInCurrentSession++;
        if (isClean) {
          stats.cleanCommitStreak++;
          stats.longestCleanStreak = Math.max(stats.longestCleanStreak, stats.cleanCommitStreak);
        } else {
          stats.cleanCommitStreak = 0;
        }
        const s = event.metadata.stats as { filesChanged?: number; insertions?: number; deletions?: number } | undefined;
        if (s) {
          stats.totalFilesChanged += s.filesChanged ?? 0;
          stats.totalInsertions += s.insertions ?? 0;
          stats.totalDeletions += s.deletions ?? 0;
          const totalLines = (s.insertions ?? 0) + (s.deletions ?? 0);
          stats.averageCommitSize = stats.totalCommits > 0
            ? Math.round((stats.totalInsertions + stats.totalDeletions) / stats.totalCommits)
            : 0;
        }
        const files = event.metadata.stats as { files?: string[] } | undefined;
        if (files?.files?.some(f => /readme/i.test(f))) {
          stats.readmeEdits++;
        }
        const hour = new Date(event.timestamp).getHours();
        if (hour >= 0 && hour < 6) stats.lateNightCommits++;
        const day = new Date(event.timestamp).getDay();
        if (day === 0 || day === 6) stats.weekendCommits++;
        break;
      }
      case 'branch-switch':
        stats.totalBranchSwitches++;
        break;
      case 'push':
        stats.totalPushes++;
        break;
      case 'force-push':
        stats.totalForcePushes++;
        break;
      case 'rebase':
        stats.totalRebases++;
        break;
      case 'merge':
        stats.totalMerges++;
        break;
      case 'merge-conflict':
        stats.totalMergeConflicts++;
        break;
    }

    const DEFAULT_BRANCHES = new Set(['main', 'master', 'develop', 'development', 'dev']);
    if ((event.type === 'commit' || event.type === 'push') && branch && DEFAULT_BRANCHES.has(branch.toLowerCase())) {
      stats.directMainPushes++;
    }

    stats.score = result.score.total;

    return stats;
  }

  private defaultPlayerState(): PlayerState {
    return {
      score: { total: 0, delta: 0, breakdown: {} },
      rank: RANK_LADDER[0],
      stats: {
        totalCommits: 0,
        totalForcePushes: 0,
        totalMergeConflicts: 0,
        totalBranchSwitches: 0,
        totalPushes: 0,
        totalRebases: 0,
        totalMerges: 0,
        directMainPushes: 0,
        hardResets: 0,
        deletedRemoteBranches: 0,
        cleanCommitStreak: 0,
        longestCleanStreak: 0,
        totalFilesChanged: 0,
        totalInsertions: 0,
        totalDeletions: 0,
        uniqueBranches: new Set(),
        readmeEdits: 0,
        sessionsOver4Hours: 0,
        lateNightCommits: 0,
        weekendCommits: 0,
        panicBursts: 0,
        commitsInCurrentSession: 0,
        averageCommitSize: 0,
        score: 0,
        goodCommitStreak: 0,
        totalConflictsResolved: 0,
        totalRebaseCompletes: 0,
      },
      unlockedAchievements: new Set(),
    };
  }
}
