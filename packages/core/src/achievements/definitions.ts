import type { AchievementDefinition } from '../types';

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // From Feat/V1 (first_occurrence)
  { id: 'first-force-push', name: 'Nuclear Option', description: 'Force push for the first time. History is yours to rewrite.', trigger: { type: 'first_occurrence', statKey: 'totalForcePushes', threshold: 1 } },
  { id: 'first-push-to-main', name: 'Cowboy Commit', description: 'Push directly to main without a PR. Hold my beer.', trigger: { type: 'first_occurrence', statKey: 'directMainPushes', threshold: 1 } },
  { id: 'first-merge-conflict', name: 'Conflict Initiated', description: 'Encounter your first merge conflict. Welcome to the pain.', trigger: { type: 'first_occurrence', statKey: 'totalMergeConflicts', threshold: 1 } },

  // From Feat/V1 (cumulative) — with real names
  { id: 'merge-conflict-survivor', name: 'Merge Conflict Survivor', description: 'Resolve 10 merge conflicts and live to tell the tale.', trigger: { type: 'cumulative', statKey: 'totalMergeConflicts', threshold: 10 } },
  { id: 'commit-hoarder', name: 'Commit Goblin', description: 'Make 10+ commits in a single session. Quantity over quality.', trigger: { type: 'cumulative', statKey: 'commitsInCurrentSession', threshold: 10 } },
  { id: 'rebase-goblin', name: 'Rebase Goblin', description: 'Rebase 5 times. Either genius or maximum chaos.', trigger: { type: 'cumulative', statKey: 'totalRebases', threshold: 5 } },
  { id: 'force-push-felon', name: 'Force Push Felon', description: 'Force push 5 times. History is whatever you say it is.', trigger: { type: 'cumulative', statKey: 'totalForcePushes', threshold: 5 } },
  { id: 'branch-hopper', name: 'Branch Necromancer', description: 'Work on 15 different branches. You raise the dead.', trigger: { type: 'cumulative', statKey: 'uniqueBranches', threshold: 15 } },

  // From Feat/V1 (streak)
  { id: 'good-commit-streak-5', name: 'Clean Streak', description: '5 consecutive good commit messages. Character development.', trigger: { type: 'streak', statKey: 'goodCommitStreak', threshold: 5 } },
  { id: 'good-commit-streak-10', name: 'The Ascended', description: '10 consecutive good commit messages. The team does not deserve you.', trigger: { type: 'streak', statKey: 'goodCommitStreak', threshold: 10 } },
  { id: 'clean-streak-20', name: 'Discipline Incarnate', description: '20 consecutive clean commits. Annoyingly good.', trigger: { type: 'streak', statKey: 'longestCleanStreak', threshold: 20 } },

  // From Jorvan-version (unique ones)
  { id: 'centurion', name: 'Centurion', description: '100 total commits. A true veteran.', trigger: { type: 'cumulative', statKey: 'totalCommits', threshold: 100 } },
  { id: 'night-owl', name: 'Night Owl', description: '10 late-night commits. Sleep is for the weak.', trigger: { type: 'cumulative', statKey: 'lateNightCommits', threshold: 10 } },
  { id: 'weekend-warrior', name: 'Weekend Warrior', description: '20 weekend commits. Work-life balance is a myth.', trigger: { type: 'cumulative', statKey: 'weekendCommits', threshold: 20 } },
  { id: 'chaos-agent', name: 'Chaos Agent', description: '5 panic bursts. Calm was never an option.', trigger: { type: 'cumulative', statKey: 'panicBursts', threshold: 5 } },
  { id: 'readme-avoider', name: 'README Avoider', description: 'Reach score 300 without editing a README.', trigger: { type: 'cumulative', statKey: 'score', threshold: 300 } },

  // From Huey (adapted to main's trigger format)
  { id: 'first-blood', name: 'First Blood', description: 'Your first roast. Welcome to competitive Git.', trigger: { type: 'first_occurrence', statKey: 'totalCommits', threshold: 1 } },
  { id: 'diamond-hands', name: 'Diamond Hands', description: 'Reach Diamond Git Wizard rank. The summit of version control.', trigger: { type: 'cumulative', statKey: 'score', threshold: 1000 } },
];
