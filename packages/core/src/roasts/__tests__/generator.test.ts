import { describe, it, expect } from 'vitest';
import { generateRoast, generateRoasts } from '../generator';
import type { CommitMessageVerdict, BranchNameVerdict, CommitSizeVerdict, RiskyActionVerdict, SessionVerdict } from '../../analysis/types';

const cleanVerdict: CommitMessageVerdict = {
  severity: 'info',
  category: 'commit-message',
  pattern: 'clean',
  message: 'Commit message looks reasonable.',
  advice: 'Keep it up.',
};

const badVerdict: CommitMessageVerdict = {
  severity: 'warning',
  category: 'commit-message',
  pattern: 'generic',
  message: '"update" — that could mean anything.',
  advice: 'Be specific.',
};

describe('generateRoast', () => {
  it('returns a valid Roast with non-empty fields', () => {
    const roast = generateRoast(badVerdict);
    expect(roast.message).toBeTruthy();
    expect(roast.advice).toBeTruthy();
    expect(['mild', 'medium', 'savage']).toContain(roast.severity);
  });

  it('falls back gracefully for clean verdicts', () => {
    const roast = generateRoast(cleanVerdict);
    expect(roast.severity).toBe('mild');
    expect(roast.message).toBeTruthy();
  });

  it('produces roasts for branch-name verdicts', () => {
    const verdict: BranchNameVerdict = {
      severity: 'critical',
      category: 'branch-name',
      pattern: 'default-branch',
      message: 'Committing directly to main.',
      advice: 'Create a feature branch.',
    };
    const roast = generateRoast(verdict);
    expect(roast.message).toBeTruthy();
    expect(roast.advice).toBeTruthy();
  });

  it('produces roasts for commit-size verdicts', () => {
    const verdict: CommitSizeVerdict = {
      severity: 'warning',
      category: 'commit-size',
      pattern: 'giant',
      message: 'Hefty commit.',
      advice: 'Split it up.',
    };
    const roast = generateRoast(verdict);
    expect(roast.message).toBeTruthy();
  });

  it('produces roasts for risky-action verdicts', () => {
    const verdict: RiskyActionVerdict = {
      severity: 'critical',
      category: 'risky-action',
      pattern: 'force-push',
      message: 'Force push detected.',
      advice: 'Don\'t.',
    };
    const roast = generateRoast(verdict);
    expect(roast.message).toBeTruthy();
  });

  it('produces roasts for session verdicts', () => {
    const verdict: SessionVerdict = {
      severity: 'warning',
      category: 'session',
      pattern: 'late-night',
      message: 'Late night coding.',
      advice: 'Sleep.',
    };
    const roast = generateRoast(verdict);
    expect(roast.message).toBeTruthy();
  });

  it('can produce different messages for the same input (randomness)', () => {
    const messages = new Set<string>();
    for (let i = 0; i < 50; i++) {
      messages.add(generateRoast(badVerdict).message);
    }
    expect(messages.size).toBeGreaterThan(1);
  });
});

describe('generateRoasts', () => {
  it('filters out clean verdicts', () => {
    const roasts = generateRoasts([cleanVerdict, badVerdict]);
    expect(roasts).toHaveLength(1);
  });

  it('returns empty array for all-clean verdicts', () => {
    const roasts = generateRoasts([cleanVerdict]);
    expect(roasts).toHaveLength(0);
  });
});
