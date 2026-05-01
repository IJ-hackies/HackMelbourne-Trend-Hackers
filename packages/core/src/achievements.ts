import { Achievement } from './types';

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_force_push',
    _comment: 'Unlocks the first time the user force pushes. The nuclear option of Git — rewrites history and destroys teammates. A classic villain move.',
    name: 'FILL_IN_NAME',
    description: 'FILL_IN_DESCRIPTION',
    imageKey: 'FILL_IN_IMAGE',
    trigger: { type: 'first_occurrence', eventType: 'force_push' },
    unlocked: false,
  },
  {
    id: 'first_push_to_main',
    _comment: 'Unlocks the first time user pushes directly to main/master without a PR. The classic "hold my beer" move that senior devs cry about.',
    name: 'FILL_IN_NAME',
    description: 'FILL_IN_DESCRIPTION',
    imageKey: 'FILL_IN_IMAGE',
    trigger: { type: 'first_occurrence', eventType: 'push_to_main' },
    unlocked: false,
  },
  {
    id: 'first_merge_conflict',
    _comment: 'Unlocks the first time a merge conflict is detected. You have become the chaos. Your teammates feel it.',
    name: 'FILL_IN_NAME',
    description: 'FILL_IN_DESCRIPTION',
    imageKey: 'FILL_IN_IMAGE',
    trigger: { type: 'first_occurrence', eventType: 'merge_conflict_start' },
    unlocked: false,
  },
  {
    id: 'merge_conflict_survivor',
    _comment: 'Unlocks after successfully resolving 3 merge conflicts. You did not quit. You are built different. Barely.',
    name: 'FILL_IN_NAME',
    description: 'FILL_IN_DESCRIPTION',
    imageKey: 'FILL_IN_IMAGE',
    trigger: { type: 'cumulative', eventType: 'merge_conflict_resolved', threshold: 3 },
    unlocked: false,
  },
  {
    id: 'commit_hoarder',
    _comment: 'Unlocks after 10 total commits regardless of quality. Quantity over quality energy.',
    name: 'FILL_IN_NAME',
    description: 'FILL_IN_DESCRIPTION',
    imageKey: 'FILL_IN_IMAGE',
    trigger: { type: 'cumulative', eventType: 'commit', threshold: 10 },
    unlocked: false,
  },
  {
    id: 'rebase_goblin',
    _comment: 'Unlocks after rebasing 5 times. Either you know what you are doing, or you are causing maximum damage. No in between.',
    name: 'FILL_IN_NAME',
    description: 'FILL_IN_DESCRIPTION',
    imageKey: 'FILL_IN_IMAGE',
    trigger: { type: 'cumulative', eventType: 'rebase_start', threshold: 5 },
    unlocked: false,
  },
  {
    id: 'good_commit_streak_5',
    _comment: 'Unlocks after 5 consecutive good commit messages. Descriptive, not too short, not lazy. Actual character development.',
    name: 'FILL_IN_NAME',
    description: 'FILL_IN_DESCRIPTION',
    imageKey: 'FILL_IN_IMAGE',
    trigger: { type: 'streak', eventType: 'commit', threshold: 5 },
    unlocked: false,
  },
  {
    id: 'good_commit_streak_10',
    _comment: 'Unlocks after 10 consecutive good commit messages. You have ascended. The team does not deserve you.',
    name: 'FILL_IN_NAME',
    description: 'FILL_IN_DESCRIPTION',
    imageKey: 'FILL_IN_IMAGE',
    trigger: { type: 'streak', eventType: 'commit', threshold: 10 },
    unlocked: false,
  },
  {
    id: 'force_push_addict',
    _comment: 'Unlocks after force pushing 3 times total. At this point it is a lifestyle choice. Git history is just a suggestion to you.',
    name: 'FILL_IN_NAME',
    description: 'FILL_IN_DESCRIPTION',
    imageKey: 'FILL_IN_IMAGE',
    trigger: { type: 'cumulative', eventType: 'force_push', threshold: 3 },
    unlocked: false,
  },
  {
    id: 'branch_hopper',
    _comment: 'Unlocks after switching branches 20 times. You cannot commit to a branch any more than you can commit to a plan.',
    name: 'FILL_IN_NAME',
    description: 'FILL_IN_DESCRIPTION',
    imageKey: 'FILL_IN_IMAGE',
    trigger: { type: 'cumulative', eventType: 'branch_switch', threshold: 20 },
    unlocked: false,
  },
];

export function checkAchievements(
  achievements: Achievement[],
  eventType: string,
  eventCounts: Partial<Record<string, number>>,
  goodCommitStreak: number,
): Achievement[] {
  return achievements.map((a) => {
    if (a.unlocked) return a;
    const { trigger } = a;
    if (trigger.eventType !== eventType) return a;

    let shouldUnlock = false;
    if (trigger.type === 'first_occurrence') {
      shouldUnlock = (eventCounts[eventType] ?? 0) >= 1;
    } else if (trigger.type === 'cumulative') {
      shouldUnlock = (eventCounts[eventType] ?? 0) >= (trigger.threshold ?? 1);
    } else if (trigger.type === 'streak') {
      shouldUnlock = goodCommitStreak >= (trigger.threshold ?? 1);
    }

    if (shouldUnlock) return { ...a, unlocked: true, unlockedAt: Date.now() };
    return a;
  });
}
