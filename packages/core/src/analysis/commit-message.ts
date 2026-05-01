import type { CommitMessageVerdict } from '../types';

const GENERIC_MESSAGES = new Set([
    'update', 'changes', 'stuff', 'fix', 'wip', 'asdf', 'test',
    'commit', 'change', 'updated', 'fixed', 'refactor', 'misc',
    'tmp', 'temp', 'backup', 'save', 'oops', 'idk',
]);

const COPY_PASTA_MESSAGES = new Set([
    'initial commit', 'merge branch', 'merge remote-tracking branch',
    'update readme', 'update readme.md', 'bump version',
]);

export function analyzeCommitMessage(message: string): CommitMessageVerdict {
    const trimmed = message.trim();
    const lower = trimmed.toLowerCase();
    const issues: string[] = [];

    if (trimmed.length < 8) {
        issues.push('Too short — describe what changed and why.');
    }

    if (GENERIC_MESSAGES.has(lower) || /^[a-z]+\s*[\d]*$/i.test(lower)) {
        issues.push('Generic message — be specific about what changed.');
    }

    if (COPY_PASTA_MESSAGES.has(lower)) {
        issues.push('Copy-pasted default message — write your own context.');
    }

    if (/^[^a-zA-Z]/.test(trimmed)) {
        issues.push('Does not start with a verb — use imperative mood (e.g., "Add", "Fix", "Refactor").');
    }

    if (/^[A-Z\s]+$/.test(trimmed) && trimmed.length > 5) {
        issues.push('All caps rage commit — take a breath and describe the fix calmly.');
    }

    if (/^[\p{Emoji}\s]+$/u.test(trimmed)) {
        issues.push('Emoji-only commit — words exist for a reason.');
    }

    if (issues.length === 0) {
        return {
            severity: 'info',
            category: 'commit-message',
            message: 'Clean commit message. Keep it up!',
            advice: 'Good commit messages make code archaeology a joy instead of a nightmare.',
            issues: [],
        };
    }

    const severity = issues.length >= 3 ? 'critical' : issues.length >= 2 ? 'warning' : 'warning';

    return {
        severity,
        category: 'commit-message',
        message: `Commit message issues: ${issues.join(' ')}`,
        advice: issues[0] || 'Write commit messages that explain what changed and why.',
        issues,
    };
}
