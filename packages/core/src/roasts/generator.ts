import type { Roast, GitEvent, ReactionImageEntry } from '../types';
import type { AnyVerdict } from '../analysis/types';
import type { OllamaConfig } from './ollama';
import type { GeminiConfig } from './gemini';
import { templates } from './templates';
import { generateOllamaRoast, generateOllamaCombinedRoast } from './ollama';
import { generateGeminiRoast, generateGeminiCombinedRoast } from './gemini';

export interface RoastConfig {
  provider: 'ollama' | 'gemini';
  ollama?: OllamaConfig;
  gemini?: GeminiConfig;
  reactionImages?: ReactionImageEntry[];
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
        return await generateGeminiRoast(verdict, config.gemini, event, config.reactionImages);
      }
      if (config.provider === 'ollama' && config.ollama?.apiKey) {
        return await generateOllamaRoast(verdict, config.ollama, event, config.reactionImages);
      }
      if (config.ollama?.apiKey) {
        return await generateOllamaRoast(verdict, config.ollama, event, config.reactionImages);
      }
      if (config.gemini?.apiKey) {
        return await generateGeminiRoast(verdict, config.gemini, event, config.reactionImages);
      }
    } catch (err) {
      console.error(`[GitGud] Single roast AI call failed for ${verdict.category}/${verdict.pattern}:`, err);
      return generateTemplateRoast(verdict, event);
    }
  }

  return generateTemplateRoast(verdict, event);
}

const CONNECTORS = [
  'And', 'Oh and', 'Plus', 'Also', 'On top of that',
  'To make it worse', 'Not to mention', 'While you\'re at it',
];

function combineTemplateRoasts(roasts: Roast[]): Roast {
  if (roasts.length === 1) return roasts[0];

  const SEVERITY_RANK: Record<string, number> = { savage: 3, medium: 2, mild: 1 };
  const sorted = [...roasts].sort(
    (a, b) => (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0),
  );

  const top = sorted.slice(0, 3);
  const parts = [top[0].message];
  for (let i = 1; i < top.length; i++) {
    const connector = CONNECTORS[Math.floor(Math.random() * CONNECTORS.length)];
    const msg = top[i].message.charAt(0).toLowerCase() + top[i].message.slice(1);
    parts.push(`${connector}, ${msg}`);
  }

  return {
    message: parts.join('. '),
    severity: top[0].severity,
    advice: top.map(r => r.advice).filter(Boolean).join(' '),
  };
}

export async function generateCombinedRoast(
  verdicts: AnyVerdict[],
  config?: RoastConfig,
  event?: GitEvent,
): Promise<Roast> {
  const nonClean = verdicts.filter(v => v.pattern !== 'clean');
  if (nonClean.length === 0) {
    console.log('[GitGud] No non-clean verdicts, returning clean roast');
    return { severity: 'mild', message: 'Clean action. Shocking.', advice: 'Keep it up.' };
  }

  console.log(`[GitGud] ${nonClean.length} verdict(s): ${nonClean.map(v => `${v.category}/${v.pattern}`).join(', ')}`);

  if (nonClean.length === 1) {
    return generateRoast(nonClean[0], config, event);
  }

  if (config) {
    console.log(`[GitGud] AI config: provider=${config.provider}, ollama.apiKey=${config.ollama?.apiKey ? 'SET' : 'EMPTY'}, gemini.apiKey=${config.gemini?.apiKey ? 'SET' : 'EMPTY'}`);
    try {
      if (config.provider === 'gemini' && config.gemini?.apiKey) {
        console.log('[GitGud] Calling Gemini combined roast...');
        const result = await generateGeminiCombinedRoast(nonClean, config.gemini, event, config.reactionImages);
        console.log(`[GitGud] Gemini response: "${result.message}"`);
        return result;
      }
      if (config.provider === 'ollama' && config.ollama?.apiKey) {
        console.log(`[GitGud] Calling Ollama combined roast (model=${config.ollama.model}, url=${config.ollama.baseUrl})...`);
        const result = await generateOllamaCombinedRoast(nonClean, config.ollama, event, config.reactionImages);
        console.log(`[GitGud] Ollama response: "${result.message}"`);
        return result;
      }
      if (config.ollama?.apiKey) {
        console.log('[GitGud] Falling back to Ollama (non-preferred provider)...');
        return await generateOllamaCombinedRoast(nonClean, config.ollama, event, config.reactionImages);
      }
      if (config.gemini?.apiKey) {
        console.log('[GitGud] Falling back to Gemini (non-preferred provider)...');
        return await generateGeminiCombinedRoast(nonClean, config.gemini, event, config.reactionImages);
      }
      console.log('[GitGud] No API key configured for any provider, falling back to templates');
    } catch (err) {
      console.error('[GitGud] AI roast failed, falling back to templates:', err);
    }
  } else {
    console.log('[GitGud] No roast config provided, using templates');
  }

  const templateRoasts = nonClean.map(v => generateTemplateRoast(v, event));
  return combineTemplateRoasts(templateRoasts);
}

export async function generateRoasts(
  verdicts: AnyVerdict[],
  config?: RoastConfig,
  event?: GitEvent,
): Promise<Roast[]> {
  const nonClean = verdicts.filter(v => v.pattern !== 'clean');
  return Promise.all(nonClean.map(v => generateRoast(v, config, event)));
}
