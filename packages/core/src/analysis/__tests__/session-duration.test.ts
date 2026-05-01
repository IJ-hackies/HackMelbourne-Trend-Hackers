import { describe, it, expect } from 'vitest';
import { analyzeSession, SESSION_THRESHOLDS } from '../session-duration';

function ts(hour: number, minute = 0, day = 7, month = 5, year = 2026): Date {
  // 2026-05-07 is a Thursday
  return new Date(year, month - 1, day, hour, minute);
}

function weekendTs(hour: number, minute = 0): Date {
  return new Date(2026, 4, 2, hour, minute); // 2026-05-02 is a Saturday
}

describe('analyzeSession', () => {
  describe('panic-mode', () => {
    it('flags many commits in a short burst', () => {
      const timestamps = [
        ts(14, 0),
        ts(14, 1),
        ts(14, 2),
        ts(14, 3),
        ts(14, 4),
      ];
      const result = analyzeSession(timestamps);
      expect(result.pattern).toBe('panic-mode');
      expect(result.severity).toBe('warning');
    });

    it('does not flag spread-out commits', () => {
      const timestamps = [
        ts(14, 0),
        ts(14, 20),
        ts(14, 40),
        ts(15, 0),
        ts(15, 20),
      ];
      const result = analyzeSession(timestamps);
      expect(result.pattern).not.toBe('panic-mode');
    });

    it('does not flag fewer than burstMinCommits even if rapid', () => {
      const timestamps = [
        ts(14, 0),
        ts(14, 1),
        ts(14, 2),
      ];
      const result = analyzeSession(timestamps);
      expect(result.pattern).not.toBe('panic-mode');
    });
  });

  describe('long-session', () => {
    it('flags sessions over 4 hours', () => {
      const timestamps = [
        ts(10, 0),
        ts(10, 25),
        ts(10, 50),
        ts(11, 15),
        ts(11, 40),
        ts(12, 5),
        ts(12, 30),
        ts(12, 55),
        ts(13, 20),
        ts(13, 45),
        ts(14, 10),
      ];
      const result = analyzeSession(timestamps);
      expect(result.pattern).toBe('long-session');
      expect(result.severity).toBe('warning');
    });

    it('does not flag sessions under 4 hours', () => {
      const timestamps = [
        ts(10, 0),
        ts(10, 25),
        ts(10, 50),
        ts(11, 15),
        ts(11, 40),
        ts(12, 5),
        ts(12, 30),
        ts(13, 0),
      ];
      const result = analyzeSession(timestamps);
      expect(result.pattern).not.toBe('long-session');
    });

    it('splits separate sessions by gap', () => {
      const timestamps = [
        ts(10, 0),
        ts(10, 20),
        // 2 hour gap — new session
        ts(13, 0),
        ts(13, 20),
      ];
      const result = analyzeSession(timestamps);
      expect(result.pattern).not.toBe('long-session');
    });
  });

  describe('late-night', () => {
    it('flags commits between midnight and 5 AM', () => {
      const timestamps = [ts(3, 15)];
      const result = analyzeSession(timestamps);
      expect(result.pattern).toBe('late-night');
      expect(result.severity).toBe('warning');
    });

    it('flags commit at exactly midnight', () => {
      const timestamps = [ts(0, 0)];
      const result = analyzeSession(timestamps);
      expect(result.pattern).toBe('late-night');
    });

    it('does not flag commits at 5 AM', () => {
      const timestamps = [ts(5, 0)];
      const result = analyzeSession(timestamps);
      expect(result.pattern).not.toBe('late-night');
    });

    it('does not flag daytime commits', () => {
      const timestamps = [ts(14, 30)];
      const result = analyzeSession(timestamps);
      expect(result.pattern).not.toBe('late-night');
    });
  });

  describe('weekend-warrior', () => {
    it('flags 3+ weekend commits', () => {
      const timestamps = [
        weekendTs(10, 0),
        weekendTs(11, 0),
        weekendTs(12, 0),
      ];
      const result = analyzeSession(timestamps);
      expect(result.pattern).toBe('weekend-warrior');
      expect(result.severity).toBe('info');
    });

    it('does not flag fewer than 3 weekend commits', () => {
      const timestamps = [
        weekendTs(10, 0),
        weekendTs(11, 0),
      ];
      const result = analyzeSession(timestamps);
      expect(result.pattern).not.toBe('weekend-warrior');
    });
  });

  describe('clean', () => {
    it('returns clean for healthy sessions', () => {
      const timestamps = [
        ts(10, 0),
        ts(10, 30),
        ts(11, 0),
      ];
      const result = analyzeSession(timestamps);
      expect(result.pattern).toBe('clean');
      expect(result.severity).toBe('info');
    });

    it('returns clean for empty input', () => {
      const result = analyzeSession([]);
      expect(result.pattern).toBe('clean');
    });
  });
});
