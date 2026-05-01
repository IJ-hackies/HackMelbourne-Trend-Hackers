import type { BranchNameVerdict } from '../types';

const DEFAULT_BRANCHES = new Set(['main', 'master', 'develop', 'dev', 'trunk']);

const MEANINGLESS_NAMES = new Set([
    'test', 'branch1', 'branch2', 'my-branch', 'temp', 'tmp',
    'fix', 'update', 'new', 'old', 'wip', 'work', 'stuff',
]);

const VALID_PREFIXES = ['feat/', 'fix/', 'chore/', 'docs/', 'refactor/', 'test/', 'perf/', 'ci/', 'build/', 'style/'];

export function analyzeBranchName(branchName: string, isDefault = false): BranchNameVerdict {
    const normalized = branchName.trim().toLowerCase();

    if (DEFAULT_BRANCHES.has(normalized) || isDefault) {
        return {
            severity: 'critical',
            category: 'branch-name',
            message: `Working directly on \`${branchName}\` — the sacred default branch. Your teammates will feel this.`,
            advice: 'Create a feature branch for every change. Default branches are for merging, not developing.',
            isDefaultBranch: true,
        };
    }

    if (MEANINGLESS_NAMES.has(normalized)) {
        return {
            severity: 'warning',
            category: 'branch-name',
            message: `Branch name "${branchName}" communicates absolutely nothing.`,
            advice: 'Use descriptive branch names that explain the purpose of the change.',
            isDefaultBranch: false,
        };
    }

    if (/\s/.test(branchName)) {
        return {
            severity: 'warning',
            category: 'branch-name',
            message: `Branch name "${branchName}" contains spaces. Every shell on Earth just cried.`,
            advice: 'Use kebab-case (hyphens) instead of spaces in branch names.',
            isDefaultBranch: false,
        };
    }

    if (branchName.length > 50) {
        return {
            severity: 'warning',
            category: 'branch-name',
            message: `Branch name "${branchName}" is a novel. Keep it under 50 characters.`,
            advice: 'Shorter branch names are easier to type, tab-complete, and read in PR lists.',
            isDefaultBranch: false,
        };
    }

    const hasPrefix = VALID_PREFIXES.some(p => normalized.startsWith(p));
    if (!hasPrefix) {
        return {
            severity: 'info',
            category: 'branch-name',
            message: `Branch "${branchName}" is missing a conventional prefix (feat/, fix/, etc.).`,
            advice: 'Consider using conventional branch prefixes to make your workflow scannable.',
            isDefaultBranch: false,
        };
    }

    return {
        severity: 'info',
        category: 'branch-name',
        message: `Branch "${branchName}" follows good naming conventions.`,
        advice: 'Consistent branch naming makes repository navigation effortless.',
        isDefaultBranch: false,
    };
}
