import { GitEventType } from '../types';
import type { Roast, AnalysisResult } from '../types';

export interface RoastTemplate {
    eventTypes: GitEventType[];
    severities: Array<'mild' | 'medium' | 'savage'>;
    predicate?: (analysis: AnalysisResult) => boolean;
    templates: string[];
    advice: string;
}

export const TEMPLATES: RoastTemplate[] = [
    // Commit — mild
    {
        eventTypes: [GitEventType.Commit],
        severities: ['mild'],
        templates: [
            'That commit message has the energy of a sleepy intern. You can do better.',
            'Not bad, but I have seen paint dry with more narrative flair.',
            'Functional commit. The code equivalent of plain oatmeal.',
            'Adequate. Barely. Like a participation trophy for version control.',
        ],
        advice: 'Add context: what changed and why. Your future self will thank you during git blame.',
    },
    // Commit — medium
    {
        eventTypes: [GitEventType.Commit],
        severities: ['medium'],
        templates: [
            'Commit message "{message}"? My grandmother commits with more description, and she types with one finger.',
            'That commit is so vague it could be a horoscope. "Things happened. Stars aligned."',
            '"{message}" — congratulations, you just wrote the git equivalent of "etc."',
            'I have seen error logs with better storytelling than this commit.',
        ],
        advice: 'Use imperative mood, mention the scope, and explain the why. Think: "If I read this in 6 months, would I understand it?"',
    },
    // Commit — savage
    {
        eventTypes: [GitEventType.Commit],
        severities: ['savage'],
        templates: [
            '"{message}" — this commit message is a hate crime against software engineering.',
            'Breaking news: local developer discovers the absolute minimum effort required to trigger a commit.',
            'This commit message is so bad I am forwarding it to your therapist.',
            '"{message}"? I have seen auto-generated CHANGELOG entries with more soul.',
            'Your commit history just took 10 points of emotional damage. So did I.',
        ],
        advice: 'Write commit messages like emails to your team: subject line + context. If it is worth committing, it is worth explaining.',
    },
    // Force push — always savage
    {
        eventTypes: [GitEventType.ForcePush],
        severities: ['savage'],
        templates: [
            'FORCE PUSH. You just pulled a Thanos on shared history. Half your team commits are now in the soul stone.',
            'Ah, the old "rewrite history and hope nobody notices" strategy. Bold. Foolish. Legendary.',
            'You force-pushed to {branch}. Somewhere, a junior dev just lost 3 hours of work and faith in humanity.',
            'This force push has more red flags than a communist parade.',
        ],
        advice: 'Never force push shared branches. Use revert commits, or coordinate a history rewrite with your entire team present.',
    },
    // Direct main push — savage
    {
        eventTypes: [GitEventType.Push],
        severities: ['savage'],
        predicate: (a) => a.verdicts.some(v => v.category === 'risky-action' && (v as any).actionType === 'direct-main-push'),
        templates: [
            'Pushing directly to {branch}? You absolute maverick. Your CI pipeline weeps.',
            'Who needs code review when you have confidence and a complete disregard for process?',
            '{branch} just got pushed to directly. The commit history now has trust issues.',
        ],
        advice: 'Default branches are sacred. Open a PR, get reviews, let CI run. Process protects prod.',
    },
    // Rebase — medium
    {
        eventTypes: [GitEventType.Rebase],
        severities: ['medium'],
        templates: [
            'Rebase detected. History is being rewritten. Hope this branch never left your machine.',
            'Rebasing is like time travel: cool in theory, catastrophic when you erase someone else timeline.',
        ],
        advice: 'Only rebase local-only branches. For shared branches, merge commits are honest about history.',
    },
    // Merge conflict — medium
    {
        eventTypes: [GitEventType.MergeConflict],
        severities: ['medium'],
        templates: [
            'Merge conflict. Two branches entered. One will leave. Choose wisely.',
            'The codebase is bleeding. Merge conflicts are the battle scars of parallel development.',
        ],
        advice: 'Resolve conflicts carefully, test thoroughly, and commit the resolution as a clear merge commit.',
    },
    // Branch name issues — medium
    {
        eventTypes: [GitEventType.Commit, GitEventType.BranchSwitch],
        severities: ['medium'],
        predicate: (a) => a.verdicts.some(v => v.category === 'branch-name' && (v as any).isDefaultBranch),
        templates: [
            'Working on {branch}? This is not a feature branch. This is an intervention waiting to happen.',
            '{branch} is for merging into, not developing on. You just violated the prime directive of Git.',
        ],
        advice: 'Create feature branches for all work. Default branches are integration targets, not workspaces.',
    },
    // Session duration — mild / medium
    {
        eventTypes: [GitEventType.Commit],
        severities: ['medium'],
        predicate: (a) => a.verdicts.some(v => v.category === 'session-duration' && (v as any).lateNight),
        templates: [
            'Committing at {hour}? The only thing that should be awake at this hour is the production server.',
            'Late-night commit detected. Your sleep schedule is now inversely correlated with code quality.',
        ],
        advice: 'Sleep deprivation produces bugs, not features. Commit in the morning with a clear head.',
    },
    // Giant commit — medium
    {
        eventTypes: [GitEventType.Commit],
        severities: ['medium'],
        predicate: (a) => a.verdicts.some(v => v.category === 'commit-size' && (v as any).severity !== 'info'),
        templates: [
            '{files} files changed? This is not a commit, it is a deploy. Break it up.',
            '+{insertions}/-{deletions} lines? That is not a commit, that is a manifesto.',
        ],
        advice: 'Each commit should do one thing well. Large commits are hard to review, revert, and bisect.',
    },
];
