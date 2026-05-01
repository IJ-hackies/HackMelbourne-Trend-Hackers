import { describe, it, expect } from 'vitest';
import { classifyPersonality } from '../classifier';
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

describe('classifyPersonality', () => {
  it('returns default for empty stats', () => {
    const result = classifyPersonality(makeStats());
    expect(result.type).toBe('Unclassified Recruit');
  });

  it('detects Commit Goblin', () => {
    const result = classifyPersonality(makeStats({
      totalCommits: 60,
      averageCommitSize: 10,
      commitsInCurrentSession: 10,
    }));
    expect(result.type).toBe('Commit Goblin');
  });

  it('detects Chaos Mage', () => {
    const result = classifyPersonality(makeStats({
      totalForcePushes: 3,
      totalRebases: 3,
      hardResets: 2,
    }));
    expect(result.type).toBe('Chaos Mage');
  });

  it('detects README Avoider', () => {
    const result = classifyPersonality(makeStats({
      totalCommits: 50,
      readmeEdits: 0,
    }));
    expect(result.type).toBe('README Avoider');
  });

  it('detects Monolith Merchant', () => {
    const result = classifyPersonality(makeStats({
      averageCommitSize: 700,
      totalCommits: 15,
      uniqueBranches: new Set(['main']),
    }));
    expect(result.type).toBe('Monolith Merchant');
  });

  it('detects The Perfectionist', () => {
    const result = classifyPersonality(makeStats({
      score: 600,
      longestCleanStreak: 15,
      totalForcePushes: 0,
      directMainPushes: 0,
      totalCommits: 30,
    }));
    expect(result.type).toBe('The Perfectionist');
  });

  it('detects Night Crawler', () => {
    const result = classifyPersonality(makeStats({
      lateNightCommits: 15,
      weekendCommits: 12,
    }));
    expect(result.type).toBe('Night Crawler');
  });

  it('picks the dominant archetype, not the first', () => {
    const result = classifyPersonality(makeStats({
      totalCommits: 60,
      averageCommitSize: 10,
      commitsInCurrentSession: 10,
      totalForcePushes: 1,
    }));
    expect(result.type).toBe('Commit Goblin');
  });
});
