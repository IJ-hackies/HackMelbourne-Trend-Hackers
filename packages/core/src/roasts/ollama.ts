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

export interface OllamaConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

const DEFAULT_BASE_URL = 'https://ollama.com/api';

async function callOllama(
  baseUrl: string,
  model: string,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const url = `${baseUrl}/chat`;
  const t0 = Date.now();
  console.log(`[GitGud] Ollama POST ${url} (model=${model})`);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
      options: { temperature: 1.0 },
    }),
  });
  const tResponse = Date.now();
  console.log(`[GitGud] Ollama HTTP ${response.status} (network: ${tResponse - t0}ms)`);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error(`[GitGud] Ollama error body: ${body.slice(0, 300)}`);
    throw new Error(`Ollama API error ${response.status}: ${body.slice(0, 100)}`);
  }
  const data = (await response.json()) as any;
  const content = data.message?.content ?? data.choices?.[0]?.message?.content;
  if (!content) {
    console.error(`[GitGud] Ollama empty content. Full response: ${JSON.stringify(data).slice(0, 500)}`);
    throw new Error('Empty response from Ollama');
  }
  return content;
}

function resolved(config: OllamaConfig) {
  return {
    baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
    model: config.model ?? DEFAULT_MODELS.ollama,
  };
}

export async function generateOllamaCombinedRoast(verdicts: AnyVerdict[], config: OllamaConfig, event?: GitEvent): Promise<Roast> {
  const { baseUrl, model } = resolved(config);
  const content = await callOllama(baseUrl, model, config.apiKey, buildRoastSystemPrompt(detectSixSeven(event), verdicts), buildMultiVerdictPrompt(verdicts, event));
  return parseRoastResponse(content);
}

export async function generateOllamaRoast(verdict: AnyVerdict, config: OllamaConfig, event?: GitEvent): Promise<Roast> {
  const { baseUrl, model } = resolved(config);
  const content = await callOllama(baseUrl, model, config.apiKey, buildRoastSystemPrompt(detectSixSeven(event), [verdict]), buildUserPrompt(verdict, event));
  return parseRoastResponse(content);
}

export async function generateOllamaHype(verdicts: AnyVerdict[], config: OllamaConfig, event?: GitEvent): Promise<Roast> {
  const { baseUrl, model } = resolved(config);
  const content = await callOllama(baseUrl, model, config.apiKey, buildHypeSystemPrompt(detectSixSeven(event)), buildHypeUserPrompt(verdicts, event));
  return parseHypeResponse(content);
}
