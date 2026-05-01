import { GitEvent, UserStats } from './types';
import { EVENT_SCORE_DELTAS, calculateRank } from './ranks';

function isGoodCommitMessage(msg: string): boolean {
  if (!msg) return false;
  const trimmed = msg.trim();
  if (trimmed.length < 10) return false;
  const badPatterns = /^(fix|wip|update|changes|stuff|misc|temp|asdf|test|aaa)$/i;
  if (badPatterns.test(trimmed)) return false;
  const lazyStart = /^(fix|wip|update)\b/i;
  if (lazyStart.test(trimmed) && trimmed.length < 20) return false;
  return true;
}

export function scoreEvent(event: GitEvent, _stats: UserStats): number {
  switch (event.type) {
    case 'commit': {
      const msg = event.metadata.commitMessage ?? '';
      if (isGoodCommitMessage(msg)) return EVENT_SCORE_DELTAS.commit_good;
      if (msg.trim().length >= 5) return EVENT_SCORE_DELTAS.commit_ok;
      return EVENT_SCORE_DELTAS.commit_bad;
    }
    case 'push_to_main': return EVENT_SCORE_DELTAS.push_to_main;
    case 'force_push': return EVENT_SCORE_DELTAS.force_push;
    case 'merge_conflict_start': return EVENT_SCORE_DELTAS.merge_conflict_start;
    case 'merge_conflict_resolved': return EVENT_SCORE_DELTAS.merge_conflict_resolved;
    case 'rebase_start': return EVENT_SCORE_DELTAS.rebase_start;
    case 'rebase_complete': return EVENT_SCORE_DELTAS.rebase_complete;
    case 'branch_switch': return EVENT_SCORE_DELTAS.branch_switch;
    case 'conflict_block_resolved': return EVENT_SCORE_DELTAS.conflict_block_resolved;
    case 'file_fully_resolved': return EVENT_SCORE_DELTAS.file_fully_resolved;
    case 'conflict_block_preview': return 0;
    default: return 0;
  }
}

export function applyEvent(event: GitEvent, stats: UserStats): UserStats {
  const delta = scoreEvent(event, stats);
  const newScore = Math.max(0, stats.score + delta);
  const newEventCounts = { ...stats.eventCounts };
  newEventCounts[event.type] = (newEventCounts[event.type] ?? 0) + 1;

  let goodCommitStreak = stats.goodCommitStreak ?? 0;
  if (event.type === 'commit') {
    if (delta === EVENT_SCORE_DELTAS.commit_good) goodCommitStreak += 1;
    else goodCommitStreak = 0;
  }

  return {
    ...stats,
    score: newScore,
    rank: calculateRank(newScore),
    eventCounts: newEventCounts,
    goodCommitStreak,
  };
}
