import type { Roast, GitEvent, ReactionImageEntry } from '../types';
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

export interface OpenaiConfig {
  apiKey: string;
  model?: string;
}

async function callOpenai(model: string, apiKey: string, system: string, user: string): Promise<string> {
  const useNewTokenParam = /^o1/i.test(model);
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  };
  if (useNewTokenParam) {
    body.max_completion_tokens = 350;
  } else {
    body.max_tokens = 350;
    body.temperature = 1.0;
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`OpenAI API error ${res.status}: ${errBody.slice(0, 100)}`);
  }
  const data = (await res.json()) as any;
  const text: string = data?.choices?.[0]?.message?.content?.trim() ?? '';
  if (!text) throw new Error('Empty OpenAI response');
  return text;
}

export async function generateOpenaiCombinedRoast(verdicts: AnyVerdict[], config: OpenaiConfig, event?: GitEvent, reactionImages?: ReactionImageEntry[]): Promise<Roast> {
  const model = config.model ?? DEFAULT_MODELS.openai;
  const content = await callOpenai(model, config.apiKey, buildRoastSystemPrompt(detectSixSeven(event), verdicts, reactionImages), buildMultiVerdictPrompt(verdicts, event));
  return parseRoastResponse(content);
}

export async function generateOpenaiRoast(verdict: AnyVerdict, config: OpenaiConfig, event?: GitEvent, reactionImages?: ReactionImageEntry[]): Promise<Roast> {
  const model = config.model ?? DEFAULT_MODELS.openai;
  const content = await callOpenai(model, config.apiKey, buildRoastSystemPrompt(detectSixSeven(event), [verdict], reactionImages), buildUserPrompt(verdict, event));
  return parseRoastResponse(content);
}

export async function generateOpenaiHype(verdicts: AnyVerdict[], config: OpenaiConfig, event?: GitEvent, reactionImages?: ReactionImageEntry[]): Promise<Roast> {
  const model = config.model ?? DEFAULT_MODELS.openai;
  const content = await callOpenai(model, config.apiKey, buildHypeSystemPrompt(detectSixSeven(event), reactionImages), buildHypeUserPrompt(verdicts, event));
  return parseHypeResponse(content);
}
