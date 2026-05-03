import type { Roast, GitEvent, ReactionImageEntry } from '../types';
import type { AnyVerdict } from '../analysis/types';
import { pickMemePoolForVerdicts, formatMemePoolForPrompt, formatHypeVocabForPrompt } from '../memes';

const SIX_SEVEN_RE = /\b(67|6-7|6\.7|six[\s-]?seven)\b/i;

export function detectSixSeven(event?: GitEvent): boolean {
  if (!event) return false;
  const m = event.metadata;
  const haystack = Object.values(m).filter(v => typeof v === 'string').join('\n');
  return SIX_SEVEN_RE.test(haystack);
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildReactionImageBlock(images?: ReactionImageEntry[]): string {
  if (!images || images.length === 0) return '';
  const pool = images.length <= 8 ? images : shuffle(images).slice(0, 8);
  const list = pool.map(img => `- ${img.file}: "${img.description}" [moods: ${img.moods.join(', ')}] [severity: ${img.severity.join(', ')}]`).join('\n');
  return `\n\nREACTION IMAGES (pick the one that best matches your roast's vibe and severity):
${list}

You MUST include an IMAGE line in your response with the exact filename of your chosen image.`;
}

function imageFormatLine(images?: ReactionImageEntry[]): string {
  if (!images || images.length === 0) return '';
  return '\nIMAGE: <exact filename of the chosen reaction image, or NONE if no images available>';
}

export function buildRoastSystemPrompt(
  sixSevenTriggered: boolean,
  verdicts: AnyVerdict[],
  reactionImages?: ReactionImageEntry[],
): string {
  const picked = pickMemePoolForVerdicts(verdicts);
  const poolBlock = formatMemePoolForPrompt(picked);

  const sixSevenDirective = sixSevenTriggered
    ? `\n\n!! SIX-SEVEN ALERT !!\nThe number 67 (or "6-7", "six seven") was detected in the Git context this turn. You MUST reference the "six seven" / "6-7" meme in your roast (origin: Skrilla "Doot Doot 6 7", amplified by LaMelo Ball being 6'7", became a brainrot kid meme where everyone yells "SIX SEVEN" with hand gestures). Drop "six seven", "SIX SEVEN", or "6-7" into the roast naturally — it's mandatory this turn, not optional.\n`
    : '';

  return `You are a toxic esports gaming coach who has been mistakenly assigned to coach a software developer on their Git habits. You speak with overdramatic esports commentary energy and current internet slang.${sixSevenDirective}

VOCAB POOL FOR THIS ROAST — these registers were chosen because they fit the specific Git crime. Pick 1-2 terms total that land naturally; mix registers across the combined roast; do NOT list them; do NOT name the categories:
${poolBlock}

ANTI-CRUTCH RULES:
- DO NOT default to "skibidi", "ohio", "fanum tax", or "sigma" unless the pool above includes them this turn — those words are overused, vary your vocab.
- Be specific to THIS event, not generic "your Git is bad" energy.

ANTI-TEMPLATE RULES (CRITICAL — break the formula):
- DO NOT start with a short label phrase followed by an em dash. Banned openings include: "Bruh moment —", "We need to talk —", "Not the vibe —", "Bro, —", "Yikes —", "Oh boy —", "Listen —", anything in the shape "<2-4 words> —".
- DO NOT use em dashes ("—") at all. Use a period, comma, or just rewrite the sentence.
- VARY LENGTH every turn — sometimes ONE blunt sentence (8-12 words), sometimes a longer roast (up to 35 words), sometimes a question, sometimes a fragment. Never the same shape twice in a row.
- VARY STRUCTURE — open with a verb sometimes, a question sometimes, a meme phrase sometimes, an observation sometimes. Do not anchor every roast on a labeled opener.
- VARY OPENERS — never start with "Bro,". Rotate: caster yelling, deadpan observation, rhetorical question, accusation, mock-confused, mock-impressed.

STRICT FORMAT (ALL THREE FIELDS ARE REQUIRED — never leave any blank):
ROAST: <free-form, see length/structure rules above>
ADVICE: <one short sentence of genuine, non-meme git advice, max 20 words. NEVER leave this blank. NEVER repeat the roast. NEVER use the word "IMAGE" here.>${imageFormatLine(reactionImages)}

No markdown, no emojis, no quotes, no extra lines. Be punchy.${buildReactionImageBlock(reactionImages)}`;
}

export function buildHypeSystemPrompt(
  sixSevenTriggered: boolean,
  reactionImages?: ReactionImageEntry[],
): string {
  const vocabLine = formatHypeVocabForPrompt(10);
  const sixSevenDirective = sixSevenTriggered
    ? `\n\n!! SIX-SEVEN ALERT !!\nThe number 67 was detected in the Git context. You MUST reference the "six seven" / "6-7" meme in your hype line (origin: Skrilla "Doot Doot 6 7", LaMelo Ball, brainrot-kid chant). Drop "six seven" or "6-7" naturally — mandatory.\n`
    : '';

  return `You are a toxic esports gaming coach. The developer just did something RIGHT — a clean commit, no risky moves, healthy Git habits. Your job is to HYPE them up in the same overdramatic-coach voice you use to roast. Celebrate the W. This is rare and you should be loud about it.${sixSevenDirective}

VOCAB POOL (weave 1-2 in naturally; do NOT list them):
${vocabLine}

ANTI-TEMPLATE RULES (CRITICAL):
- DO NOT start with a short label phrase followed by an em dash. Banned openings: "Big W —", "Let's go —", "Yes —", "Finally —", anything in the shape "<2-4 words> —".
- DO NOT use em dashes ("—") at all. Use a period or comma.
- VARY LENGTH — sometimes one short shout (6-10 words), sometimes a longer hype line (up to 30 words), sometimes a question, sometimes a fragment. Never the same shape twice.
- VARY OPENERS — never start with "Bro," or "Bruh,". Rotate: caster shouting, deadpan approval, mock-shock that they did something right, gigachad acknowledgment, anime power-up reference.
- BE GENUINELY POSITIVE — celebratory, not backhanded. No "for once", no "shocked you didn't break it". Pure W energy.

STRICT FORMAT (ALL FIELDS ARE REQUIRED — never leave any blank):
HYPE: <celebration line, see length/structure rules above>
ADVICE: <one short genuine encouragement, max 20 words. NEVER leave this blank. NEVER use the word "IMAGE" here.>${imageFormatLine(reactionImages)}

No markdown, no emojis, no quotes, no extra lines.${buildReactionImageBlock(reactionImages)}`;
}

export function formatEventContext(event?: GitEvent): string {
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

export function buildUserPrompt(verdict: AnyVerdict, event?: GitEvent): string {
  let prompt = `[${verdict.category}/${verdict.pattern}] ${verdict.message}`;
  if (verdict.subject) prompt += ` Content: "${verdict.subject}"`;
  prompt += formatEventContext(event);
  prompt += '\nRoast this. Be specific to the context.';
  return prompt;
}

export function buildMultiVerdictPrompt(verdicts: AnyVerdict[], event?: GitEvent): string {
  const issues = verdicts.map(v => `- [${v.category}/${v.pattern}] ${v.message}`).join('\n');
  let prompt = `Issues:\n${issues}`;
  prompt += formatEventContext(event);
  prompt += '\nRoast ALL issues in one combined response. Be specific to the context.';
  return prompt;
}

export function buildHypeUserPrompt(verdicts: AnyVerdict[], event?: GitEvent): string {
  const wins = verdicts.map(v => `- ${v.message}`).join('\n');
  let prompt = `What went right:\n${wins}`;
  prompt += formatEventContext(event);
  prompt += '\nHype them up. Be specific to what they actually did right.';
  return prompt;
}

function stripImageTail(s: string): string {
  // Drop any "IMAGE: ..." that leaked into the field (e.g. when the model emits
  // ADVICE: IMAGE: file.jpg on a single line, or trailing IMAGE: in the advice text).
  return s.replace(/\s*IMAGE:\s*\S+\s*$/i, '').trim();
}

const FALLBACK_ROAST_ADVICE = [
  'Smaller commits, clearer messages, fewer regrets.',
  'Branch first, panic later.',
  'A real commit message takes ten extra seconds.',
  'Pull before you push. Always.',
  'Force-push only on branches no one else touches.',
  "Run the tests before you tell git you're done.",
  'Conventional Commits exists for a reason.',
];

const FALLBACK_HYPE_ADVICE = [
  'Keep this exact energy.',
  'Lock in. Run it back.',
  'Protect the streak.',
  'Ship the next one with the same vibe.',
];

function pickFallbackAdvice(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function stripEmDashTemplate(s: string): string {
  if (!s) return s;
  let out = s.replace(/^\s*([A-Za-z'!,]+(?:\s+[A-Za-z'!,]+){0,4})\s*[—–]\s*/u, '$1. ');
  out = out.replace(/\s*[—–]\s*/gu, '. ');
  out = out.replace(/\.\s*\.+/g, '.').replace(/\s{2,}/g, ' ').trim();
  out = out.replace(/^(?:Bro|Bruh|Yo|Ayo)[,!.\s]+/i, '');
  if (out.length > 0) out = out[0].toUpperCase() + out.slice(1);
  return out;
}

export function determineSeverity(roast: string): Roast['severity'] {
  const savage = /\b(cooked|absolutely|destroyed|nuclear|catastroph|criminal)\b/i;
  const medium = /\b(terrible|awful|bad|mess|chaos|disaster)\b/i;
  if (savage.test(roast)) return 'savage';
  if (medium.test(roast)) return 'medium';
  return 'mild';
}

function extractImagePick(text: string): string | undefined {
  const m = text.match(/IMAGE:\s*(.+?)$/im);
  const v = m?.[1]?.trim() ?? '';
  if (!v || v.toLowerCase() === 'none') return undefined;
  return v;
}

export function parseRoastResponse(text: string): Roast {
  const roastMatch = text.match(/ROAST:\s*(.*?)(?=\n|ADVICE:|IMAGE:|$)/is);
  const adviceMatch = text.match(/ADVICE:\s*(.*?)(?=\n|IMAGE:|$)/is);
  let roast = roastMatch?.[1]?.trim() ?? '';
  let advice = adviceMatch?.[1]?.trim() ?? '';
  if (!roast) {
    // Model omitted the ROAST: prefix — reconstruct from leading non-empty lines.
    // Stop at any ADVICE:/IMAGE: line so we don't swallow them. Don't touch
    // advice here — adviceMatch may have already captured it.
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const roastLines: string[] = [];
    for (const line of lines) {
      if (/^(ADVICE|IMAGE):/i.test(line)) break;
      roastLines.push(line);
    }
    roast = roastLines.join(' ') || text;
  }
  roast = stripEmDashTemplate(stripImageTail(roast));
  advice = stripEmDashTemplate(stripImageTail(advice));
  if (roast.length > 200) roast = roast.slice(0, 197) + '...';
  if (advice.length > 200) advice = advice.slice(0, 197) + '...';
  if (!advice) advice = pickFallbackAdvice(FALLBACK_ROAST_ADVICE);
  const reactionImage = extractImagePick(text);
  return { message: roast, severity: determineSeverity(roast), advice, reactionImage };
}

export function parseHypeResponse(text: string): Roast {
  const hypeMatch = text.match(/HYPE:\s*(.*?)(?=\n|ADVICE:|IMAGE:|$)/is);
  const adviceMatch = text.match(/ADVICE:\s*(.*?)(?=\n|IMAGE:|$)/is);
  let hype = hypeMatch?.[1]?.trim() ?? '';
  let advice = adviceMatch?.[1]?.trim() ?? '';
  if (!hype) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const hypeLines: string[] = [];
    for (const line of lines) {
      if (/^(ADVICE|IMAGE):/i.test(line)) break;
      hypeLines.push(line);
    }
    hype = hypeLines.join(' ') || text;
  }
  hype = stripEmDashTemplate(stripImageTail(hype));
  advice = stripEmDashTemplate(stripImageTail(advice));
  if (hype.length > 200) hype = hype.slice(0, 197) + '...';
  if (advice.length > 200) advice = advice.slice(0, 197) + '...';
  if (!advice) advice = pickFallbackAdvice(FALLBACK_HYPE_ADVICE);
  const reactionImage = extractImagePick(text);
  return { message: hype, severity: 'mild', advice, reactionImage };
}
