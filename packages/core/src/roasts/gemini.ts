import type { Roast, GitEvent } from '../types';
import type { AnyVerdict } from '../analysis/types';
import { pickMemePool } from '../memes';

export interface GeminiConfig {
  apiKey: string;
}

const SIX_SEVEN_RE = /\b(67|6-7|6\.7|six[\s-]?seven)\b/i;

function detectSixSeven(event?: GitEvent): boolean {
  if (!event) return false;
  const m = event.metadata;
  const haystack = Object.values(m).filter(v => typeof v === 'string').join('\n');
  return SIX_SEVEN_RE.test(haystack);
}

function buildSystemPrompt(sixSevenTriggered: boolean): string {
  const pool = pickMemePool({ perCategory: 2, totalCap: 14 });
  const slangLine = pool.map(s => `"${s}"`).join(', ');

  const sixSevenDirective = sixSevenTriggered
    ? `\n\n!! SIX-SEVEN ALERT !!\nThe number 67 (or "6-7", "six seven") was detected. You MUST reference the "six seven" / "6-7" meme in your roast naturally.\n`
    : '';

  return `You are a toxic esports gaming coach who has been mistakenly assigned to coach a software developer on their Git habits.${sixSevenDirective}

VOCAB POOL (weave in 1-2 naturally):
${slangLine}

ANTI-CRUTCH RULES:
- DO NOT default to "skibidi", "ohio", "fanum tax", or "sigma" unless in the pool above.
- Vary sentence openers. Mix registers.
- Be specific to THIS event.

STRICT FORMAT:
ROAST: <one short sentence, max 20 words>
ADVICE: <one short sentence, max 20 words>

No markdown, no emojis, no quotes, no extra lines.`;
}

function buildUserPrompt(verdict: AnyVerdict): string {
  const lines = [
    `Git violation: ${verdict.category} / ${verdict.pattern}`,
    `Context: ${verdict.message}`,
  ];
  if (verdict.subject) lines.push(`Content: "${verdict.subject}"`);
  lines.push('Roast this. STRICT FORMAT.');
  return lines.join('\n');
}

export async function generateGeminiRoast(
  verdict: AnyVerdict,
  config: GeminiConfig,
  event?: GitEvent,
): Promise<Roast> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(config.apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: buildSystemPrompt(detectSixSeven(event)) }] },
        contents: [{ role: 'user', parts: [{ text: buildUserPrompt(verdict) }] }],
        generationConfig: { temperature: 1.0, maxOutputTokens: 250, thinkingConfig: { thinkingBudget: 0 } },
      }),
    },
  );
  const data = (await res.json()) as any;
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  if (!text) throw new Error('Empty Gemini response');

  const roastMatch = text.match(/ROAST:\s*(.+?)(?=\n|ADVICE:|$)/is);
  const adviceMatch = text.match(/ADVICE:\s*(.+?)$/is);
  let roast = roastMatch?.[1]?.trim() ?? text.split('\n')[0] ?? text;
  let advice = adviceMatch?.[1]?.trim() ?? '';
  if (roast.length > 200) roast = roast.slice(0, 197) + '...';
  if (advice.length > 200) advice = advice.slice(0, 197) + '...';

  return { message: roast, severity: 'medium', advice };
}
