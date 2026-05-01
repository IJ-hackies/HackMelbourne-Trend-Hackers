import { describe, it, expect } from 'vitest';
import { analyzeCommitMessage } from '../commit-message';

describe('analyzeCommitMessage', () => {
  describe('too-short', () => {
    it('flags empty messages as critical', () => {
      const result = analyzeCommitMessage('');
      expect(result.pattern).toBe('too-short');
      expect(result.severity).toBe('critical');
    });

    it('flags whitespace-only messages as critical', () => {
      const result = analyzeCommitMessage('   ');
      expect(result.pattern).toBe('too-short');
      expect(result.severity).toBe('critical');
    });

    it('flags 1-3 character messages as critical', () => {
      expect(analyzeCommitMessage('fix').pattern).toBe('too-short');
      expect(analyzeCommitMessage('ok').pattern).toBe('too-short');
      expect(analyzeCommitMessage('x').pattern).toBe('too-short');
    });
  });

  describe('emoji-only', () => {
    it('flags emoji-only messages', () => {
      const result = analyzeCommitMessage('🔥🚀');
      expect(result.pattern).toBe('emoji-only');
      expect(result.severity).toBe('warning');
    });

    it('does not flag messages with emoji and text', () => {
      const result = analyzeCommitMessage('🔥 fix login bug');
      expect(result.pattern).not.toBe('emoji-only');
    });
  });

  describe('all-caps', () => {
    it('flags all-caps messages', () => {
      const result = analyzeCommitMessage('FIX THIS STUPID BUG');
      expect(result.pattern).toBe('all-caps');
      expect(result.severity).toBe('warning');
    });

    it('does not flag short all-caps (handled by other rules)', () => {
      const result = analyzeCommitMessage('FIX');
      expect(result.pattern).not.toBe('all-caps');
    });

    it('does not flag mixed case', () => {
      const result = analyzeCommitMessage('Fix the authentication module');
      expect(result.pattern).not.toBe('all-caps');
    });
  });

  describe('default-message', () => {
    it('flags "Initial commit"', () => {
      const result = analyzeCommitMessage('Initial commit');
      expect(result.pattern).toBe('default-message');
    });

    it('flags "Merge branch ..." messages', () => {
      const result = analyzeCommitMessage('Merge branch main into feature');
      expect(result.pattern).toBe('default-message');
    });

    it('flags "Update README.md"', () => {
      const result = analyzeCommitMessage('Update README.md');
      expect(result.pattern).toBe('default-message');
    });
  });

  describe('generic', () => {
    it('flags single generic words', () => {
      expect(analyzeCommitMessage('update').pattern).toBe('generic');
      expect(analyzeCommitMessage('changes').pattern).toBe('generic');
      expect(analyzeCommitMessage('stuff').pattern).toBe('generic');
    });

    it('flags short generic phrases', () => {
      expect(analyzeCommitMessage('fix bug').pattern).toBe('generic');
    });

    it('does not flag specific messages starting with generic words', () => {
      const result = analyzeCommitMessage('fix: resolve login redirect loop in auth module');
      expect(result.pattern).toBe('clean');
    });
  });

  describe('no-context', () => {
    it('flags short two-word messages that are not generic', () => {
      const result = analyzeCommitMessage('refactor auth');
      expect(result.pattern).toBe('no-context');
      expect(result.severity).toBe('info');
    });
  });

  describe('clean', () => {
    it('accepts well-written commit messages', () => {
      const good = [
        'feat: add user authentication with OAuth2 support',
        'fix: resolve race condition in WebSocket handler',
        'refactor: extract validation logic into shared module',
        'chore: upgrade dependencies to latest patch versions',
      ];
      for (const msg of good) {
        const result = analyzeCommitMessage(msg);
        expect(result.pattern).toBe('clean');
        expect(result.severity).toBe('info');
      }
    });
  });
});
