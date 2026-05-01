import * as vscode from 'vscode';
import { GitEvent, GitEventType, RoastResult, pickMemePool } from '@git-gud/core';

const SIX_SEVEN_RE = /\b(67|6-7|6\.7|six[\s-]?seven)\b/i;

function detectSixSeven(event: GitEvent): boolean {
  const m = event.metadata;
  const haystack = [
    m.commitMessage,
    m.branchName,
    m.previousBranch,
    m.filePath,
    m.diffSummary,
    m.resolvedSnippet,
    m.oursSnippet,
    m.theirsSnippet,
    ...(m.changedFiles ?? []),
  ].filter(Boolean).join('\n');
  return SIX_SEVEN_RE.test(haystack);
}

function buildSystemPrompt(sixSevenTriggered: boolean): string {
  const pool = pickMemePool({ perCategory: 2, totalCap: 14 });
  const slangLine = pool.map((s) => `"${s}"`).join(', ');

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
- Italian brainrot names (Tralalero Tralala, Bombardiro Crocodilo, Cappuccino Assassino, etc.) are absurd AI-creature characters — invoke them as named entities ("this is straight Bombardiro Crocodilo behavior", "Cappuccino Assassino would not do you like this").
- Streamer drama quotes ("my exp bar is low", "only cuz you're here") are sound bites used in TikTok edits — drop them as deadpan reactions.
- Scuba dance = Nick Wilde from Zootopia 2 plugging his nose and waving his hand — reference as a dodging/escaping move ("scuba-ing your way out of this commit").
- Dirty laundry dance = stiff awkward AI-buzz-cut character; reference for cringe/rigid behavior.
- AI fruit videos = surreal anthropomorphic fruit drama on Reels; reference for absurd/chaotic energy.
- Finger gloving = LED-glove rave subculture; reference for unnecessary flex or visual chaos.

DIFF/CODE CONTEXT RULES:
- DO reference the file name (e.g. "auth.ts").
- DO comment on the GENERAL nature/intent of the change.
- DO NOT list line numbers, quote literal code, or recite values like a screen reader.

ALWAYS end with one separate sentence of GENUINE, ACTIONABLE Git advice.

STRICT FORMAT:
ROAST: <one short sentence, max 20 words>
ADVICE: <one short sentence, max 20 words>

No markdown, no emojis, no quotes, no extra lines. Be punchy.`;
}

function fileList(files?: string[]): string {
  if (!files?.length) return 'unknown';
  return files.slice(0, 6).join(', ');
}

function statLine(e: GitEvent): string {
  const m = e.metadata;
  if (m.filesChanged === undefined && m.insertions === undefined) return '';
  return ` Stats: ${m.filesChanged ?? '?'} files, +${m.insertions ?? 0}/-${m.deletions ?? 0}.`;
}

const EVENT_PROMPTS: Record<GitEventType, (e: GitEvent) => string> = {
  commit: (e) => {
    const msg = e.metadata.commitMessage ?? '(empty)';
    const branch = e.metadata.branchName ?? 'unknown';
    const files = fileList(e.metadata.changedFiles);
    const diff = e.metadata.diffSummary ? `\nDIFF:\n${e.metadata.diffSummary}` : '';
    return `Branch: ${branch}. Commit message: "${msg}". Files: ${files}.${statLine(e)}${diff}\n\nRoast the quality of the commit AND what was actually changed.`;
  },
  branch_switch: (e) =>
    `Switched from "${e.metadata.previousBranch ?? '?'}" to "${e.metadata.branchName ?? '?'}". Roast the branch hopping.`,
  merge_conflict_start: (e) => {
    const files = fileList(e.metadata.changedFiles);
    return `Merge conflict on branch "${e.metadata.branchName ?? '?'}". Conflicted files: ${files}. Roast them for causing this.`;
  },
  merge_conflict_resolved: (e) =>
    `Resolved a merge conflict on "${e.metadata.branchName ?? '?'}". Reluctant respect, but make clear it should not have happened.`,
  conflict_block_preview: (e) => {
    const file = e.metadata.filePath ?? '?';
    const idx = (e.metadata.blockIndex ?? 0) + 1;
    const total = e.metadata.totalBlocks ?? '?';
    const ours = e.metadata.oursSnippet ?? '';
    const theirs = e.metadata.theirsSnippet ?? '';
    return `Conflict block ${idx} of ${total} in "${file}". Pre-fight commentary — roast both sides of the diff before they pick.
OURS (HEAD):
${ours}
THEIRS (incoming):
${theirs}

Caster-style hot take referencing the actual code on both sides. Make a prediction or pick a side.`;
  },
  conflict_block_resolved: (e) => {
    const file = e.metadata.filePath ?? '?';
    const remaining = e.metadata.remainingBlocks ?? 0;
    const total = e.metadata.totalBlocks ?? '?';
    const resType = e.metadata.resolutionType ?? 'custom_edit';
    const ours = e.metadata.oursSnippet ?? '';
    const theirs = e.metadata.theirsSnippet ?? '';
    const kept = e.metadata.resolvedSnippet ?? '';
    const choiceLabel: Record<string, string> = {
      kept_ours: 'kept their own version (HEAD), discarded incoming',
      kept_theirs: 'kept the incoming version, discarded their own',
      merged_both: 'merged both sides together',
      custom_edit: 'wrote a custom hybrid that matches neither side exactly',
      deleted: 'deleted the entire conflicted block',
    };
    return `Resolved a conflict block in "${file}". Remaining: ${remaining}/${total}. Decision: ${choiceLabel[resType] ?? resType}.
OURS:
${ours}
THEIRS:
${theirs}
KEPT:
${kept}

Live esports-caster commentary on this specific decision (mention the file, the choice, and reference the actual code).`;
  },
  file_fully_resolved: (e) => {
    const file = e.metadata.filePath ?? '?';
    const total = e.metadata.totalBlocks ?? '?';
    return `Cleared every conflict block (${total} total) in "${file}". File is fully resolved. React with dramatic mid-match hype.`;
  },
  rebase_start: (e) =>
    `Started a rebase on "${e.metadata.branchName ?? '?'}". Roast them for rewriting history.`,
  rebase_complete: (e) =>
    `Finished a rebase on "${e.metadata.branchName ?? '?'}" without dying. Shocked, reluctant respect.`,
  push_to_main: (e) => {
    const files = fileList(e.metadata.changedFiles);
    const diff = e.metadata.diffSummary ? `\nDIFF:\n${e.metadata.diffSummary}` : '';
    return `Pushed DIRECTLY to "${e.metadata.branchName ?? 'main'}", no PR. Files: ${files}.${statLine(e)}${diff}\n\nRoast the cowboy push referencing what they actually shipped.`;
  },
  force_push: (e) => {
    const files = fileList(e.metadata.changedFiles);
    return `FORCE PUSHED to "${e.metadata.branchName ?? 'main'}". Files: ${files}.${statLine(e)}\n\nMaximum drama roast — they rewrote history.`;
  },
};

export class RoastEngine {
  constructor(private context: vscode.ExtensionContext) {}

  private async getApiKey(): Promise<string | null> {
    const configKey = vscode.workspace.getConfiguration('gitGud').get<string>('geminiApiKey');
    if (configKey) return configKey;
    const secret = await this.context.secrets.get('gitGud.geminiApiKey');
    if (secret) return secret;
    return process.env.GEMINI_API_KEY ?? null;
  }

  async roast(event: GitEvent): Promise<RoastResult | null> {
    const key = await this.getApiKey();
    if (!key) {
      vscode.window.showWarningMessage(
        'Git Gud: No Gemini API key set. Run "Git Gud: Set Gemini API Key" or set gitGud.geminiApiKey in settings.',
      );
      return null;
    }

    const promptFn = EVENT_PROMPTS[event.type];
    if (!promptFn) return null;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: buildSystemPrompt(detectSixSeven(event)) }] },
            contents: [{ role: 'user', parts: [{ text: promptFn(event) }] }],
            generationConfig: {
              temperature: 1.0,
              maxOutputTokens: 250,
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        },
      );
      const data = (await res.json()) as any;
      const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
      if (!text) return null;

      const roastMatch = text.match(/ROAST:\s*(.+?)(?=\n|ADVICE:|$)/is);
      const adviceMatch = text.match(/ADVICE:\s*(.+?)$/is);
      let roast = roastMatch?.[1]?.trim() ?? '';
      let advice = adviceMatch?.[1]?.trim() ?? '';

      if (!roast) {
        // Fallback: first line is roast, last is advice
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        roast = lines[0] ?? text;
        advice = lines.length > 1 ? lines[lines.length - 1] : '';
      }

      // Hard cap to keep notifications readable
      if (roast.length > 200) roast = roast.slice(0, 197) + '...';
      if (advice.length > 200) advice = advice.slice(0, 197) + '...';

      return { roast, advice, eventType: event.type, timestamp: Date.now() };
    } catch (err) {
      console.error('Git Gud roast failed:', err);
      return null;
    }
  }
}
