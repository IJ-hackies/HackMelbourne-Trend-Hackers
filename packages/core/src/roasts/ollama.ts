import type { Roast } from '../types';
import type { AnyVerdict } from '../analysis/types';
import { buildBrainrotPromptSection } from './brainrot';

export interface RoastConfig {
  ollamaApiKey: string;
  ollamaModel?: string;
  ollamaBaseUrl?: string;
}

const DEFAULT_MODEL = 'kimi-k2.6:cloud';
const DEFAULT_BASE_URL = 'https://ollama.com/v1';

const SYSTEM_PROMPT = `You are the roast engine for "Git Gud" — a competitive esports-themed Git coaching tool that treats everyday Git usage like a ranked competitive game.

YOUR PERSONA:
- Toxic competitive gaming coach who's seen too many ranked matches
- Esports commentator having a dramatic breakdown over mundane Git mistakes
- Anime battle narrator describing a developer's git crimes
- The energy of a disappointed League of Legends teammate in voice chat

TONE:
- Overdramatic — treat a bad commit message like a blown championship match
- Mix competitive gaming language with current internet/brainrot slang
- Be genuinely funny, not just mean — the humor comes from the absurd contrast
- Every roast MUST include real, actionable Git advice

${buildBrainrotPromptSection()}

RULES:
1. Roast message: 1-2 sentences max. Punchy, quotable, shareable.
2. Advice: 1 sentence of genuine, practical Git advice. This is the educational part — take it seriously.
3. Severity: "mild" (light teasing), "medium" (proper roast), "savage" (absolutely destroyed)
4. Match severity to how bad the violation actually is (force push to main = savage, no branch prefix = mild)
5. Reference the SPECIFIC details of the violation (the actual commit message, branch name, etc.)
6. Use brainrot slang naturally — don't stuff every term in, pick 1-2 that fit
7. Never repeat the same joke structure twice in a row

Respond with ONLY a valid JSON object, no markdown fences, no explanation:
{"message": "the roast", "severity": "mild|medium|savage", "advice": "genuine advice"}`;

function buildUserPrompt(verdict: AnyVerdict): string {
  const lines = [
    `A developer just committed a Git violation:`,
    ``,
    `Category: ${verdict.category}`,
    `Violation type: ${verdict.pattern}`,
    `What happened: ${verdict.message}`,
  ];

  if (verdict.subject) {
    lines.push(`Specific content: "${verdict.subject}"`);
  }

  lines.push('', 'Generate a roast for this violation.');
  return lines.join('\n');
}

function parseRoastResponse(text: string): Roast {
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  const parsed = JSON.parse(cleaned);

  if (!parsed.message || !parsed.severity || !parsed.advice) {
    throw new Error('Missing required fields in AI response');
  }

  const severity = parsed.severity as string;
  if (severity !== 'mild' && severity !== 'medium' && severity !== 'savage') {
    throw new Error(`Invalid severity: ${severity}`);
  }

  return {
    message: String(parsed.message),
    severity: severity,
    advice: String(parsed.advice),
  };
}

export async function generateAIRoast(
  verdict: AnyVerdict,
  config: RoastConfig,
): Promise<Roast> {
  const baseUrl = config.ollamaBaseUrl ?? DEFAULT_BASE_URL;
  const model = config.ollamaModel ?? DEFAULT_MODEL;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.ollamaApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(verdict) },
      ],
      temperature: 0.9,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Ollama API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from Ollama API');
  }

  return parseRoastResponse(content);
}
