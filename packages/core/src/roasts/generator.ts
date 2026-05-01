import type { Roast } from '../types';
import type { AnyVerdict } from '../analysis/types';
import type { RoastConfig } from './ollama';
import { templates } from './templates';
import { generateAIRoast } from './ollama';

export function generateTemplateRoast(verdict: AnyVerdict): Roast {
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

export async function generateRoast(
  verdict: AnyVerdict,
  config?: RoastConfig,
): Promise<Roast> {
  if (verdict.pattern === 'clean') {
    return {
      severity: 'mild',
      message: verdict.message,
      advice: verdict.advice,
    };
  }

  if (config?.ollamaApiKey) {
    try {
      return await generateAIRoast(verdict, config);
    } catch {
      return generateTemplateRoast(verdict);
    }
  }

  return generateTemplateRoast(verdict);
}

export async function generateRoasts(
  verdicts: AnyVerdict[],
  config?: RoastConfig,
): Promise<Roast[]> {
  const nonClean = verdicts.filter(v => v.pattern !== 'clean');
  return Promise.all(nonClean.map(v => generateRoast(v, config)));
}
