import type { Severity } from '../analysis/types';

export const SEVERITY_MULTIPLIER: Record<Severity, number> = {
  info: 1,
  warning: 2,
  critical: 3,
};

export const CATEGORY_POINTS: Record<string, { good: number; bad: number }> = {
  'commit-message': { good: 10, bad: -8 },
  'branch-name':    { good: 5,  bad: -10 },
  'commit-size':    { good: 8,  bad: -6 },
  'risky-action':   { good: 0,  bad: -15 },
  'session':        { good: 3,  bad: -4 },
};

export const DEFAULT_CATEGORY_POINTS = { good: 5, bad: -5 };
