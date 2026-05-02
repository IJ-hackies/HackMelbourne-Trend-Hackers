import type { PlayerStats } from '../types';

export interface WeeklyReportEvent {
  type: string;
  timestamp: number;
  scoreDelta: number;
  severity: string;
}

export interface WeeklyMetric {
  label: string;
  value: string;
  caption: string;
  tone: 'good' | 'bad' | 'neutral';
}

export interface WeeklyReport {
  rangeStart: number;
  rangeEnd: number;
  totalEvents: number;
  metrics: WeeklyMetric[];
  verdict: string;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

export function generateWeeklyReport(
  events: WeeklyReportEvent[],
  stats: PlayerStats,
  now: number = Date.now(),
): WeeklyReport {
  const rangeStart = now - WEEK_MS;
  const recent = events.filter((e) => e.timestamp >= rangeStart);

  const commits = recent.filter((e) => e.type === 'commit').length;
  const forcePushes = recent.filter((e) => e.type === 'force-push').length;
  const conflicts = recent.filter((e) => e.type === 'merge-conflict').length;
  const mainPushes = recent.filter((e) => e.type === 'push-to-main').length;
  const branchSwitches = recent.filter((e) => e.type === 'branch-switch').length;
  const negativeEvents = recent.filter((e) => e.scoreDelta < 0).length;
  const totalDelta = recent.reduce((sum, e) => sum + e.scoreDelta, 0);
  const savageRate = pct(
    recent.filter((e) => e.severity === 'savage' || e.severity === 'critical').length,
    Math.max(1, recent.length),
  );
  const avgCommitSize =
    stats.totalCommits === 0
      ? 0
      : Math.round((stats.totalInsertions + stats.totalDeletions) / stats.totalCommits);

  const metrics: WeeklyMetric[] = [
    {
      label: 'Commits',
      value: String(commits),
      caption:
        commits === 0
          ? 'Did you even open the repo this week?'
          : commits >= 30
          ? 'Stop committing. Start thinking.'
          : 'Acceptable output. Barely.',
      tone: commits === 0 ? 'bad' : commits >= 30 ? 'bad' : 'neutral',
    },
    {
      label: 'Force pushes',
      value: String(forcePushes),
      caption:
        forcePushes === 0
          ? 'Restraint. Surprising.'
          : forcePushes >= 5
          ? 'Your teammates are updating their resumes.'
          : 'Each one chips away at trust.',
      tone: forcePushes === 0 ? 'good' : 'bad',
    },
    {
      label: 'Pushes to main',
      value: String(mainPushes),
      caption:
        mainPushes === 0
          ? 'Branches exist. You used them. Beautiful.'
          : 'Branch protection is a love language.',
      tone: mainPushes === 0 ? 'good' : 'bad',
    },
    {
      label: 'Merge conflicts',
      value: String(conflicts),
      caption:
        conflicts === 0
          ? 'Either you communicate or you work alone.'
          : 'Pull more often. Beg if you must.',
      tone: conflicts === 0 ? 'good' : conflicts >= 3 ? 'bad' : 'neutral',
    },
    {
      label: 'Branch switches',
      value: String(branchSwitches),
      caption:
        branchSwitches >= 20
          ? 'Pick a lane. Any lane.'
          : branchSwitches === 0
          ? 'Living dangerously on one branch.'
          : 'Sustainable thrash levels.',
      tone: branchSwitches >= 20 ? 'bad' : 'neutral',
    },
    {
      label: 'Avg commit size',
      value: `${avgCommitSize} lines`,
      caption:
        avgCommitSize === 0
          ? 'No data.'
          : avgCommitSize > 400
          ? 'These are not commits, they are landfills.'
          : avgCommitSize < 5
          ? 'Atomic to a fault.'
          : 'Reviewable. For now.',
      tone: avgCommitSize > 400 ? 'bad' : avgCommitSize < 5 ? 'neutral' : 'good',
    },
    {
      label: 'Score delta (7d)',
      value: (totalDelta >= 0 ? '+' : '') + totalDelta,
      caption:
        totalDelta >= 0
          ? 'Trending upward. Suspicious.'
          : 'The hole gets deeper.',
      tone: totalDelta >= 0 ? 'good' : 'bad',
    },
    {
      label: 'Savage roast rate',
      value: `${savageRate}%`,
      caption:
        savageRate >= 40
          ? 'Yikes.'
          : savageRate === 0
          ? 'Nothing to roast (yet).'
          : 'Manageable shame.',
      tone: savageRate >= 40 ? 'bad' : 'good',
    },
    {
      label: 'Clean streak',
      value: String(stats.cleanCommitStreak),
      caption:
        stats.cleanCommitStreak >= 10
          ? 'A monk. We are unworthy.'
          : 'One cowboy commit away from zero.',
      tone: stats.cleanCommitStreak >= 10 ? 'good' : 'neutral',
    },
  ];

  const verdict =
    negativeEvents === 0 && recent.length > 0
      ? 'Suspiciously clean week. Audit your branches.'
      : negativeEvents >= 10
      ? 'Catastrophic. Consider a career in management.'
      : negativeEvents >= 5
      ? 'Your teammates are praying for you.'
      : recent.length === 0
      ? 'No activity. Did Git Gud get uninstalled, or did you?'
      : 'Mixed. Not a disaster. Not a victory.';

  return {
    rangeStart,
    rangeEnd: now,
    totalEvents: recent.length,
    metrics,
    verdict,
  };
}
