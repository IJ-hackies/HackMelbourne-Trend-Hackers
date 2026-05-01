import { describe, it, expect } from 'vitest';
import { calculateSuffering } from '../suffering';
import type { PlayerStats } from '../../types';

function makeStats(overrides: Partial<PlayerStats> = {}): PlayerStats {
  return {
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
  };
}

describe('calculateSuffering', () => {
  it('returns 0 score for clean stats', () => {
    const result = calculateSuffering(makeStats());
    expect(result.score).toBe(0);
    expect(result.title).toBe('Tolerable Coworker');
  });

  it('scales with force pushes', () => {
    const low = calculateSuffering(makeStats({ totalForcePushes: 1 }));
    const high = calculateSuffering(makeStats({ totalForcePushes: 5 }));
    expect(high.score).toBeGreaterThan(low.score);
  });

  it('caps at 100', () => {
    const result = calculateSuffering(makeStats({
      totalForcePushes: 100,
      directMainPushes: 100,
      totalMergeConflicts: 100,
      hardResets: 100,
      panicBursts: 100,
      averageCommitSize: 2000,
      totalCommits: 50,
      deletedRemoteBranches: 100,
    }));
    expect(result.score).toBe(100);
  });

  it('assigns escalating titles', () => {
    expect(calculateSuffering(makeStats()).title).toBe('Tolerable Coworker');
    expect(calculateSuffering(makeStats({ totalForcePushes: 5, directMainPushes: 4 })).title).toBe('Emotional Damage');
    expect(calculateSuffering(makeStats({ totalForcePushes: 5, directMainPushes: 4, hardResets: 2, panicBursts: 5 })).title).toBe('Active Hazard');
  });

  it('accounts for direct main pushes', () => {
    const result = calculateSuffering(makeStats({ directMainPushes: 4 }));
    expect(result.score).toBeGreaterThan(0);
  });

  it('accounts for large average commit size', () => {
    const result = calculateSuffering(makeStats({ averageCommitSize: 800, totalCommits: 10 }));
    expect(result.score).toBeGreaterThan(0);
  });
});
