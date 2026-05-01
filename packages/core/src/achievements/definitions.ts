import type { PlayerStats } from '../types';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  condition: (stats: PlayerStats) => { unlocked: boolean; progress: number };
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'merge-conflict-survivor',
    name: 'Merge Conflict Survivor',
    description: 'Resolve 10 merge conflicts and live to tell the tale.',
    condition: (stats) => ({
      unlocked: stats.totalMergeConflicts >= 10,
      progress: Math.min(1, stats.totalMergeConflicts / 10),
    }),
  },
  {
    id: 'force-push-felon',
    name: 'Force Push Felon',
    description: 'Force push 5 times. History is whatever you say it is.',
    condition: (stats) => ({
      unlocked: stats.totalForcePushes >= 5,
      progress: Math.min(1, stats.totalForcePushes / 5),
    }),
  },
  {
    id: 'branch-necromancer',
    name: 'Branch Necromancer',
    description: 'Work on 15 different branches. You raise the dead.',
    condition: (stats) => ({
      unlocked: stats.uniqueBranches.size >= 15,
      progress: Math.min(1, stats.uniqueBranches.size / 15),
    }),
  },
  {
    id: 'commit-goblin',
    name: 'Commit Goblin',
    description: 'Make 10+ commits in a single session. Quantity over quality.',
    condition: (stats) => ({
      unlocked: stats.commitsInCurrentSession >= 10,
      progress: Math.min(1, stats.commitsInCurrentSession / 10),
    }),
  },
  {
    id: 'clean-streak',
    name: 'Clean Streak',
    description: '20 consecutive commits with good messages. Discipline.',
    condition: (stats) => ({
      unlocked: stats.longestCleanStreak >= 20,
      progress: Math.min(1, stats.longestCleanStreak / 20),
    }),
  },
  {
    id: 'readme-avoider',
    name: 'README Avoider',
    description: 'Reach score 300 without ever editing a README.',
    condition: (stats) => ({
      unlocked: stats.score >= 300 && stats.readmeEdits === 0,
      progress: stats.readmeEdits > 0 ? 0 : Math.min(1, stats.score / 300),
    }),
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Make 100 total commits. A true veteran.',
    condition: (stats) => ({
      unlocked: stats.totalCommits >= 100,
      progress: Math.min(1, stats.totalCommits / 100),
    }),
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Make 10 late-night commits. Sleep is for the weak.',
    condition: (stats) => ({
      unlocked: stats.lateNightCommits >= 10,
      progress: Math.min(1, stats.lateNightCommits / 10),
    }),
  },
  {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    description: 'Make 20 weekend commits. Work-life balance is a myth.',
    condition: (stats) => ({
      unlocked: stats.weekendCommits >= 20,
      progress: Math.min(1, stats.weekendCommits / 20),
    }),
  },
  {
    id: 'chaos-agent',
    name: 'Chaos Agent',
    description: 'Accumulate 5 panic bursts. Calm was never an option.',
    condition: (stats) => ({
      unlocked: stats.panicBursts >= 5,
      progress: Math.min(1, stats.panicBursts / 5),
    }),
  },
];
