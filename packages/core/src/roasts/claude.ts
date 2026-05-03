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

export interface ClaudeConfig {
  apiKey: string;
  model?: string;
}

async function callClaude(model: string, apiKey: string, system: string, user: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 300,
      system,
      messages: [{ role: 'user', content: user }],
      temperature: 1.0,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Claude API error ${res.status}: ${body.slice(0, 100)}`);
  }
  const data = (await res.json()) as any;
  const block = Array.isArray(data?.content) ? data.content.find((b: any) => b.type === 'text') : null;
  const text: string = block?.text?.trim() ?? '';
  if (!text) throw new Error('Empty Claude response');
  return text;
}

export async function generateClaudeCombinedRoast(verdicts: AnyVerdict[], config: ClaudeConfig, event?: GitEvent): Promise<Roast> {
  const model = config.model ?? DEFAULT_MODELS.claude;
  const content = await callClaude(model, config.apiKey, buildRoastSystemPrompt(detectSixSeven(event), verdicts), buildMultiVerdictPrompt(verdicts, event));
  return parseRoastResponse(content);
}

export async function generateClaudeRoast(verdict: AnyVerdict, config: ClaudeConfig, event?: GitEvent): Promise<Roast> {
  const model = config.model ?? DEFAULT_MODELS.claude;
  const content = await callClaude(model, config.apiKey, buildRoastSystemPrompt(detectSixSeven(event), [verdict]), buildUserPrompt(verdict, event));
  return parseRoastResponse(content);
}

export async function generateClaudeHype(verdicts: AnyVerdict[], config: ClaudeConfig, event?: GitEvent): Promise<Roast> {
  const model = config.model ?? DEFAULT_MODELS.claude;
  const content = await callClaude(model, config.apiKey, buildHypeSystemPrompt(detectSixSeven(event)), buildHypeUserPrompt(verdicts, event));
  return parseHypeResponse(content);
}
