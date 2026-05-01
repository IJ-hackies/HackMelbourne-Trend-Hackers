import type { SessionVerdict } from '../types';

export const SESSION_CONFIG = {
    SESSION_GAP_MINUTES: 30,
    LONG_SESSION_HOURS: 4,
    LATE_NIGHT_START: 0,
    LATE_NIGHT_END: 5,
    BURST_WINDOW_MINUTES: 10,
    BURST_COUNT: 5,
} as const;

export function analyzeSession(commitTimestamps: number[]): SessionVerdict {
    if (commitTimestamps.length === 0) {
        return {
            severity: 'info',
            category: 'session-duration',
            message: 'No session data yet.',
            advice: 'Keep committing — we are watching.',
            sessionLengthMinutes: 0,
            lateNight: false,
            weekend: false,
            burstMode: false,
        };
    }

    const sorted = [...commitTimestamps].sort((a, b) => a - b);
    const now = sorted[sorted.length - 1];
    const first = sorted[0];
    const gapMs = SESSION_CONFIG.SESSION_GAP_MINUTES * 60 * 1000;

    let sessionStart = first;
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] > gapMs) {
            sessionStart = sorted[i];
        }
    }

    const sessionLengthMinutes = Math.round((now - sessionStart) / (60 * 1000));
    const lastDate = new Date(now);
    const hour = lastDate.getHours();
    const day = lastDate.getDay();

    const lateNight = hour >= SESSION_CONFIG.LATE_NIGHT_START && hour < SESSION_CONFIG.LATE_NIGHT_END;
    const weekend = day === 0 || day === 6;

    // Burst detection: many commits in short window
    let burstMode = false;
    const burstWindowMs = SESSION_CONFIG.BURST_WINDOW_MINUTES * 60 * 1000;
    for (let i = 0; i < sorted.length; i++) {
        const windowStart = sorted[i];
        const countInWindow = sorted.filter(t => t >= windowStart && t <= windowStart + burstWindowMs).length;
        if (countInWindow >= SESSION_CONFIG.BURST_COUNT) {
            burstMode = true;
            break;
        }
    }

    const issues: string[] = [];
    if (sessionLengthMinutes >= SESSION_CONFIG.LONG_SESSION_HOURS * 60) {
        issues.push(`Session spans ${Math.round(sessionLengthMinutes / 60)} hours. Take a break.`);
    }
    if (lateNight) {
        issues.push('Late-night commits between midnight and 5 AM. Sleep is a feature, not a bug.');
    }
    if (weekend && sessionLengthMinutes >= 60) {
        issues.push('Weekend warrior mode detected. Touch grass occasionally.');
    }
    if (burstMode) {
        issues.push(`${SESSION_CONFIG.BURST_COUNT}+ commits in ${SESSION_CONFIG.BURST_WINDOW_MINUTES} minutes. Panic mode or YOLO mode?`);
    }

    if (issues.length === 0) {
        return {
            severity: 'info',
            category: 'session-duration',
            message: 'Healthy coding session detected.',
            advice: 'Balanced commit habits make for sustainable development.',
            sessionLengthMinutes,
            lateNight,
            weekend,
            burstMode,
        };
    }

    const severity = issues.length >= 2 ? 'warning' : 'info';

    return {
        severity,
        category: 'session-duration',
        message: issues.join(' '),
        advice: 'Sustainable coding > heroic coding. Breaks improve code quality more than caffeine.',
        sessionLengthMinutes,
        lateNight,
        weekend,
        burstMode,
    };
}
