import { describe, it, expect } from 'vitest';
import { analyzeBranchName } from '../branch-name';

describe('analyzeBranchName', () => {
  describe('default-branch', () => {
    it('flags main as critical', () => {
      const result = analyzeBranchName('main', true);
      expect(result.pattern).toBe('default-branch');
      expect(result.severity).toBe('critical');
    });

    it('flags master as critical', () => {
      const result = analyzeBranchName('master', false);
      expect(result.pattern).toBe('default-branch');
      expect(result.severity).toBe('critical');
    });

    it('flags develop as critical', () => {
      const result = analyzeBranchName('develop', false);
      expect(result.pattern).toBe('default-branch');
      expect(result.severity).toBe('critical');
    });

    it('flags via isDefault even with custom name', () => {
      const result = analyzeBranchName('production', true);
      expect(result.pattern).toBe('default-branch');
      expect(result.severity).toBe('critical');
    });
  });

  describe('bad-characters', () => {
    it('flags branch names with spaces', () => {
      const result = analyzeBranchName('my branch', false);
      expect(result.pattern).toBe('bad-characters');
    });

    it('flags branch names with tildes', () => {
      const result = analyzeBranchName('feat~thing', false);
      expect(result.pattern).toBe('bad-characters');
    });

    it('flags branch names with brackets', () => {
      const result = analyzeBranchName('fix/[ticket]', false);
      expect(result.pattern).toBe('bad-characters');
    });

    it('allows hyphens and slashes', () => {
      const result = analyzeBranchName('feat/my-feature', false);
      expect(result.pattern).not.toBe('bad-characters');
    });
  });

  describe('too-long', () => {
    it('flags branch names over 80 characters', () => {
      const longName = 'feat/' + 'a'.repeat(80);
      const result = analyzeBranchName(longName, false);
      expect(result.pattern).toBe('too-long');
      expect(result.severity).toBe('warning');
    });

    it('accepts branch names under 80 characters', () => {
      const result = analyzeBranchName('feat/reasonable-name', false);
      expect(result.pattern).not.toBe('too-long');
    });
  });

  describe('meaningless', () => {
    it('flags meaningless names', () => {
      const meaningless = ['test', 'branch1', 'my-branch', 'temp', 'wip'];
      for (const name of meaningless) {
        const result = analyzeBranchName(name, false);
        expect(result.pattern).toBe('meaningless');
      }
    });

    it('does not flag descriptive names', () => {
      const result = analyzeBranchName('user-login-fix', false);
      expect(result.pattern).not.toBe('meaningless');
    });
  });

  describe('no-prefix', () => {
    it('flags names without a convention prefix', () => {
      const result = analyzeBranchName('add-user-auth', false);
      expect(result.pattern).toBe('no-prefix');
      expect(result.severity).toBe('info');
    });

    it('accepts prefixed names', () => {
      const prefixed = ['feat/login', 'fix/bug-123', 'chore/deps', 'refactor/auth', 'test/coverage'];
      for (const name of prefixed) {
        const result = analyzeBranchName(name, false);
        expect(result.pattern).toBe('clean');
      }
    });
  });

  describe('clean', () => {
    it('accepts well-formed branch names', () => {
      const result = analyzeBranchName('feat/user-authentication', false);
      expect(result.pattern).toBe('clean');
      expect(result.severity).toBe('info');
    });
  });
});
