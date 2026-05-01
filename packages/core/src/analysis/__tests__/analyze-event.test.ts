import { describe, it, expect } from 'vitest';
import { analyzeEvent } from '../analyze-event';
import type { GitEvent } from '../../types';
import type { AnalysisContext } from '../types';

function commitEvent(metadata: Record<string, unknown> = {}): GitEvent {
  return { type: 'commit', timestamp: Date.now(), metadata };
}

describe('analyzeEvent', () => {
  it('returns verdicts from commit message and commit size for a commit event', () => {
    const result = analyzeEvent(
      commitEvent({
        message: 'fix',
        stats: { filesChanged: 50, insertions: 2000, deletions: 100 },
      }),
    );
    const categories = result.verdicts.map(v => v.category);
    expect(categories).toContain('commit-message');
    expect(categories).toContain('commit-size');
  });

  it('includes branch name verdict when context provides it', () => {
    const ctx: AnalysisContext = { branchName: 'main', isDefaultBranch: true };
    const result = analyzeEvent(commitEvent({ message: 'quick fix' }), ctx);
    const categories = result.verdicts.map(v => v.category);
    expect(categories).toContain('branch-name');
  });

  it('includes risky action verdict for force push', () => {
    const event: GitEvent = { type: 'force-push', timestamp: Date.now(), metadata: {} };
    const result = analyzeEvent(event);
    const categories = result.verdicts.map(v => v.category);
    expect(categories).toContain('risky-action');
  });

  it('includes session verdict when timestamps are provided', () => {
    const now = new Date(2026, 4, 1, 3, 0); // 3 AM
    const ctx: AnalysisContext = { recentCommitTimestamps: [now] };
    const result = analyzeEvent(commitEvent({ message: 'late night fix for auth' }), ctx);
    const categories = result.verdicts.map(v => v.category);
    expect(categories).toContain('session');
  });

  it('sorts verdicts by severity descending', () => {
    const ctx: AnalysisContext = { branchName: 'main', isDefaultBranch: true };
    const result = analyzeEvent(
      commitEvent({
        message: 'feat: add user authentication with proper OAuth2 flow',
        stats: { filesChanged: 5, insertions: 80, deletions: 20 },
      }),
      ctx,
    );
    const severities = result.verdicts.map(v => v.severity);
    const order = { critical: 2, warning: 1, info: 0 };
    for (let i = 1; i < severities.length; i++) {
      expect(order[severities[i]]).toBeLessThanOrEqual(order[severities[i - 1]]);
    }
  });

  it('sets highestSeverity to the maximum among verdicts', () => {
    const ctx: AnalysisContext = { branchName: 'main', isDefaultBranch: true };
    const result = analyzeEvent(commitEvent({ message: 'a decent commit message here' }), ctx);
    expect(result.highestSeverity).toBe('critical');
  });

  it('returns info highestSeverity when everything is clean', () => {
    const ctx: AnalysisContext = { branchName: 'feat/login' };
    const result = analyzeEvent(
      commitEvent({
        message: 'feat: add login flow with session management',
        stats: { filesChanged: 4, insertions: 60, deletions: 10 },
      }),
      ctx,
    );
    expect(result.highestSeverity).toBe('info');
  });

  it('does not include commit message verdict for non-commit events', () => {
    const event: GitEvent = { type: 'branch-switch', timestamp: Date.now(), metadata: {} };
    const result = analyzeEvent(event);
    const categories = result.verdicts.map(v => v.category);
    expect(categories).not.toContain('commit-message');
    expect(categories).not.toContain('commit-size');
  });

  it('handles a commit event with no metadata gracefully', () => {
    const result = analyzeEvent(commitEvent());
    expect(result.verdicts).toHaveLength(0);
    expect(result.highestSeverity).toBe('info');
  });

  it('does not include session verdict when no timestamps provided', () => {
    const result = analyzeEvent(commitEvent({ message: 'fix: resolve null check' }));
    const categories = result.verdicts.map(v => v.category);
    expect(categories).not.toContain('session');
  });
});
