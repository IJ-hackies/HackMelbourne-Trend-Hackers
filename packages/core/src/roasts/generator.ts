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

/**
 * Replace {placeholder} tokens in a roast's message with values from the event metadata.
 * Unknown placeholders are left as-is so templates still read well without metadata.
 */
function interpolateRoast(roast: Roast, event?: GitEvent): Roast {
  if (!event) return roast;

  const meta = event.metadata ?? {};
  const hour = new Date(event.timestamp).getHours();

  const replacements: Record<string, string> = {
    message: (meta.message as string) ?? '',
    branch: (meta.branch as string) ?? '',
    files: String(meta.filesChanged ?? meta.files ?? ''),
    insertions: String(meta.insertions ?? ''),
    deletions: String(meta.deletions ?? ''),
    hour: `${hour}:00`,
  };

  let message = roast.message;
  for (const [key, value] of Object.entries(replacements)) {
    if (value) {
      message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
  }

  return { ...roast, message };
}

export function generateTemplateRoast(verdict: AnyVerdict, event?: GitEvent): Roast {
  if (verdict.pattern === 'clean') {
    return { severity: 'mild', message: verdict.message, advice: verdict.advice };
  }
  const matching = templates.filter(t => t.match(verdict));
  if (matching.length === 0) {
    return { severity: 'mild', message: verdict.message, advice: verdict.advice };
  }
  const selected = matching[Math.floor(Math.random() * matching.length)];
  const roast = selected.generate(verdict);
  return interpolateRoast(roast, event);
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
      return generateTemplateRoast(verdict, event);
    }
  }

  return generateTemplateRoast(verdict, event);
}

export async function generateRoasts(
  verdicts: AnyVerdict[],
  config?: RoastConfig,
  event?: GitEvent,
): Promise<Roast[]> {
  const nonClean = verdicts.filter(v => v.pattern !== 'clean');
  return Promise.all(nonClean.map(v => generateRoast(v, config, event)));
}
