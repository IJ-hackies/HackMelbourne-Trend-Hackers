import type { CommitMessageVerdict, Severity } from './types';

const GENERIC_WORDS = new Set([
  'update', 'updates', 'change', 'changes', 'fix', 'fixes',
  'stuff', 'things', 'misc', 'wip', 'test', 'temp',
  'done', 'finished', 'commit', 'save', 'progress',
  'work', 'more', 'added', 'removed', 'modified',
]);

const DEFAULT_MESSAGES = new Set([
  'initial commit',
  'first commit',
  'merge branch',
  'merge pull request',
  'update readme.md',
  'create readme.md',
]);

const EMOJI_ONLY_RE = /^[\s\p{Emoji_Presentation}\p{Extended_Pictographic}️‍]+$/u;

function verdict(
  severity: Severity,
  pattern: CommitMessageVerdict['pattern'],
  message: string,
  advice: string,
  subject?: string,
): CommitMessageVerdict {
  return { severity, category: 'commit-message', pattern, message, advice, subject };
}

export function analyzeCommitMessage(raw: string): CommitMessageVerdict {
  const message = raw.trim();

  if (message.length === 0) {
    return verdict(
      'critical',
      'too-short',
      'An empty commit message? You didn\'t even try.',
      'Every commit should describe what changed and why. Even one sentence helps.',
      message,
    );
  }

  if (EMOJI_ONLY_RE.test(message)) {
    return verdict(
      'warning',
      'emoji-only',
      'Ah yes, the universal language of... emojis.',
      'Emojis are fine as prefixes, but the message still needs words describing the change.',
      message,
    );
  }

  if (message.length <= 3) {
    return verdict(
      'critical',
      'too-short',
      `"${message}" — truly a masterpiece of brevity.`,
      'Commit messages under 4 characters are never descriptive enough. Aim for a short sentence.',
      message,
    );
  }

  if (message === message.toUpperCase() && message.length > 5 && /[A-Z]/.test(message)) {
    return verdict(
      'warning',
      'all-caps',
      `"${message}" — I can hear you screaming through the commit log.`,
      'All-caps messages read like panic. Take a breath, then describe the change calmly.',
      message,
    );
  }

  const lower = message.toLowerCase();

  for (const def of DEFAULT_MESSAGES) {
    if (lower === def || lower.startsWith(def + ' ')) {
      return verdict(
        'warning',
        'default-message',
        `"${message}" — at least change the default message.`,
        'Default/auto-generated messages give no context. Describe what the commit actually does.',
        message,
      );
    }
  }

  const firstWord = lower.split(/\s+/)[0];
  if (message.length <= 10 && GENERIC_WORDS.has(firstWord) && lower.split(/\s+/).length <= 2) {
    return verdict(
      'warning',
      'generic',
      `"${message}" — that could mean literally anything.`,
      'Be specific: what did you change and why? "Fix login redirect loop" beats "fix".',
      message,
    );
  }

  if (GENERIC_WORDS.has(lower)) {
    return verdict(
      'warning',
      'generic',
      `"${message}" — incredibly descriptive. Future you will love this.`,
      'A commit message should let someone understand the change without reading the diff.',
      message,
    );
  }

  const words = message.split(/\s+/);
  if (words.length < 3 && message.length < 15) {
    return verdict(
      'info',
      'no-context',
      `"${message}" — a little more context would go a long way.`,
      'Try completing the sentence: "This commit [does what] because [why]."',
      message,
    );
  }

  return verdict(
    'info',
    'clean',
    'Commit message looks reasonable. Shocking.',
    'Keep writing descriptive commit messages.',
    message,
  );
}
