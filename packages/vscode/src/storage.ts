import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { GitEvent, RoastResult, UserStats, DEFAULT_ACHIEVEMENTS, applyEvent } from '@git-gud/core';

const FRESH_STATS = (): UserStats => ({
  score: 0,
  rank: 'Bronze Committer',
  roastHistory: [],
  achievements: DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a })),
  eventCounts: {},
  streaks: {},
  goodCommitStreak: 0,
});

export class StorageManager {
  private filePath: string;

  constructor(context: vscode.ExtensionContext) {
    const dir = context.globalStorageUri.fsPath;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    this.filePath = path.join(dir, 'stats.json');
  }

  async getStats(): Promise<UserStats> {
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf-8')) as UserStats;
      }
    } catch {}
    return FRESH_STATS();
  }

  async saveStats(stats: UserStats): Promise<void> {
    fs.writeFileSync(this.filePath, JSON.stringify(stats, null, 2), 'utf-8');
  }

  async applyEvent(event: GitEvent): Promise<UserStats> {
    const stats = await this.getStats();
    const updated = applyEvent(event, stats);
    await this.saveStats(updated);
    return updated;
  }

  async appendRoast(roast: RoastResult): Promise<void> {
    const stats = await this.getStats();
    stats.roastHistory = [...stats.roastHistory, roast].slice(-50);
    await this.saveStats(stats);
  }

  async reset(): Promise<void> {
    await this.saveStats(FRESH_STATS());
  }
}
