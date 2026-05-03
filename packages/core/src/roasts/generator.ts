import type { Roast, GitEvent, ReactionImageEntry } from '../types';
import type { AnyVerdict } from '../analysis/types';
import type { OllamaConfig } from './ollama';
import type { GeminiConfig } from './gemini';
import type { ClaudeConfig } from './claude';
import type { OpenaiConfig } from './openai';
import type { XaiConfig } from './xai';
import type { Provider } from './models';
import { templates } from './templates';
import { generateOllamaRoast, generateOllamaCombinedRoast, generateOllamaHype } from './ollama';
import { generateGeminiRoast, generateGeminiCombinedRoast, generateGeminiHype } from './gemini';
import { generateClaudeRoast, generateClaudeCombinedRoast, generateClaudeHype } from './claude';
import { generateOpenaiRoast, generateOpenaiCombinedRoast, generateOpenaiHype } from './openai';
import { generateXaiRoast, generateXaiCombinedRoast, generateXaiHype } from './xai';

export interface RoastConfig {
  provider: Provider;
  ollama?: OllamaConfig;
  gemini?: GeminiConfig;
  claude?: ClaudeConfig;
  openai?: OpenaiConfig;
  xai?: XaiConfig;
  reactionImages?: ReactionImageEntry[];
}

function dispatchSingle(verdict: AnyVerdict, config: RoastConfig, event?: GitEvent): Promise<Roast> | null {
  const ri = config.reactionImages;
  if (config.provider === 'gemini' && config.gemini?.apiKey) return generateGeminiRoast(verdict, config.gemini, event, ri);
  if (config.provider === 'ollama' && config.ollama?.apiKey) return generateOllamaRoast(verdict, config.ollama, event, ri);
  if (config.provider === 'claude' && config.claude?.apiKey) return generateClaudeRoast(verdict, config.claude, event, ri);
  if (config.provider === 'openai' && config.openai?.apiKey) return generateOpenaiRoast(verdict, config.openai, event, ri);
  if (config.provider === 'xai' && config.xai?.apiKey) return generateXaiRoast(verdict, config.xai, event, ri);
  return null;
}

function dispatchCombined(verdicts: AnyVerdict[], config: RoastConfig, event?: GitEvent): Promise<Roast> | null {
  const ri = config.reactionImages;
  if (config.provider === 'gemini' && config.gemini?.apiKey) return generateGeminiCombinedRoast(verdicts, config.gemini, event, ri);
  if (config.provider === 'ollama' && config.ollama?.apiKey) return generateOllamaCombinedRoast(verdicts, config.ollama, event, ri);
  if (config.provider === 'claude' && config.claude?.apiKey) return generateClaudeCombinedRoast(verdicts, config.claude, event, ri);
  if (config.provider === 'openai' && config.openai?.apiKey) return generateOpenaiCombinedRoast(verdicts, config.openai, event, ri);
  if (config.provider === 'xai' && config.xai?.apiKey) return generateXaiCombinedRoast(verdicts, config.xai, event, ri);
  return null;
}

function dispatchHype(verdicts: AnyVerdict[], config: RoastConfig, event?: GitEvent): Promise<Roast> | null {
  const ri = config.reactionImages;
  if (config.provider === 'gemini' && config.gemini?.apiKey) return generateGeminiHype(verdicts, config.gemini, event, ri);
  if (config.provider === 'ollama' && config.ollama?.apiKey) return generateOllamaHype(verdicts, config.ollama, event, ri);
  if (config.provider === 'claude' && config.claude?.apiKey) return generateClaudeHype(verdicts, config.claude, event, ri);
  if (config.provider === 'openai' && config.openai?.apiKey) return generateOpenaiHype(verdicts, config.openai, event, ri);
  if (config.provider === 'xai' && config.xai?.apiKey) return generateXaiHype(verdicts, config.xai, event, ri);
  return null;
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
      const dispatched = dispatchSingle(verdict, config, event);
      if (dispatched) return await dispatched;
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
    console.log('[GitGud] All verdicts clean — generating hype');
    return generateHype(verdicts, config, event);
  }

  console.log(`[GitGud] ${nonClean.length} verdict(s): ${nonClean.map(v => `${v.category}/${v.pattern}`).join(', ')}`);

  if (nonClean.length === 1) {
    return generateRoast(nonClean[0], config, event);
  }

  if (config) {
    console.log(`[GitGud] AI config: provider=${config.provider}`);
    try {
      const dispatched = dispatchCombined(nonClean, config, event);
      if (dispatched) {
        const result = await dispatched;
        console.log(`[GitGud] ${config.provider} combined response: "${result.message}"`);
        return result;
      }
      console.log('[GitGud] No API key configured for selected provider, falling back to templates');
    } catch (err) {
      console.error('[GitGud] AI roast failed, falling back to templates:', err);
    }
  } else {
    console.log('[GitGud] No roast config provided, using templates');
  }

  const templateRoasts = nonClean.map(v => generateTemplateRoast(v, event));
  return combineTemplateRoasts(templateRoasts);
}

const HYPE_TEMPLATES: Roast[] = [
  { severity: 'mild', message: 'Clean run, no notes. Goated behavior.', advice: 'Keep this exact energy.' },
  { severity: 'mild', message: 'WHAT A PLAY. Healthy commit, no force-push, the crowd is shocked.', advice: 'Run it back.' },
  { severity: 'mild', message: 'You ate that. No crumbs left on the diff.', advice: 'Lock in.' },
  { severity: 'mild', message: 'Gigachad commit detected. Plot armor confirmed.', advice: 'Stay in your final form.' },
  { severity: 'mild', message: 'W rizz on this one, no cap. Ultra instinct unlocked.', advice: 'Keep cooking.' },
  { severity: 'mild', message: 'Shipped clean to prod. Sigma grindset confirmed.', advice: 'Protect the streak.' },
  { severity: 'mild', message: 'Banger commit. This slaps.', advice: 'Encore.' },
  { severity: 'mild', message: 'Understood the assignment. We are so back.', advice: 'Stay locked in.' },
  { severity: 'mild', message: 'Clean Git? In this economy? Aura points awarded.', advice: 'Hold the line.' },
  { severity: 'mild', message: 'INSANE outplay. The momentum just shifted.', advice: 'Keep the pressure on.' },
  { severity: 'mild', message: 'Six-seven hands going up for this one.', advice: 'More of this please.' },
  { severity: 'mild', message: 'Main character of the timeline behavior.', advice: 'Run it.' },
];

function pickHypeTemplate(): Roast {
  return HYPE_TEMPLATES[Math.floor(Math.random() * HYPE_TEMPLATES.length)];
}

export async function generateHype(
  verdicts: AnyVerdict[],
  config?: RoastConfig,
  event?: GitEvent,
): Promise<Roast> {
  if (config) {
    try {
      const dispatched = dispatchHype(verdicts, config, event);
      if (dispatched) return await dispatched;
    } catch (err) {
      console.error('[GitGud] AI hype failed, falling back to templates:', err);
    }
  }
  return pickHypeTemplate();
}

export async function generateRoasts(
  verdicts: AnyVerdict[],
  config?: RoastConfig,
  event?: GitEvent,
): Promise<Roast[]> {
  const nonClean = verdicts.filter(v => v.pattern !== 'clean');
  return Promise.all(nonClean.map(v => generateRoast(v, config, event)));
}
