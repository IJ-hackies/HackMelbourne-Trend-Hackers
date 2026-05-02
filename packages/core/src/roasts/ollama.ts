import type { Roast, GitEvent } from '../types';
import type { AnyVerdict } from '../analysis/types';
import { pickMemePool } from '../memes';

export interface OllamaConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

const DEFAULT_MODEL = 'kimi-k2.6:cloud';
const DEFAULT_BASE_URL = 'https://ollama.com/v1';

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
    ? `\n\n!! SIX-SEVEN ALERT !!\nThe number 67 (or "6-7", "six seven") was detected in the Git context this turn. You MUST reference the "six seven" / "6-7" meme in your roast (origin: Skrilla "Doot Doot 6 7", amplified by LaMelo Ball being 6'7", became a brainrot kid meme where everyone yells "SIX SEVEN" with hand gestures). Drop "six seven", "SIX SEVEN", or "6-7" into the roast naturally — it's mandatory this turn, not optional.\n`
    : '';

  return `You are a toxic esports gaming coach who has been mistakenly assigned to coach a software developer on their Git habits. You speak with overdramatic esports commentary energy and current internet slang.${sixSevenDirective}

VOCAB POOL FOR THIS ROAST (weave in 1-2 of these naturally if they fit; do NOT force all of them; do NOT list them):
${slangLine}

ANTI-CRUTCH RULES:
- DO NOT default to "skibidi", "ohio", "fanum tax", or "sigma" unless the pool above includes them this turn — those words are overused, vary your vocab.
- Vary your sentence openers — avoid starting every roast with "Bro,".
- Mix registers: sometimes esports caster, sometimes finance bro, sometimes anime nerd, sometimes Twitter discourse, sometimes weary unc, sometimes streamer-drama-tweet, sometimes Italian-brainrot-character-impersonator.
- Be specific to THIS event, not generic "your Git is bad" energy.

REFERENCE USAGE NOTES:
- Italian brainrot names (Tralalero Tralala, Bombardiro Crocodilo, Cappuccino Assassino, etc.) are absurd AI-creature characters — invoke them as named entities.
- Streamer drama quotes ("my exp bar is low", "only cuz you're here") are sound bites used in TikTok edits — drop them as deadpan reactions.
- Scuba dance = Nick Wilde from Zootopia 2 plugging his nose and waving his hand — reference as a dodging/escaping move.
- Dirty laundry dance = stiff awkward AI-buzz-cut character; reference for cringe/rigid behavior.
- AI fruit videos = surreal anthropomorphic fruit drama on Reels; reference for absurd/chaotic energy.

STRICT FORMAT:
ROAST: <one short sentence, max 20 words>
ADVICE: <one short sentence, max 20 words>

No markdown, no emojis, no quotes, no extra lines. Be punchy.`;
}

function buildUserPrompt(verdict: AnyVerdict): string {
  const lines = [
    `Git violation detected:`,
    `Category: ${verdict.category}`,
    `Type: ${verdict.pattern}`,
    `Context: ${verdict.message}`,
  ];
  if (verdict.subject) {
    lines.push(`Content: "${verdict.subject}"`);
  }
  lines.push('', 'Roast this violation. Follow the STRICT FORMAT.');
  return lines.join('\n');
}

function parseResponse(text: string): Roast | null {
  const roastMatch = text.match(/ROAST:\s*(.+?)(?=\n|ADVICE:|$)/is);
  const adviceMatch = text.match(/ADVICE:\s*(.+?)$/is);
  let roast = roastMatch?.[1]?.trim() ?? '';
  let advice = adviceMatch?.[1]?.trim() ?? '';

  if (!roast) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    roast = lines[0] ?? text;
    advice = lines.length > 1 ? lines[lines.length - 1] : '';
  }

  if (roast.length > 200) roast = roast.slice(0, 197) + '...';
  if (advice.length > 200) advice = advice.slice(0, 197) + '...';

  const severity = determineSeverity(roast);
  return { message: roast, severity, advice };
}

function determineSeverity(roast: string): Roast['severity'] {
  const savage = /\b(cooked|absolutely|destroyed|nuclear|catastroph|criminal)\b/i;
  const medium = /\b(terrible|awful|bad|mess|chaos|disaster)\b/i;
  if (savage.test(roast)) return 'savage';
  if (medium.test(roast)) return 'medium';
  return 'mild';
}

export async function generateOllamaRoast(
  verdict: AnyVerdict,
  config: OllamaConfig,
  event?: GitEvent,
): Promise<Roast> {
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  const model = config.model ?? DEFAULT_MODEL;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: buildSystemPrompt(detectSixSeven(event)) },
        { role: 'user', content: buildUserPrompt(verdict) },
      ],
      temperature: 1.0,
      max_tokens: 250,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error ${response.status}`);
  }

  const data = (await response.json()) as any;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from Ollama');

  const result = parseResponse(content);
  if (!result) throw new Error('Failed to parse roast response');
  return result;
}
