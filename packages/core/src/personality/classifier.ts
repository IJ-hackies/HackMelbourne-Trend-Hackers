import type { PlayerStats } from '../types';

export interface PersonalityResult {
  type: string;
  description: string;
}

interface Archetype {
  type: string;
  description: string;
  score: (stats: PlayerStats) => number;
}

const ARCHETYPES: Archetype[] = [
  {
    type: 'Commit Goblin',
    description: 'Commits like breathing — frequently, reflexively, and in tiny gasps.',
    score: (stats) => {
      let s = 0;
      if (stats.totalCommits > 50) s += 3;
      if (stats.averageCommitSize < 20 && stats.totalCommits > 10) s += 4;
      if (stats.commitsInCurrentSession >= 8) s += 3;
      return s;
    },
  },
  {
    type: 'Chaos Mage',
    description: 'Force pushes, rebases, hard resets — chaos is a ladder and they\'re climbing.',
    score: (stats) => {
      let s = 0;
      s += Math.min(4, stats.totalForcePushes * 2);
      s += Math.min(3, stats.totalRebases);
      s += Math.min(3, stats.hardResets * 2);
      return s;
    },
  },
  {
    type: 'README Avoider',
    description: 'Documentation? Never heard of it. The code is self-documenting (it isn\'t).',
    score: (stats) => {
      let s = 0;
      if (stats.readmeEdits === 0 && stats.totalCommits >= 20) s += 6;
      if (stats.readmeEdits === 0 && stats.totalCommits >= 50) s += 4;
      return s;
    },
  },
  {
    type: 'Monolith Merchant',
    description: 'One commit to rule them all. Giant, sprawling, unreviewable.',
    score: (stats) => {
      let s = 0;
      if (stats.averageCommitSize > 300) s += 4;
      if (stats.averageCommitSize > 600) s += 3;
      if (stats.uniqueBranches.size <= 2 && stats.totalCommits >= 10) s += 3;
      return s;
    },
  },
  {
    type: 'Branch Hoarder',
    description: 'Creates branches like bookmarks — many opened, few ever closed.',
    score: (stats) => {
      let s = 0;
      const branchRatio = stats.totalCommits > 0
        ? stats.uniqueBranches.size / stats.totalCommits
        : 0;
      if (stats.uniqueBranches.size >= 10) s += 3;
      if (branchRatio > 0.5) s += 4;
      if (stats.totalMerges < stats.uniqueBranches.size * 0.3) s += 3;
      return s;
    },
  },
  {
    type: 'The Perfectionist',
    description: 'High score, clean history, methodical. Annoyingly good at this.',
    score: (stats) => {
      let s = 0;
      if (stats.score >= 500) s += 3;
      if (stats.longestCleanStreak >= 10) s += 3;
      if (stats.totalForcePushes === 0 && stats.totalCommits >= 20) s += 2;
      if (stats.directMainPushes === 0 && stats.totalCommits >= 20) s += 2;
      return s;
    },
  },
  {
    type: 'Night Crawler',
    description: 'Codes in darkness. Commits at 3 AM. Probably a vampire.',
    score: (stats) => {
      let s = 0;
      if (stats.lateNightCommits >= 5) s += 4;
      if (stats.lateNightCommits >= 15) s += 3;
      if (stats.weekendCommits >= 10) s += 3;
      return s;
    },
  },
  {
    type: '\u{1F4A5} Merge Conflict Survivor',
    description: 'You live in the conflict zone. Git merge is your daily workout.',
    score: (stats) => {
      let s = 0;
      if (stats.totalConflictsResolved >= 3) s += 4;
      if (stats.totalConflictsResolved >= 8) s += 3;
      if (stats.totalMerges >= 5) s += 2;
      if (stats.totalMergeConflicts >= 5) s += 1;
      return s;
    },
  },
];

const DEFAULT_PERSONALITY: PersonalityResult = {
  type: 'Unclassified Recruit',
  description: 'Not enough data to determine a personality. Keep committing — we\'re watching.',
};

export function classifyPersonality(stats: PlayerStats): PersonalityResult {
  let best: Archetype | null = null;
  let bestScore = 0;

  for (const archetype of ARCHETYPES) {
    const s = archetype.score(stats);
    if (s > bestScore) {
      bestScore = s;
      best = archetype;
    }
  }

  if (!best || bestScore < 3) return DEFAULT_PERSONALITY;

  return { type: best.type, description: best.description };
}
