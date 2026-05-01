import * as vscode from 'vscode';
import { UserStats } from '@git-gud/core';
import { StorageManager } from './storage';

export class DashboardPanel {
  private provider: DashboardViewProvider;

  constructor(context: vscode.ExtensionContext, storage: StorageManager) {
    this.provider = new DashboardViewProvider(storage);
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider('gitGud.dashboard', this.provider),
    );
  }

  show() {
    vscode.commands.executeCommand('gitGud.dashboard.focus');
  }

  refresh(stats: UserStats) {
    this.provider.refresh(stats);
  }
}

class DashboardViewProvider implements vscode.WebviewViewProvider {
  private view: vscode.WebviewView | undefined;
  private currentStats: UserStats | undefined;

  constructor(private storage: StorageManager) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: false };
    this.render();
  }

  async refresh(stats: UserStats) {
    this.currentStats = stats;
    this.render();
  }

  private async render() {
    if (!this.view) return;
    const stats = this.currentStats ?? (await this.storage.getStats());
    this.view.webview.html = this.html(stats);
  }

  private rankColor(rank: string): string {
    const colors: Record<string, string> = {
      'Bronze Committer': '#cd7f32',
      'Silver Rebaser': '#c0c0c0',
      'Gold Pusher': '#ffd700',
      'Platinum Merge Survivor': '#e5e4e2',
      'Diamond Git Wizard': '#b9f2ff',
    };
    return colors[rank] ?? '#fff';
  }

  private html(stats: UserStats): string {
    const recent = stats.roastHistory.slice(-5).reverse();
    const unlocked = stats.achievements.filter((a) => a.unlocked);
    const rankCol = this.rankColor(stats.rank);

    const roastRows = recent.length
      ? recent
          .map(
            (r) => `
        <div class="roast-item">
          <span class="event-tag">${esc(r.eventType.replace(/_/g, ' '))}</span>
          <p class="roast-text">${esc(r.roast)}</p>
          <p class="advice-text">💡 ${esc(r.advice)}</p>
        </div>`,
          )
          .join('')
      : '<p class="muted">No roasts yet. Start committing.</p>';

    const achRows = unlocked.length
      ? unlocked.map((a) => `<div class="ach">🏆 ${esc(a.name)}</div>`).join('')
      : '<p class="muted">No achievements yet. Keep failing.</p>';

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 12px; margin: 0; background: var(--vscode-sideBar-background); }
h2 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: var(--vscode-descriptionForeground); }
.rank { font-size: 22px; font-weight: 700; color: ${rankCol}; margin-bottom: 2px; }
.score { font-size: 12px; color: var(--vscode-descriptionForeground); margin-bottom: 18px; }
.section { margin-bottom: 18px; }
.roast-item { border-left: 2px solid ${rankCol}; padding-left: 8px; margin-bottom: 12px; }
.event-tag { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: var(--vscode-descriptionForeground); }
.roast-text { margin: 3px 0; font-size: 12px; line-height: 1.4; }
.advice-text { margin: 3px 0; font-size: 11px; color: #7ec8a0; line-height: 1.4; }
.ach { font-size: 12px; padding: 4px 0; }
.muted { color: var(--vscode-descriptionForeground); font-size: 12px; font-style: italic; }
</style></head><body>
<div class="section"><h2>Rank</h2><div class="rank">${esc(stats.rank)}</div><div class="score">${stats.score} pts</div></div>
<div class="section"><h2>Recent Offenses</h2>${roastRows}</div>
<div class="section"><h2>Achievements</h2>${achRows}</div>
</body></html>`;
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
