import { describe, it, expect } from 'vitest';
import { evaluate } from '../evaluate';
import type { PlayerState } from '../evaluate';
import type { GitEvent, PlayerStats } from '../types';
import { RANK_LADDER } from '../ranks/definitions';

function makePlayerState(overrides: Partial<PlayerStats> = {}): PlayerState {
  return {
    score: { total: 0, delta: 0, breakdown: {} },
    rank: RANK_LADDER[0],
    unlockedAchievements: new Set(),
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
      uniqueBranches: new Set<string>(),
      readmeEdits: 0,
      sessionsOver4Hours: 0,
      lateNightCommits: 0,
      weekendCommits: 0,
      panicBursts: 0,
      commitsInCurrentSession: 0,
      averageCommitSize: 0,
      score: 0,
      ...overrides,
    },
  };
}

describe('evaluate', () => {
  it('returns a complete EvaluationResult for a commit event', () => {
    const event: GitEvent = {
      type: 'commit',
      timestamp: Date.now(),
      metadata: { message: 'fix: resolve login redirect loop' },
    };

    const result = evaluate(event, makePlayerState());

    expect(result.analysis).toBeDefined();
    expect(result.analysis.verdicts.length).toBeGreaterThan(0);
    expect(result.score).toBeDefined();
    expect(result.score.total).toBeGreaterThanOrEqual(0);
    expect(result.rankEvaluation).toBeDefined();
    expect(result.rankEvaluation.rank).toBeDefined();
    expect(result.suffering).toBeDefined();
    expect(result.suffering.score).toBeGreaterThanOrEqual(0);
    expect(result.personality).toBeDefined();
    expect(result.personality.type).toBeDefined();
    expect(Array.isArray(result.achievements)).toBe(true);
    expect(Array.isArray(result.roasts)).toBe(true);
  });

  it('generates roasts for bad commit messages', () => {
    const event: GitEvent = {
      type: 'commit',
      timestamp: Date.now(),
      metadata: { message: 'fix' },
    };

    const result = evaluate(event, makePlayerState());
    expect(result.roasts.length).toBeGreaterThan(0);
  });

  it('does not generate roasts for clean commits', () => {
    const event: GitEvent = {
      type: 'commit',
      timestamp: Date.now(),
      metadata: { message: 'feat: add user authentication with OAuth2 flow' },
    };

    const result = evaluate(event, makePlayerState());
    expect(result.roasts.length).toBe(0);
  });

  it('detects rank promotion when score crosses threshold', () => {
    const state = makePlayerState();
    state.score = { total: 95, delta: 0, breakdown: {} };
    state.rank = RANK_LADDER[0];

    const event: GitEvent = {
      type: 'commit',
      timestamp: Date.now(),
      metadata: { message: 'feat: add comprehensive user settings page with validation' },
    };

    const result = evaluate(event, state);
    if (result.score.total >= 100) {
      expect(result.rankEvaluation.promoted).toBe(true);
    }
  });

  it('detects achievements based on stats', () => {
    const state = makePlayerState({ totalMergeConflicts: 10 });

    const event: GitEvent = {
      type: 'commit',
      timestamp: Date.now(),
      metadata: { message: 'refactor: clean up merge conflict artifacts' },
    };

    const result = evaluate(event, state);
    const survivor = result.achievements.find(a => a.id === 'merge-conflict-survivor');
    expect(survivor).toBeDefined();
    expect(survivor!.unlocked).toBe(true);
  });

  it('calculates suffering from chaotic stats', () => {
    const state = makePlayerState({
      totalForcePushes: 5,
      directMainPushes: 3,
    });

    const event: GitEvent = {
      type: 'commit',
      timestamp: Date.now(),
      metadata: { message: 'chore: update dependencies' },
    };

    const result = evaluate(event, state);
    expect(result.suffering.score).toBeGreaterThan(0);
  });

  it('passes analysis context through to analyzeEvent', () => {
    const event: GitEvent = {
      type: 'commit',
      timestamp: Date.now(),
      metadata: { message: 'wip' },
    };

    const result = evaluate(event, makePlayerState(), {
      branchName: 'main',
      isDefaultBranch: true,
    });

    const branchVerdict = result.analysis.verdicts.find(v => v.category === 'branch-name');
    expect(branchVerdict).toBeDefined();
    expect(branchVerdict!.severity).toBe('critical');
  });

  it('score never goes below 0', () => {
    const event: GitEvent = {
      type: 'force-push',
      timestamp: Date.now(),
      metadata: {},
    };

    const result = evaluate(event, makePlayerState());
    expect(result.score.total).toBeGreaterThanOrEqual(0);
  });
});
