import { describe, it, expect } from 'vitest';
import { evaluateRank } from '../evaluator';
import { RANK_LADDER } from '../definitions';

const bronze = RANK_LADDER[0];
const silver = RANK_LADDER[1];
const gold = RANK_LADDER[2];
const platinum = RANK_LADDER[3];
const diamond = RANK_LADDER[4];

describe('evaluateRank', () => {
  it('returns Bronze for score 0', () => {
    const result = evaluateRank(0, null);
    expect(result.rank.id).toBe('bronze');
    expect(result.promoted).toBe(false);
    expect(result.demoted).toBe(false);
  });

  it('returns Bronze at score 99 (boundary)', () => {
    expect(evaluateRank(99, null).rank.id).toBe('bronze');
  });

  it('returns Silver at score 100 (boundary)', () => {
    expect(evaluateRank(100, null).rank.id).toBe('silver');
  });

  it('returns Gold at score 300', () => {
    expect(evaluateRank(300, null).rank.id).toBe('gold');
  });

  it('returns Platinum at score 600', () => {
    expect(evaluateRank(600, null).rank.id).toBe('platinum');
  });

  it('returns Diamond at score 1000', () => {
    expect(evaluateRank(1000, null).rank.id).toBe('diamond');
  });

  it('returns Diamond for very high scores', () => {
    expect(evaluateRank(99999, null).rank.id).toBe('diamond');
  });

  it('detects promotion', () => {
    const result = evaluateRank(100, bronze);
    expect(result.promoted).toBe(true);
    expect(result.demoted).toBe(false);
    expect(result.rank.id).toBe('silver');
    expect(result.previousRank?.id).toBe('bronze');
  });

  it('detects demotion', () => {
    const result = evaluateRank(50, silver);
    expect(result.demoted).toBe(true);
    expect(result.promoted).toBe(false);
    expect(result.rank.id).toBe('bronze');
  });

  it('detects no change at same rank', () => {
    const result = evaluateRank(150, silver);
    expect(result.promoted).toBe(false);
    expect(result.demoted).toBe(false);
    expect(result.rank.id).toBe('silver');
  });

  it('detects multi-tier promotion', () => {
    const result = evaluateRank(1000, bronze);
    expect(result.promoted).toBe(true);
    expect(result.rank.id).toBe('diamond');
  });

  it('handles null previousRank (first evaluation)', () => {
    const result = evaluateRank(500, null);
    expect(result.promoted).toBe(false);
    expect(result.demoted).toBe(false);
    expect(result.previousRank).toBeNull();
    expect(result.rank.id).toBe('gold');
  });
});
