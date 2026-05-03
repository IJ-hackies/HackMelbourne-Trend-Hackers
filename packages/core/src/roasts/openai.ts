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

export interface OpenaiConfig {
  apiKey: string;
  model?: string;
}

async function callOpenai(model: string, apiKey: string, system: string, user: string): Promise<string> {
  // o1 family uses max_completion_tokens; gpt-4/5 family uses max_tokens.
  const useNewTokenParam = /^o1/i.test(model);
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  };
  if (useNewTokenParam) {
    body.max_completion_tokens = 300;
  } else {
    body.max_tokens = 300;
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

export async function generateOpenaiCombinedRoast(verdicts: AnyVerdict[], config: OpenaiConfig, event?: GitEvent): Promise<Roast> {
  const model = config.model ?? DEFAULT_MODELS.openai;
  const content = await callOpenai(model, config.apiKey, buildRoastSystemPrompt(detectSixSeven(event), verdicts), buildMultiVerdictPrompt(verdicts, event));
  return parseRoastResponse(content);
}

export async function generateOpenaiRoast(verdict: AnyVerdict, config: OpenaiConfig, event?: GitEvent): Promise<Roast> {
  const model = config.model ?? DEFAULT_MODELS.openai;
  const content = await callOpenai(model, config.apiKey, buildRoastSystemPrompt(detectSixSeven(event), [verdict]), buildUserPrompt(verdict, event));
  return parseRoastResponse(content);
}

export async function generateOpenaiHype(verdicts: AnyVerdict[], config: OpenaiConfig, event?: GitEvent): Promise<Roast> {
  const model = config.model ?? DEFAULT_MODELS.openai;
  const content = await callOpenai(model, config.apiKey, buildHypeSystemPrompt(detectSixSeven(event)), buildHypeUserPrompt(verdicts, event));
  return parseHypeResponse(content);
}
