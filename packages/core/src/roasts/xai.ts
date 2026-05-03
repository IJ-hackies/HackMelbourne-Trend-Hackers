import type { Roast, GitEvent } from '../types';
import type { AnyVerdict } from '../analysis/types';
import { DEFAULT_MODELS } from './models';
import {
  detectSixSeven,
  buildRoastSystemPrompt,
  buildHypeSystemPrompt,
  buildUserPrompt,
  buildMultiVerdictPrompt,
  buildHypeUserPrompt,
  parseRoastResponse,
  parseHypeResponse,
} from './prompt-shared';

export interface XaiConfig {
  apiKey: string;
  model?: string;
}

async function callXai(model: string, apiKey: string, system: string, user: string): Promise<string> {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 1.0,
      max_tokens: 300,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`xAI API error ${res.status}: ${errBody.slice(0, 100)}`);
  }
  const data = (await res.json()) as any;
  const text: string = data?.choices?.[0]?.message?.content?.trim() ?? '';
  if (!text) throw new Error('Empty xAI response');
  return text;
}

export async function generateXaiCombinedRoast(verdicts: AnyVerdict[], config: XaiConfig, event?: GitEvent): Promise<Roast> {
  const model = config.model ?? DEFAULT_MODELS.xai;
  const content = await callXai(model, config.apiKey, buildRoastSystemPrompt(detectSixSeven(event), verdicts), buildMultiVerdictPrompt(verdicts, event));
  return parseRoastResponse(content);
}

export async function generateXaiRoast(verdict: AnyVerdict, config: XaiConfig, event?: GitEvent): Promise<Roast> {
  const model = config.model ?? DEFAULT_MODELS.xai;
  const content = await callXai(model, config.apiKey, buildRoastSystemPrompt(detectSixSeven(event), [verdict]), buildUserPrompt(verdict, event));
  return parseRoastResponse(content);
}

export async function generateXaiHype(verdicts: AnyVerdict[], config: XaiConfig, event?: GitEvent): Promise<Roast> {
  const model = config.model ?? DEFAULT_MODELS.xai;
  const content = await callXai(model, config.apiKey, buildHypeSystemPrompt(detectSixSeven(event)), buildHypeUserPrompt(verdicts, event));
  return parseHypeResponse(content);
}
