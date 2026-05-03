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

export interface GeminiConfig {
  apiKey: string;
  model?: string;
}

async function callGemini(model: string, apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 1.0, maxOutputTokens: 250, thinkingConfig: { thinkingBudget: 0 } },
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Gemini API error ${res.status}: ${body.slice(0, 100)}`);
  }
  const data = (await res.json()) as any;
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  if (!text) throw new Error('Empty Gemini response');
  return text;
}

export async function generateGeminiCombinedRoast(verdicts: AnyVerdict[], config: GeminiConfig, event?: GitEvent): Promise<Roast> {
  const model = config.model ?? DEFAULT_MODELS.gemini;
  const content = await callGemini(model, config.apiKey, buildRoastSystemPrompt(detectSixSeven(event), verdicts), buildMultiVerdictPrompt(verdicts, event));
  return parseRoastResponse(content);
}

export async function generateGeminiRoast(verdict: AnyVerdict, config: GeminiConfig, event?: GitEvent): Promise<Roast> {
  const model = config.model ?? DEFAULT_MODELS.gemini;
  const content = await callGemini(model, config.apiKey, buildRoastSystemPrompt(detectSixSeven(event), [verdict]), buildUserPrompt(verdict, event));
  return parseRoastResponse(content);
}

export async function generateGeminiHype(verdicts: AnyVerdict[], config: GeminiConfig, event?: GitEvent): Promise<Roast> {
  const model = config.model ?? DEFAULT_MODELS.gemini;
  const content = await callGemini(model, config.apiKey, buildHypeSystemPrompt(detectSixSeven(event)), buildHypeUserPrompt(verdicts, event));
  return parseHypeResponse(content);
}
