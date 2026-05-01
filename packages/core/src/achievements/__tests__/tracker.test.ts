import { describe, it, expect } from 'vitest';
import { checkAchievements } from '../tracker';
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

describe('checkAchievements', () => {
  it('returns empty array when no achievements are progressed', () => {
    const result = checkAchievements(makeStats(), new Set());
    expect(result).toEqual([]);
  });

  it('detects newly unlocked achievement', () => {
    const stats = makeStats({ totalMergeConflicts: 10 });
    const result = checkAchievements(stats, new Set());
    const survivor = result.find(a => a.id === 'merge-conflict-survivor');
    expect(survivor).toBeDefined();
    expect(survivor!.unlocked).toBe(true);
    expect(survivor!.progress).toBe(1);
  });

  it('reports partial progress', () => {
    const stats = makeStats({ totalForcePushes: 3 });
    const result = checkAchievements(stats, new Set());
    const felon = result.find(a => a.id === 'force-push-felon');
    expect(felon).toBeDefined();
    expect(felon!.unlocked).toBe(false);
    expect(felon!.progress).toBeCloseTo(0.6);
  });

  it('skips already unlocked achievements', () => {
    const stats = makeStats({ totalMergeConflicts: 10 });
    const result = checkAchievements(stats, new Set(['merge-conflict-survivor']));
    const survivor = result.find(a => a.id === 'merge-conflict-survivor');
    expect(survivor).toBeUndefined();
  });

  it('handles commit goblin achievement', () => {
    const stats = makeStats({ commitsInCurrentSession: 12 });
    const result = checkAchievements(stats, new Set());
    const goblin = result.find(a => a.id === 'commit-goblin');
    expect(goblin).toBeDefined();
    expect(goblin!.unlocked).toBe(true);
  });

  it('handles clean streak achievement', () => {
    const stats = makeStats({ longestCleanStreak: 20 });
    const result = checkAchievements(stats, new Set());
    const streak = result.find(a => a.id === 'clean-streak');
    expect(streak).toBeDefined();
    expect(streak!.unlocked).toBe(true);
  });

  it('readme avoider fails when readmes edited', () => {
    const stats = makeStats({ score: 500, readmeEdits: 1 });
    const result = checkAchievements(stats, new Set());
    const avoider = result.find(a => a.id === 'readme-avoider');
    expect(avoider).toBeUndefined();
  });

  it('readme avoider unlocks with high score and zero edits', () => {
    const stats = makeStats({ score: 300, readmeEdits: 0 });
    const result = checkAchievements(stats, new Set());
    const avoider = result.find(a => a.id === 'readme-avoider');
    expect(avoider).toBeDefined();
    expect(avoider!.unlocked).toBe(true);
  });

  it('progress is capped at 1', () => {
    const stats = makeStats({ totalCommits: 200 });
    const result = checkAchievements(stats, new Set());
    const centurion = result.find(a => a.id === 'centurion');
    expect(centurion).toBeDefined();
    expect(centurion!.progress).toBe(1);
  });

  it('branch necromancer tracks unique branches', () => {
    const branches = new Set(Array.from({ length: 15 }, (_, i) => `feat/branch-${i}`));
    const stats = makeStats({ uniqueBranches: branches });
    const result = checkAchievements(stats, new Set());
    const necro = result.find(a => a.id === 'branch-necromancer');
    expect(necro).toBeDefined();
    expect(necro!.unlocked).toBe(true);
  });
});
