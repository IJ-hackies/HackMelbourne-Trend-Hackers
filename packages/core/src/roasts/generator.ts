import type { Roast, GitEvent } from '../types';
import type { AnyVerdict } from '../analysis/types';
import type { OllamaConfig } from './ollama';
import type { GeminiConfig } from './gemini';
import { templates } from './templates';
import { generateOllamaRoast } from './ollama';
import { generateGeminiRoast } from './gemini';

export interface RoastConfig {
  provider: 'ollama' | 'gemini';
  ollama?: OllamaConfig;
  gemini?: GeminiConfig;
}

export function generateTemplateRoast(verdict: AnyVerdict): Roast {
  if (verdict.pattern === 'clean') {
    return { severity: 'mild', message: verdict.message, advice: verdict.advice };
  }
  const matching = templates.filter(t => t.match(verdict));
  if (matching.length === 0) {
    return { severity: 'mild', message: verdict.message, advice: verdict.advice };
  }
  const selected = matching[Math.floor(Math.random() * matching.length)];
  return selected.generate(verdict);
}

export async function generateRoast(
  verdict: AnyVerdict,
  config?: RoastConfig,
  event?: GitEvent,
): Promise<Roast> {
  if (verdict.pattern === 'clean') {
    return { severity: 'mild', message: verdict.message, advice: verdict.advice };
  }

  if (config) {
    try {
      if (config.provider === 'gemini' && config.gemini?.apiKey) {
        return await generateGeminiRoast(verdict, config.gemini, event);
      }
      if (config.provider === 'ollama' && config.ollama?.apiKey) {
        return await generateOllamaRoast(verdict, config.ollama, event);
      }
      if (config.ollama?.apiKey) {
        return await generateOllamaRoast(verdict, config.ollama, event);
      }
      if (config.gemini?.apiKey) {
        return await generateGeminiRoast(verdict, config.gemini, event);
      }
    } catch {
      return generateTemplateRoast(verdict);
    }
  }

  return generateTemplateRoast(verdict);
}

export async function generateRoasts(
  verdicts: AnyVerdict[],
  config?: RoastConfig,
  event?: GitEvent,
): Promise<Roast[]> {
  const nonClean = verdicts.filter(v => v.pattern !== 'clean');
  return Promise.all(nonClean.map(v => generateRoast(v, config, event)));
}
