import type { SessionVerdict, Severity } from './types';

export const SESSION_THRESHOLDS = {
  sessionGapMinutes: 30,
  longSessionHours: 4,
  lateNightStart: 0,
  lateNightEnd: 5,
  burstMaxMinutes: 10,
  burstMinCommits: 5,
} as const;

function verdict(
  severity: Severity,
  pattern: SessionVerdict['pattern'],
  message: string,
  advice: string,
): SessionVerdict {
  return { severity, category: 'session', pattern, message, advice };
}

function splitIntoSessions(timestamps: Date[]): Date[][] {
  if (timestamps.length === 0) return [];
  const sorted = [...timestamps].sort((a, b) => a.getTime() - b.getTime());
  const sessions: Date[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const gap = (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60);
    if (gap > SESSION_THRESHOLDS.sessionGapMinutes) {
      sessions.push([sorted[i]]);
    } else {
      sessions[sessions.length - 1].push(sorted[i]);
    }
  }
  return sessions;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function analyzeSession(commitTimestamps: Date[]): SessionVerdict {
  if (commitTimestamps.length === 0) {
    return verdict('info', 'clean', 'No session data to analyze.', 'Keep committing.');
  }

  const sessions = splitIntoSessions(commitTimestamps);

  for (const session of sessions) {
    if (session.length >= SESSION_THRESHOLDS.burstMinCommits) {
      const spanMinutes =
        (session[session.length - 1].getTime() - session[0].getTime()) / (1000 * 60);
      if (spanMinutes <= SESSION_THRESHOLDS.burstMaxMinutes) {
        return verdict(
          'warning',
          'panic-mode',
          `${session.length} commits in ${Math.round(spanMinutes)} minutes. Everything okay over there?`,
          'Rapid-fire commits usually mean something is on fire. Slow down, test locally, and commit when the change is ready.',
        );
      }
    }
  }

  for (const session of sessions) {
    const durationHours =
      (session[session.length - 1].getTime() - session[0].getTime()) / (1000 * 60 * 60);
    if (durationHours >= SESSION_THRESHOLDS.longSessionHours) {
      return verdict(
        'warning',
        'long-session',
        `${Math.round(durationHours)}-hour coding session detected. Your chair is now part of you.`,
        'Sessions over 4 hours tank code quality. Take breaks — your bugs will still be there when you get back.',
      );
    }
  }

  const lateNightCommit = commitTimestamps.find(ts => {
    const h = ts.getHours();
    return h >= SESSION_THRESHOLDS.lateNightStart && h < SESSION_THRESHOLDS.lateNightEnd;
  });
  if (lateNightCommit) {
    return verdict(
      'warning',
      'late-night',
      `Committing at ${lateNightCommit.getHours()}:${String(lateNightCommit.getMinutes()).padStart(2, '0')} AM. The code you write at 3 AM is the code you debug at 9 AM.`,
      'Late-night code has higher defect rates. If you must code late, at least write tests before you sleep.',
    );
  }

  const weekendCommits = commitTimestamps.filter(isWeekend);
  if (weekendCommits.length >= 3) {
    return verdict(
      'info',
      'weekend-warrior',
      `${weekendCommits.length} commits on the weekend. Your work-life balance called — you didn't pick up.`,
      'Weekend coding is fine occasionally, but sustained weekend work leads to burnout. Pace yourself.',
    );
  }

  return verdict(
    'info',
    'clean',
    'Session looks healthy. No concerning patterns detected.',
    'Keep maintaining good coding habits and regular breaks.',
  );
}
