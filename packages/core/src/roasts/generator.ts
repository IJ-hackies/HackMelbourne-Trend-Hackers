import type { Roast } from '../types';
import type { AnyVerdict } from '../analysis/types';
import { templates } from './templates';

export function generateRoast(verdict: AnyVerdict): Roast {
  if (verdict.pattern === 'clean') {
    return {
      severity: 'mild',
      message: verdict.message,
      advice: verdict.advice,
    };
  }

  const matching = templates.filter(t => t.match(verdict));

  if (matching.length === 0) {
    return {
      severity: 'mild',
      message: verdict.message,
      advice: verdict.advice,
    };
  }

  const selected = matching[Math.floor(Math.random() * matching.length)];
  return selected.generate(verdict);
}

export function generateRoasts(verdicts: AnyVerdict[]): Roast[] {
  return verdicts
    .filter(v => v.pattern !== 'clean')
    .map(generateRoast);
}
