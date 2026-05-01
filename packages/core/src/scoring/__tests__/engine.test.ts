import { describe, it, expect } from 'vitest';
import { calculateScore } from '../engine';
import type { CommitMessageVerdict, CommitSizeVerdict, RiskyActionVerdict } from '../../analysis/types';
import type { Score } from '../../types';

const ZERO_SCORE: Score = { total: 0, delta: 0, breakdown: {} };

const cleanCommit: CommitMessageVerdict = {
  severity: 'info',
  category: 'commit-message',
  pattern: 'clean',
  message: 'Good message.',
  advice: 'Keep it up.',
};

const badCommit: CommitMessageVerdict = {
  severity: 'warning',
  category: 'commit-message',
  pattern: 'generic',
  message: 'Bad message.',
  advice: 'Be specific.',
};

const criticalAction: RiskyActionVerdict = {
  severity: 'critical',
  category: 'risky-action',
  pattern: 'force-push',
  message: 'Force push.',
  advice: 'Don\'t.',
};

describe('calculateScore', () => {
  it('increases score for clean verdicts', () => {
    const result = calculateScore([cleanCommit], ZERO_SCORE);
    expect(result.delta).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
  });

  it('decreases score for bad verdicts', () => {
    const starting: Score = { total: 100, delta: 0, breakdown: {} };
    const result = calculateScore([badCommit], starting);
    expect(result.delta).toBeLessThan(0);
    expect(result.total).toBeLessThan(100);
  });

  it('floors score at 0', () => {
    const result = calculateScore([criticalAction], ZERO_SCORE);
    expect(result.total).toBe(0);
    expect(result.delta).toBeLessThan(0);
  });

  it('applies severity multiplier', () => {
    const warningResult = calculateScore([badCommit], ZERO_SCORE);

    const criticalCommit: CommitMessageVerdict = { ...badCommit, severity: 'critical' };
    const criticalResult = calculateScore([criticalCommit], ZERO_SCORE);

    expect(Math.abs(criticalResult.delta)).toBeGreaterThan(Math.abs(warningResult.delta));
  });

  it('provides per-category breakdown', () => {
    const cleanSize: CommitSizeVerdict = {
      severity: 'info',
      category: 'commit-size',
      pattern: 'clean',
      message: 'Good size.',
      advice: 'Keep it up.',
    };
    const result = calculateScore([cleanCommit, cleanSize], ZERO_SCORE);
    expect(result.breakdown['commit-message']).toBeDefined();
    expect(result.breakdown['commit-size']).toBeDefined();
  });

  it('accumulates multiple verdicts', () => {
    const result = calculateScore([cleanCommit, badCommit], ZERO_SCORE);
    expect(result.breakdown['commit-message']).toBeDefined();
    expect(result.delta).toBe(
      result.breakdown['commit-message']
    );
  });
});
