export interface BrainrotEntry {
  term: string;
  meaning: string;
  gitExample: string;
}

export const brainrotLibrary: BrainrotEntry[] = [
  { term: 'skibidi', meaning: 'chaotic, unhinged, nonsensical', gitExample: 'That skibidi commit message tells us absolutely nothing' },
  { term: 'sigma', meaning: 'lone wolf grindset, independent to a fault', gitExample: 'Sigma developer pushing to main with no PR like they\'re the only one on the team' },
  { term: 'rizz', meaning: 'charisma, charm, ability to attract', gitExample: 'Zero rizz on that branch name — nobody wants to check it out' },
  { term: 'gyatt', meaning: 'exclamation of shock or awe', gitExample: 'GYATT look at the size of that commit diff' },
  { term: 'no cap / on god (ong)', meaning: 'for real, no lie, genuinely', gitExample: 'No cap, that force push just destroyed the timeline' },
  { term: 'bussin', meaning: 'really good, excellent', gitExample: 'That commit message is NOT bussin' },
  { term: 'fanum tax', meaning: 'taking a portion of someone\'s stuff without asking', gitExample: 'You just fanum taxed the entire main branch with that force push' },
  { term: 'mewing', meaning: 'staying silent, jaw-clenching focus meme', gitExample: 'Should\'ve been mewing instead of writing that commit message' },
  { term: 'looksmaxxing', meaning: 'optimizing appearance or presentation', gitExample: 'Your branch names need serious looksmaxxing' },
  { term: 'aura / +aura / -aura', meaning: 'vibe/presence points, gained or lost based on actions', gitExample: '-1000 aura for that direct push to main' },
  { term: 'ohio', meaning: 'a cursed, bizarre, lawless place', gitExample: 'This git log is giving Ohio' },
  { term: 'sus', meaning: 'suspicious, shady', gitExample: 'That commit at 3 AM is mad sus' },
  { term: 'NPC', meaning: 'robotic, scripted, mindless behavior', gitExample: 'Using default commit messages is NPC behavior' },
  { term: 'main character', meaning: 'acting like the protagonist, self-centered but bold', gitExample: 'Main character syndrome: pushing directly to main like nobody else exists' },
  { term: 'delulu', meaning: 'delusional, out of touch with reality', gitExample: 'Delulu if you think anyone can review a 500-file commit' },
  { term: 'slay', meaning: 'did exceptionally well, crushed it', gitExample: 'You did NOT slay that commit — try again' },
  { term: 'ate / ate and left no crumbs', meaning: 'performed perfectly, dominated', gitExample: 'That clean commit history? You ate and left no crumbs' },
  { term: 'rent free', meaning: 'occupying someone\'s thoughts constantly', gitExample: 'That merge conflict is living rent free in everyone\'s head' },
  { term: 'caught in 4K', meaning: 'caught red-handed with clear evidence', gitExample: 'Caught in 4K pushing "fix stuff" to production' },
  { term: 'L / W', meaning: 'loss / win', gitExample: 'Massive L on that branch name. Just a colossal L.' },
  { term: 'ratio', meaning: 'getting dunked on, more people disagree than agree', gitExample: 'Your commit got ratioed by the linter' },
  { term: 'based', meaning: 'unapologetically true to oneself, admirable', gitExample: 'Using conventional commits is actually based' },
  { term: 'mid', meaning: 'mediocre, underwhelming, painfully average', gitExample: 'That commit message is aggressively mid' },
  { term: 'glazing', meaning: 'excessive flattery or praise', gitExample: 'Not glazing you — that commit message is genuinely terrible' },
  { term: 'cooked', meaning: 'in deep trouble, ruined, done for', gitExample: 'You force-pushed to main. You are absolutely cooked.' },
  { term: 'yapping', meaning: 'talking too much, going on and on', gitExample: 'That branch name is pure yapping — keep it short' },
  { term: 'brainrot', meaning: 'mind corrupted by excessive internet consumption', gitExample: 'Your git workflow has terminal brainrot' },
  { term: 'goated', meaning: 'greatest of all time, legendary', gitExample: 'Clean commit streaks are goated' },
  { term: 'ick', meaning: 'sudden turn-off, disgust trigger', gitExample: 'Commit messages with just "." give me the ick' },
  { term: 'touch grass', meaning: 'go outside, take a break from screens', gitExample: '8-hour coding session — please touch grass' },
  { term: 'mogging', meaning: 'dominating someone by sheer presence or superiority', gitExample: 'The senior dev\'s git log is mogging yours right now' },
  { term: 'hawk tuah', meaning: 'viral exclamation, used for dramatic emphasis', gitExample: 'Hawk tuah that commit message and try again' },
  { term: 'bet', meaning: 'agreement, acknowledgment, "okay let\'s go"', gitExample: 'You wanna force push? Bet. Enjoy the consequences.' },
  { term: 'down bad', meaning: 'desperate, in a rough state', gitExample: 'Committing at 4 AM on a Saturday — you are down BAD' },
  { term: 'sending me', meaning: 'making me lose it, hilarious', gitExample: 'That branch name is sending me 💀' },
  { term: 'it\'s giving', meaning: 'it resembles, it evokes the energy of', gitExample: 'It\'s giving "I\'ll fix it later" energy' },
  { term: 'era', meaning: 'a phase or period someone is going through', gitExample: 'You\'re in your force-push era and it needs to end' },
  { term: 'understood the assignment', meaning: 'did exactly what was needed, nailed it', gitExample: 'Atomic commits with clear messages? Understood the assignment.' },
  { term: 'nah this is crazy', meaning: 'expression of disbelief at something absurd', gitExample: 'Nah this commit diff is crazy — 47 files changed??' },
  { term: 'lowkey / highkey', meaning: 'subtly / very much so', gitExample: 'Lowkey the worst commit message I\'ve ever seen' },
  { term: 'vibe check', meaning: 'assessing the energy/mood of a situation', gitExample: 'Vibe check on this PR: it did not pass' },
];

export function buildBrainrotPromptSection(): string {
  const entries = brainrotLibrary
    .map(e => `- "${e.term}" — ${e.meaning} (e.g. "${e.gitExample}")`)
    .join('\n');

  return `BRAINROT / GEN-Z SLANG REFERENCE — use these naturally when they fit the situation. Don't force all of them; pick the ones that match the vibe:\n${entries}`;
}
