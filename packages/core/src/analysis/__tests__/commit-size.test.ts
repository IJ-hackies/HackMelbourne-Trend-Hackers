import { describe, it, expect } from 'vitest';
import { analyzeCommitSize, THRESHOLDS } from '../commit-size';

describe('analyzeCommitSize', () => {
  describe('generated-only', () => {
    it('detects commits touching only lock files', () => {
      const result = analyzeCommitSize({
        filesChanged: 1,
        insertions: 500,
        deletions: 200,
        files: ['package-lock.json'],
      });
      expect(result.pattern).toBe('generated-only');
      expect(result.severity).toBe('info');
    });

    it('detects commits touching only generated files', () => {
      const result = analyzeCommitSize({
        filesChanged: 2,
        insertions: 1000,
        deletions: 800,
        files: ['dist/bundle.js', 'types.d.ts'],
      });
      expect(result.pattern).toBe('generated-only');
    });

    it('does not flag when non-generated files are included', () => {
      const result = analyzeCommitSize({
        filesChanged: 2,
        insertions: 500,
        deletions: 200,
        files: ['package-lock.json', 'src/index.ts'],
      });
      expect(result.pattern).not.toBe('generated-only');
    });
  });

  describe('giant (critical)', () => {
    it('flags mega commits by file count', () => {
      const result = analyzeCommitSize({
        filesChanged: THRESHOLDS.megaFiles,
        insertions: 100,
        deletions: 50,
      });
      expect(result.pattern).toBe('giant');
      expect(result.severity).toBe('critical');
    });

    it('flags mega commits by line count', () => {
      const result = analyzeCommitSize({
        filesChanged: 5,
        insertions: THRESHOLDS.megaLines,
        deletions: 0,
      });
      expect(result.pattern).toBe('giant');
      expect(result.severity).toBe('critical');
    });
  });

  describe('giant (warning)', () => {
    it('flags large commits by file count', () => {
      const result = analyzeCommitSize({
        filesChanged: THRESHOLDS.giantFiles,
        insertions: 100,
        deletions: 50,
      });
      expect(result.pattern).toBe('giant');
      expect(result.severity).toBe('warning');
    });

    it('flags large commits by line count', () => {
      const result = analyzeCommitSize({
        filesChanged: 5,
        insertions: THRESHOLDS.giantLines,
        deletions: 0,
      });
      expect(result.pattern).toBe('giant');
      expect(result.severity).toBe('warning');
    });
  });

  describe('high-deletion-ratio', () => {
    it('flags when deletions dominate', () => {
      const result = analyzeCommitSize({
        filesChanged: 5,
        insertions: 10,
        deletions: 100,
      });
      expect(result.pattern).toBe('high-deletion-ratio');
      expect(result.severity).toBe('warning');
    });

    it('does not flag small deletions', () => {
      const result = analyzeCommitSize({
        filesChanged: 2,
        insertions: 2,
        deletions: 10,
      });
      expect(result.pattern).not.toBe('high-deletion-ratio');
    });
  });

  describe('micro', () => {
    it('flags single-line single-file commits', () => {
      const result = analyzeCommitSize({
        filesChanged: 1,
        insertions: 1,
        deletions: 0,
      });
      expect(result.pattern).toBe('micro');
      expect(result.severity).toBe('info');
    });

    it('does not flag zero-change commits', () => {
      const result = analyzeCommitSize({
        filesChanged: 1,
        insertions: 0,
        deletions: 0,
      });
      expect(result.pattern).not.toBe('micro');
    });

    it('does not flag multi-file small changes', () => {
      const result = analyzeCommitSize({
        filesChanged: 3,
        insertions: 2,
        deletions: 1,
      });
      expect(result.pattern).not.toBe('micro');
    });
  });

  describe('clean', () => {
    it('accepts normal-sized commits', () => {
      const result = analyzeCommitSize({
        filesChanged: 5,
        insertions: 80,
        deletions: 30,
      });
      expect(result.pattern).toBe('clean');
      expect(result.severity).toBe('info');
    });
  });
});
