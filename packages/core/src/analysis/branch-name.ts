import type { BranchNameVerdict, Severity } from './types';

const DEFAULT_BRANCHES = new Set(['main', 'master', 'develop', 'development', 'dev']);

const MEANINGLESS_NAMES = new Set([
  'test', 'testing', 'branch', 'branch1', 'branch2',
  'my-branch', 'mybranch', 'temp', 'tmp', 'wip',
  'stuff', 'new-branch', 'new', 'patch', 'hotfix',
  'experiment', 'try', 'work', 'working',
]);

const PREFIX_RE = /^(feat|fix|chore|docs|style|refactor|perf|test|ci|build|revert)\//;

const BAD_CHARS_RE = /[\s~^:?*\[\]\\{}@]/;

const MAX_BRANCH_LENGTH = 80;

function verdict(
  severity: Severity,
  pattern: BranchNameVerdict['pattern'],
  message: string,
  advice: string,
): BranchNameVerdict {
  return { severity, category: 'branch-name', pattern, message, advice };
}

export function analyzeBranchName(branchName: string, isDefault: boolean): BranchNameVerdict {
  const name = branchName.trim();

  if (isDefault || DEFAULT_BRANCHES.has(name.toLowerCase())) {
    return verdict(
      'critical',
      'default-branch',
      `Committing directly to ${name}? Bold strategy.`,
      'Create a feature branch. Direct commits to the default branch bypass code review and break CI.',
    );
  }

  if (BAD_CHARS_RE.test(name)) {
    return verdict(
      'warning',
      'bad-characters',
      `"${name}" has characters that will haunt your shell history.`,
      'Stick to alphanumeric characters, hyphens, and forward slashes. Avoid spaces and special characters.',
    );
  }

  if (name.length > MAX_BRANCH_LENGTH) {
    return verdict(
      'warning',
      'too-long',
      `That branch name is ${name.length} characters. It's a branch, not a novel.`,
      `Keep branch names under ${MAX_BRANCH_LENGTH} characters. Long names are hard to type and read in logs.`,
    );
  }

  if (MEANINGLESS_NAMES.has(name.toLowerCase())) {
    return verdict(
      'warning',
      'meaningless',
      `"${name}" tells absolutely nothing about what you're working on.`,
      'Name branches after the work: feat/user-auth, fix/login-redirect, chore/upgrade-deps.',
    );
  }

  if (!PREFIX_RE.test(name)) {
    return verdict(
      'info',
      'no-prefix',
      `"${name}" doesn't follow a prefix convention.`,
      'Consider using prefixes like feat/, fix/, chore/ to categorize branches at a glance.',
    );
  }

  return verdict(
    'info',
    'clean',
    'Branch name looks good. Someone taught you well.',
    'Keep using descriptive, prefixed branch names.',
  );
}
