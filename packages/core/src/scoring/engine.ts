import type { Score } from '../types';
import type { AnyVerdict } from '../analysis/types';
import { SEVERITY_MULTIPLIER, CATEGORY_POINTS, DEFAULT_CATEGORY_POINTS } from './rules';

export function calculateScore(
  verdicts: AnyVerdict[],
  currentScore: Score,
): Score {
  const breakdown: Record<string, number> = {};
  let delta = 0;

  for (const verdict of verdicts) {
    const points = CATEGORY_POINTS[verdict.category] ?? DEFAULT_CATEGORY_POINTS;
    const multiplier = SEVERITY_MULTIPLIER[verdict.severity];
    const isClean = verdict.pattern === 'clean';

    const change = isClean
      ? points.good
      : points.bad * multiplier;

    breakdown[verdict.category] = (breakdown[verdict.category] ?? 0) + change;
    delta += change;
  }

  const total = Math.max(0, currentScore.total + delta);

  return { total, delta, breakdown };
}
