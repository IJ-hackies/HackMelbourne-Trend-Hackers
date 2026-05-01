import { describe, it, expect } from 'vitest';
import { classifyRiskyAction } from '../risky-action';
import type { GitEvent } from '../../types';

function event(overrides: Partial<GitEvent> & Pick<GitEvent, 'type'>): GitEvent {
  return { timestamp: Date.now(), metadata: {}, ...overrides };
}

describe('classifyRiskyAction', () => {
  describe('force-push', () => {
    it('flags force pushes as critical', () => {
      const result = classifyRiskyAction(event({ type: 'force-push' }));
      expect(result).not.toBeNull();
      expect(result!.pattern).toBe('force-push');
      expect(result!.severity).toBe('critical');
    });
  });

  describe('direct-push-default', () => {
    it('flags push to main via isDefaultBranch metadata', () => {
      const result = classifyRiskyAction(event({
        type: 'push',
        metadata: { branch: 'main', isDefaultBranch: true },
      }));
      expect(result).not.toBeNull();
      expect(result!.pattern).toBe('direct-push-default');
      expect(result!.severity).toBe('critical');
    });

    it('flags push to master by branch name', () => {
      const result = classifyRiskyAction(event({
        type: 'push',
        metadata: { branch: 'master' },
      }));
      expect(result).not.toBeNull();
      expect(result!.pattern).toBe('direct-push-default');
    });

    it('does not flag push to feature branch', () => {
      const result = classifyRiskyAction(event({
        type: 'push',
        metadata: { branch: 'feat/login' },
      }));
      expect(result).toBeNull();
    });
  });

  describe('shared-rebase', () => {
    it('flags rebase on shared branch as critical', () => {
      const result = classifyRiskyAction(event({
        type: 'rebase',
        metadata: { isSharedBranch: true },
      }));
      expect(result).not.toBeNull();
      expect(result!.pattern).toBe('shared-rebase');
      expect(result!.severity).toBe('critical');
    });

    it('flags rebase on remote-tracking branch as warning', () => {
      const result = classifyRiskyAction(event({
        type: 'rebase',
        metadata: { hasRemoteTracking: true },
      }));
      expect(result).not.toBeNull();
      expect(result!.pattern).toBe('shared-rebase');
      expect(result!.severity).toBe('warning');
    });

    it('does not flag rebase on local-only branch', () => {
      const result = classifyRiskyAction(event({ type: 'rebase' }));
      expect(result).toBeNull();
    });
  });

  describe('delete-remote-branch', () => {
    it('flags remote branch deletion', () => {
      const result = classifyRiskyAction(event({
        type: 'push',
        metadata: { deletedRemoteBranch: 'feat/old-feature' },
      }));
      expect(result).not.toBeNull();
      expect(result!.pattern).toBe('delete-remote-branch');
      expect(result!.severity).toBe('warning');
    });
  });

  describe('hard-reset', () => {
    it('flags hard reset as critical', () => {
      const result = classifyRiskyAction(event({
        type: 'commit',
        metadata: { isHardReset: true },
      }));
      expect(result).not.toBeNull();
      expect(result!.pattern).toBe('hard-reset');
      expect(result!.severity).toBe('critical');
    });
  });

  describe('non-risky events', () => {
    it('returns null for a normal commit', () => {
      expect(classifyRiskyAction(event({ type: 'commit' }))).toBeNull();
    });

    it('returns null for a branch switch', () => {
      expect(classifyRiskyAction(event({ type: 'branch-switch' }))).toBeNull();
    });

    it('returns null for a normal merge', () => {
      expect(classifyRiskyAction(event({ type: 'merge' }))).toBeNull();
    });
  });
});
