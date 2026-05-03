import type { GitGudConfig } from '../config';

const MAX_DIFF_CHARS = 1500;

export interface GenerateInput {
  diff: string;
  porcelain: string;
  style: 'clean' | 'savage';
}

function buildSystem(style: 'clean' | 'savage'): string {
  if (style === 'savage') {
    return `You are a toxic esports coach writing a one-line git commit message that roasts the developer for what they just did. Output ONLY the message: one line, no more than 72 characters, no quotes, no trailing period, no markdown. Be mean but specific to the diff. No slurs, no profanity stronger than "damn".`;
  }
  return `You write Conventional Commits messages. Output ONLY the message: one line, no more than 72 characters, imperative mood, lowercase after the type prefix, no quotes, no trailing period, no markdown. Choose the type from: feat, fix, refactor, docs, test, chore, style, perf.`;
}

function buildUser(input: GenerateInput): string {
  const diff = input.diff.length > MAX_DIFF_CHARS
    ? input.diff.slice(0, MAX_DIFF_CHARS) + `\n…[truncated ${input.diff.length - MAX_DIFF_CHARS} chars]`
    : input.diff;
  return `Files changed:\n${input.porcelain || '(none)'}\n\nDiff:\n${diff || '(empty)'}`;
}

function sanitize(raw: string): string {
  let line = raw.split('\n').map(s => s.trim()).filter(Boolean)[0] ?? '';
  line = line.replace(/^["'`]+|["'`]+$/g, '').replace(/\.$/, '').trim();
  if (line.length > 72) line = line.slice(0, 72).trimEnd();
  return line;
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('Generation timed out.')), ms)),
  ]);
}

async function callOllama(cfg: GitGudConfig, system: string, user: string): Promise<string> {
  const baseUrl = cfg.ollamaBaseUrl || 'https://ollama.com/v1';
  const model = cfg.ollamaModel || 'deepseek-v4-flash:cloud';
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${cfg.ollamaApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: 0.4,
      max_tokens: 80,
    }),
  });
  if (!res.ok) throw new Error(`Ollama error ${res.status}`);
  const data: any = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from Ollama.');
  return content;
}

async function callGemini(cfg: GitGudConfig, system: string, user: string): Promise<string> {
  const model = cfg.geminiModel || 'gemini-2.5-flash';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(cfg.geminiApiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 80, thinkingConfig: { thinkingBudget: 0 } },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data: any = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error('Empty response from Gemini.');
  return text;
}

async function callClaude(cfg: GitGudConfig, system: string, user: string): Promise<string> {
  const model = cfg.claudeModel || 'claude-sonnet-4-6';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': cfg.claudeApiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 80,
      system,
      messages: [{ role: 'user', content: user }],
      temperature: 0.4,
    }),
  });
  if (!res.ok) throw new Error(`Claude error ${res.status}`);
  const data: any = await res.json();
  const block = Array.isArray(data?.content) ? data.content.find((b: any) => b.type === 'text') : null;
  const text = block?.text?.trim();
  if (!text) throw new Error('Empty response from Claude.');
  return text;
}

async function callOpenai(cfg: GitGudConfig, system: string, user: string): Promise<string> {
  const model = cfg.openaiModel || 'gpt-4o-mini';
  const useNewTokenParam = /^o1/i.test(model);
  const body: Record<string, unknown> = {
    model,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
  };
  if (useNewTokenParam) {
    body.max_completion_tokens = 80;
  } else {
    body.max_tokens = 80;
    body.temperature = 0.4;
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${cfg.openaiApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
  const data: any = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI.');
  return content;
}

async function callXai(cfg: GitGudConfig, system: string, user: string): Promise<string> {
  const model = cfg.xaiModel || 'grok-3-mini';
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${cfg.xaiApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: 0.4,
      max_tokens: 80,
    }),
  });
  if (!res.ok) throw new Error(`xAI error ${res.status}`);
  const data: any = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from xAI.');
  return content;
}

export async function generateCommitMessage(cfg: GitGudConfig, input: GenerateInput): Promise<string> {
  const system = buildSystem(input.style);
  const user = buildUser(input);
  const p = cfg.aiProvider;
  let call: Promise<string>;
  if (p === 'gemini' && cfg.geminiApiKey) call = callGemini(cfg, system, user);
  else if (p === 'claude' && cfg.claudeApiKey) call = callClaude(cfg, system, user);
  else if (p === 'openai' && cfg.openaiApiKey) call = callOpenai(cfg, system, user);
  else if (p === 'xai' && cfg.xaiApiKey) call = callXai(cfg, system, user);
  else if (p === 'ollama' && cfg.ollamaApiKey) call = callOllama(cfg, system, user);
  else throw new Error('No AI provider configured. Set an API key in settings.');

  const raw = await withTimeout(call, 15000);
  const cleaned = sanitize(raw);
  if (!cleaned) throw new Error('AI returned an empty message.');
  return cleaned;
}
