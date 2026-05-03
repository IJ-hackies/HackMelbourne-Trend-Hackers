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
    headers: {
      'Authorization': `Bearer ${cfg.ollamaApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
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
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(cfg.geminiApiKey)}`,
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

export async function generateCommitMessage(cfg: GitGudConfig, input: GenerateInput): Promise<string> {
  const system = buildSystem(input.style);
  const user = buildUser(input);
  const wantOllama = cfg.aiProvider === 'ollama' && cfg.ollamaApiKey;
  const wantGemini = cfg.aiProvider === 'gemini' && cfg.geminiApiKey;
  if (!wantOllama && !wantGemini) {
    throw new Error('No AI provider configured. Set an API key in settings.');
  }
  const raw = await withTimeout(
    wantGemini ? callGemini(cfg, system, user) : callOllama(cfg, system, user),
    15000,
  );
  const cleaned = sanitize(raw);
  if (!cleaned) throw new Error('AI returned an empty message.');
  return cleaned;
}
