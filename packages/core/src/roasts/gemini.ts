import type { Roast, GitEvent, ReactionImageEntry } from '../types';
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

function sampleReactionImages(images: ReactionImageEntry[], count: number): ReactionImageEntry[] {
  if (images.length <= count) return images;
  const shuffled = [...images];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

function buildReactionImageBlock(images?: ReactionImageEntry[]): string {
  if (!images || images.length === 0) return '';
  const pool = sampleReactionImages(images, 8);
  const list = pool.map(img => `- ${img.file}: "${img.description}" [moods: ${img.moods.join(', ')}] [severity: ${img.severity.join(', ')}]`).join('\n');
  return `\n\nREACTION IMAGES (pick the one that best matches your roast's vibe and severity):
${list}

You MUST include an IMAGE line in your response with the exact filename of your chosen image.`;
}

function buildSystemPrompt(sixSevenTriggered: boolean, reactionImages?: ReactionImageEntry[]): string {
  const pool = pickMemePool({ perCategory: 2, totalCap: 14 });
  const slangLine = pool.map(s => `"${s}"`).join(', ');

  const sixSevenDirective = sixSevenTriggered
    ? `\n\n!! SIX-SEVEN ALERT !!\nThe number 67 (or "6-7", "six seven") was detected. You MUST reference the "six seven" / "6-7" meme in your roast naturally.\n`
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
ROAST: <one or two punchy sentences, max 30 words total>
ADVICE: <one short sentence, max 20 words>
IMAGE: <exact filename of the chosen reaction image, or NONE if no images available>

No markdown, no emojis, no quotes, no extra lines. Be punchy.${buildReactionImageBlock(reactionImages)}`;
}

function formatEventContext(event?: GitEvent): string {
  if (!event) return '';
  const m = event.metadata;
  const parts: string[] = [];
  if (m.commitMessage || m.message) parts.push(`Msg: "${m.commitMessage ?? m.message}"`);
  if (m.branchName || m.branch) parts.push(`Branch: ${m.branchName ?? m.branch}`);
  if (m.filesChanged || m.insertions || m.deletions) parts.push(`${m.filesChanged ?? '?'} files, +${m.insertions ?? 0}/-${m.deletions ?? 0}`);
  const files = m.changedFiles ?? m.files;
  if (Array.isArray(files) && files.length > 0) parts.push(`Files: ${files.slice(0, 3).join(', ')}`);
  if (parts.length === 0) return '';
  return `\nContext: ${parts.join(' | ')}`;
}

function buildUserPrompt(verdict: AnyVerdict, event?: GitEvent): string {
  let prompt = `[${verdict.category}/${verdict.pattern}] ${verdict.message}`;
  if (verdict.subject) prompt += ` Content: "${verdict.subject}"`;
  prompt += formatEventContext(event);
  prompt += '\nRoast this. Be specific to the context.';
  return prompt;
}

function buildMultiVerdictPrompt(verdicts: AnyVerdict[], event?: GitEvent): string {
  const issues = verdicts.map(v => `- [${v.category}/${v.pattern}] ${v.message}`).join('\n');
  let prompt = `Issues:\n${issues}`;
  prompt += formatEventContext(event);
  prompt += '\nRoast ALL issues in one combined response. Be specific to the context.';
  return prompt;
}

function parseGeminiResponse(text: string): Roast {
  const roastMatch = text.match(/ROAST:\s*(.+?)(?=\n|ADVICE:|IMAGE:|$)/is);
  const adviceMatch = text.match(/ADVICE:\s*(.+?)(?=\n|IMAGE:|$)/is);
  const imageMatch = text.match(/IMAGE:\s*(.+?)$/im);
  let roast = roastMatch?.[1]?.trim() ?? text.split('\n')[0] ?? text;
  let advice = adviceMatch?.[1]?.trim() ?? '';
  const imagePick = imageMatch?.[1]?.trim() ?? '';
  if (roast.length > 200) roast = roast.slice(0, 197) + '...';
  if (advice.length > 200) advice = advice.slice(0, 197) + '...';
  const reactionImage = imagePick && imagePick.toLowerCase() !== 'none' ? imagePick : undefined;

  return { message: roast, severity: 'medium', advice, reactionImage };
}

export async function generateGeminiCombinedRoast(
  verdicts: AnyVerdict[],
  config: GeminiConfig,
  event?: GitEvent,
  reactionImages?: ReactionImageEntry[],
): Promise<Roast> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(config.apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: buildSystemPrompt(detectSixSeven(event), reactionImages) }] },
        contents: [{ role: 'user', parts: [{ text: buildMultiVerdictPrompt(verdicts, event) }] }],
        generationConfig: { temperature: 1.0, maxOutputTokens: 350, thinkingConfig: { thinkingBudget: 0 } },
      }),
    },
  );
  const data = (await res.json()) as any;
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  if (!text) throw new Error('Empty Gemini response');

  return parseGeminiResponse(text);
}

export async function generateGeminiRoast(
  verdict: AnyVerdict,
  config: GeminiConfig,
  event?: GitEvent,
  reactionImages?: ReactionImageEntry[],
): Promise<Roast> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(config.apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: buildSystemPrompt(detectSixSeven(event), reactionImages) }] },
        contents: [{ role: 'user', parts: [{ text: buildUserPrompt(verdict, event) }] }],
        generationConfig: { temperature: 1.0, maxOutputTokens: 350, thinkingConfig: { thinkingBudget: 0 } },
      }),
    },
  );
  const data = (await res.json()) as any;
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  if (!text) throw new Error('Empty Gemini response');

  return parseGeminiResponse(text);
}
