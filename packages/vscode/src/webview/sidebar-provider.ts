import * as vscode from 'vscode';
import { RANK_LADDER, ACHIEVEMENTS, checkAchievements, calculateSuffering, classifyPersonality } from '@git-gud/core';
import type { PlayerState } from '@git-gud/core';
import type { StoredEvent } from '../storage/state-manager';

export interface SidebarData {
  rank: { id: string; name: string; tier: number; threshold: number };
  nextRank: { id: string; name: string; tier: number; threshold: number } | null;
  score: { total: number; delta: number };
  suffering: { score: number; title: string };
  personality: { type: string; description: string };
  achievements: Array<{ id: string; name: string; description: string; unlocked: boolean; progress: number }>;
  eventHistory: StoredEvent[];
  stats: {
    totalCommits: number;
    totalForcePushes: number;
    totalMergeConflicts: number;
    cleanCommitStreak: number;
    longestCleanStreak: number;
    uniqueBranches: number;
    lateNightCommits: number;
    weekendCommits: number;
    commitsInCurrentSession: number;
    totalBranchSwitches: number;
  };
  soundEnabled: boolean;
}

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'gitgud.sidebar';

  private _view?: vscode.WebviewView;
  private _pendingData?: SidebarData;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((msg) => {
      if (msg.type === 'ready' && this._pendingData) {
        this._postState(this._pendingData);
      }
    });
  }

  buildSidebarData(
    playerState: PlayerState,
    eventHistory: StoredEvent[],
    soundEnabled: boolean,
  ): SidebarData {
    const rankIdx = RANK_LADDER.findIndex(r => r.id === playerState.rank.id);
    const nextRank = rankIdx < RANK_LADDER.length - 1 ? RANK_LADDER[rankIdx + 1] : null;

    const statsWithScore = { ...playerState.stats, score: playerState.score.total };
    const achievements = ACHIEVEMENTS.map(def => {
      const result = def.condition(statsWithScore);
      return {
        id: def.id,
        name: def.name,
        description: def.description,
        unlocked: playerState.unlockedAchievements.has(def.id) || result.unlocked,
        progress: result.progress,
      };
    });

    const suffering = calculateSuffering(statsWithScore);
    const personality = classifyPersonality(statsWithScore);

    return {
      rank: playerState.rank,
      nextRank,
      score: playerState.score,
      suffering,
      personality,
      achievements,
      eventHistory,
      stats: {
        totalCommits: playerState.stats.totalCommits,
        totalForcePushes: playerState.stats.totalForcePushes,
        totalMergeConflicts: playerState.stats.totalMergeConflicts,
        cleanCommitStreak: playerState.stats.cleanCommitStreak,
        longestCleanStreak: playerState.stats.longestCleanStreak,
        uniqueBranches: playerState.stats.uniqueBranches.size,
        lateNightCommits: playerState.stats.lateNightCommits,
        weekendCommits: playerState.stats.weekendCommits,
        commitsInCurrentSession: playerState.stats.commitsInCurrentSession,
        totalBranchSwitches: playerState.stats.totalBranchSwitches,
      },
      soundEnabled,
    };
  }

  updateState(data: SidebarData): void {
    this._pendingData = data;
    if (this._view) {
      this._postState(data);
    }
  }

  postMessage(msg: unknown): void {
    if (this._view) {
      this._view.webview.postMessage(msg);
    }
  }

  focus(): void {
    if (this._view) {
      this._view.show(true);
    }
  }

  private _postState(data: SidebarData): void {
    this._view?.webview.postMessage({ type: 'updateState', data });
  }

  private _getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();

    return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';" />
<style nonce="${nonce}">
:root {
  --rank-bronze: #cd7f32;
  --rank-silver: #c0c0c0;
  --rank-gold: #ffd700;
  --rank-platinum: #00cec9;
  --rank-diamond: #00d2ff;
  --positive: #00b894;
  --negative: #e17055;
  --critical: #d63031;
  --accent: #6c5ce7;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: var(--vscode-font-family, sans-serif);
  font-size: var(--vscode-font-size, 13px);
  color: var(--vscode-foreground);
  background: var(--vscode-sideBar-background, var(--vscode-editor-background));
  padding: 0;
  overflow-x: hidden;
}

.container { padding: 12px; }

.card {
  background: var(--vscode-editorWidget-background, var(--vscode-editor-background));
  border: 1px solid var(--vscode-widget-border, var(--vscode-editorWidget-border, transparent));
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
}

.card-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--vscode-descriptionForeground);
  margin-bottom: 8px;
}

/* RANK */
.rank-name {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
}
.rank-score {
  font-size: 22px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.rank-delta {
  font-size: 12px;
  font-weight: 600;
  margin-left: 6px;
}
.rank-delta.positive { color: var(--positive); }
.rank-delta.negative { color: var(--negative); }
.progress-track {
  height: 6px;
  background: var(--vscode-progressBar-background, #333);
  border-radius: 3px;
  margin-top: 8px;
  overflow: hidden;
  opacity: 0.3;
}
.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}
.next-rank {
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  margin-top: 4px;
}

/* SUFFERING */
.suffering-score {
  font-size: 28px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.suffering-title {
  font-size: 13px;
  font-weight: 600;
  font-style: italic;
  margin-top: 2px;
}
.suffering-bar {
  height: 4px;
  background: var(--vscode-progressBar-background, #333);
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
  opacity: 0.3;
}
.suffering-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--positive), var(--rank-gold), var(--negative), var(--critical));
  transition: width 0.5s ease;
}

/* PERSONALITY */
.personality-type {
  font-size: 15px;
  font-weight: 700;
}
.personality-desc {
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
  margin-top: 3px;
  font-style: italic;
}

/* EVENTS */
.event-list { list-style: none; }
.event-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 4px 0;
  border-bottom: 1px solid var(--vscode-widget-border, rgba(255,255,255,0.06));
  font-size: 12px;
}
.event-item:last-child { border-bottom: none; }
.event-icon { flex-shrink: 0; width: 18px; text-align: center; }
.event-type {
  flex-shrink: 0;
  font-weight: 600;
  width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.event-delta {
  flex-shrink: 0;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  width: 40px;
  text-align: right;
}
.event-delta.positive { color: var(--positive); }
.event-delta.negative { color: var(--negative); }
.event-time {
  flex-shrink: 0;
  color: var(--vscode-descriptionForeground);
  font-size: 11px;
  margin-left: auto;
}
.event-roast {
  display: block;
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  padding: 2px 0 2px 24px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.empty-state {
  color: var(--vscode-descriptionForeground);
  font-style: italic;
  font-size: 12px;
  text-align: center;
  padding: 12px 0;
}

/* ACHIEVEMENTS */
.achievement-grid { display: flex; flex-direction: column; gap: 6px; }
.achievement-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.ach-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  background: var(--vscode-badge-background, #333);
  color: var(--vscode-badge-foreground, #fff);
}
.ach-icon.unlocked {
  background: var(--rank-gold);
  color: #000;
}
.ach-info { flex: 1; min-width: 0; }
.ach-name { font-weight: 600; }
.ach-name.locked { opacity: 0.5; }
.ach-desc {
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ach-progress-track {
  width: 100%;
  height: 3px;
  background: var(--vscode-progressBar-background, #333);
  border-radius: 2px;
  margin-top: 2px;
  overflow: hidden;
  opacity: 0.4;
}
.ach-progress-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--accent);
  transition: width 0.4s ease;
}
.ach-count {
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  margin-bottom: 6px;
}

/* STATS */
.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 12px;
}
.stat-item { font-size: 12px; }
.stat-value {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.stat-label {
  color: var(--vscode-descriptionForeground);
  margin-left: 4px;
}

/* LOADING */
.loading {
  text-align: center;
  padding: 40px 12px;
  color: var(--vscode-descriptionForeground);
}
.loading-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 6px;
  color: var(--vscode-foreground);
}
</style>
</head>
<body>
<div class="container" id="root">
  <div class="loading">
    <div class="loading-title">GIT GUD</div>
    <div>Waiting for git activity...</div>
  </div>
</div>

<script nonce="${nonce}">
(function() {
  const vscode = acquireVsCodeApi();
  const root = document.getElementById('root');

  const RANK_COLORS = {
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700',
    platinum: '#00cec9',
    diamond: '#00d2ff',
  };

  const EVENT_ICONS = {
    'commit': '\\u{1F4DD}',
    'branch-switch': '\\u{1F500}',
    'force-push': '\\u{1F4A5}',
    'merge-conflict': '\\u{2694}\\u{FE0F}',
    'rebase': '\\u{1F504}',
    'push': '\\u{1F4E4}',
    'merge': '\\u{1F517}',
  };

  let soundEnabled = true;

  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  }

  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function render(d) {
    const color = RANK_COLORS[d.rank.id] || '#c0c0c0';
    let progress = 0;
    if (d.nextRank) {
      const range = d.nextRank.threshold - d.rank.threshold;
      progress = range > 0 ? Math.min(1, (d.score.total - d.rank.threshold) / range) : 1;
    } else {
      progress = 1;
    }

    const deltaSign = d.score.delta >= 0 ? '+' : '';
    const deltaClass = d.score.delta >= 0 ? 'positive' : 'negative';

    const unlockedCount = d.achievements.filter(a => a.unlocked).length;

    let html = '';

    // RANK CARD
    html += '<div class="card">';
    html += '<div class="card-title">\\u{2694}\\u{FE0F} Rank</div>';
    html += '<div class="rank-name" style="color:' + color + '">' + esc(d.rank.name) + '</div>';
    html += '<div><span class="rank-score">' + d.score.total + '</span>';
    html += '<span class="rank-delta ' + deltaClass + '">' + deltaSign + d.score.delta + '</span></div>';
    html += '<div class="progress-track"><div class="progress-fill" style="width:' + (progress * 100) + '%;background:' + color + '"></div></div>';
    if (d.nextRank) {
      html += '<div class="next-rank">Next: ' + esc(d.nextRank.name) + ' @ ' + d.nextRank.threshold + '</div>';
    } else {
      html += '<div class="next-rank">Max rank achieved</div>';
    }
    html += '</div>';

    // SUFFERING CARD
    html += '<div class="card">';
    html += '<div class="card-title">\\u{1F480} Teammate Suffering</div>';
    html += '<div class="suffering-score">' + d.suffering.score + '<span style="font-size:14px;opacity:0.5">/100</span></div>';
    html += '<div class="suffering-title">"' + esc(d.suffering.title) + '"</div>';
    html += '<div class="suffering-bar"><div class="suffering-fill" style="width:' + d.suffering.score + '%"></div></div>';
    html += '</div>';

    // PERSONALITY CARD
    html += '<div class="card">';
    html += '<div class="card-title">\\u{1F9E0} Personality</div>';
    html += '<div class="personality-type">' + esc(d.personality.type) + '</div>';
    html += '<div class="personality-desc">' + esc(d.personality.description) + '</div>';
    html += '</div>';

    // RECENT OFFENSES
    html += '<div class="card">';
    html += '<div class="card-title">\\u{1F4CB} Recent Offenses</div>';
    if (d.eventHistory.length === 0) {
      html += '<div class="empty-state">No offenses recorded yet. Go commit something.</div>';
    } else {
      html += '<ul class="event-list">';
      for (const e of d.eventHistory.slice(0, 15)) {
        const icon = EVENT_ICONS[e.type] || '\\u{2022}';
        const edelta = e.scoreDelta >= 0 ? '+' + e.scoreDelta : '' + e.scoreDelta;
        const edeltaClass = e.scoreDelta >= 0 ? 'positive' : 'negative';
        html += '<li>';
        html += '<div class="event-item">';
        html += '<span class="event-icon">' + icon + '</span>';
        html += '<span class="event-type">' + esc(e.type) + '</span>';
        html += '<span class="event-delta ' + edeltaClass + '">' + edelta + '</span>';
        html += '<span class="event-time">' + timeAgo(e.timestamp) + '</span>';
        html += '</div>';
        if (e.roastExcerpt) {
          html += '<div class="event-roast">' + esc(e.roastExcerpt) + '</div>';
        }
        html += '</li>';
      }
      html += '</ul>';
    }
    html += '</div>';

    // ACHIEVEMENTS
    html += '<div class="card">';
    html += '<div class="card-title">\\u{1F3C6} Achievements</div>';
    html += '<div class="ach-count">' + unlockedCount + ' / ' + d.achievements.length + ' unlocked</div>';
    html += '<div class="achievement-grid">';
    const sorted = [...d.achievements].sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0) || b.progress - a.progress);
    for (const a of sorted) {
      html += '<div class="achievement-row">';
      html += '<div class="ach-icon ' + (a.unlocked ? 'unlocked' : '') + '">' + (a.unlocked ? '\\u{2713}' : '\\u{1F512}') + '</div>';
      html += '<div class="ach-info">';
      html += '<div class="ach-name ' + (a.unlocked ? '' : 'locked') + '">' + esc(a.name) + '</div>';
      html += '<div class="ach-desc">' + esc(a.description) + '</div>';
      if (!a.unlocked) {
        html += '<div class="ach-progress-track"><div class="ach-progress-fill" style="width:' + (a.progress * 100) + '%"></div></div>';
      }
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';

    // STATS
    html += '<div class="card">';
    html += '<div class="card-title">\\u{1F4CA} Stats</div>';
    html += '<div class="stat-grid">';
    const stats = [
      [d.stats.totalCommits, 'Commits'],
      [d.stats.totalForcePushes, 'Force Pushes'],
      [d.stats.totalMergeConflicts, 'Merge Conflicts'],
      [d.stats.totalBranchSwitches, 'Branch Switches'],
      [d.stats.uniqueBranches, 'Unique Branches'],
      [d.stats.cleanCommitStreak, 'Clean Streak'],
      [d.stats.longestCleanStreak, 'Best Streak'],
      [d.stats.commitsInCurrentSession, 'Session Commits'],
      [d.stats.lateNightCommits, 'Late Night'],
      [d.stats.weekendCommits, 'Weekend'],
    ];
    for (const [val, label] of stats) {
      html += '<div class="stat-item"><span class="stat-value">' + val + '</span><span class="stat-label">' + label + '</span></div>';
    }
    html += '</div>';
    html += '</div>';

    root.innerHTML = html;
  }

  // Web Audio API sound synthesis
  function playSound(type) {
    if (!soundEnabled) return;
    try {
      const ctx = new AudioContext();
      switch (type) {
        case 'rank-up': {
          const notes = [523, 659, 784, 1047];
          notes.forEach((freq, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'square';
            o.frequency.value = freq;
            o.connect(g);
            g.connect(ctx.destination);
            g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.1);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.2);
            o.start(ctx.currentTime + i * 0.1);
            o.stop(ctx.currentTime + i * 0.1 + 0.2);
          });
          break;
        }
        case 'rank-down': {
          const notes = [523, 466, 415, 349];
          notes.forEach((freq, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sawtooth';
            o.frequency.value = freq;
            o.connect(g);
            g.connect(ctx.destination);
            g.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.12);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.25);
            o.start(ctx.currentTime + i * 0.12);
            o.stop(ctx.currentTime + i * 0.12 + 0.25);
          });
          break;
        }
        case 'achievement': {
          [523, 659, 784].forEach((freq) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.frequency.value = freq;
            o.connect(g);
            g.connect(ctx.destination);
            g.gain.setValueAtTime(0.12, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            o.start(ctx.currentTime);
            o.stop(ctx.currentTime + 0.5);
          });
          break;
        }
        case 'critical': {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'square';
          o.frequency.value = 120;
          o.connect(g);
          g.connect(ctx.destination);
          g.gain.setValueAtTime(0.2, ctx.currentTime);
          g.gain.setValueAtTime(0.0, ctx.currentTime + 0.08);
          g.gain.setValueAtTime(0.2, ctx.currentTime + 0.12);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          o.start(ctx.currentTime);
          o.stop(ctx.currentTime + 0.3);
          break;
        }
        case 'event': {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = 880;
          o.connect(g);
          g.connect(ctx.destination);
          g.gain.setValueAtTime(0.1, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
          o.start(ctx.currentTime);
          o.stop(ctx.currentTime + 0.12);
          break;
        }
      }
    } catch (_) {}
  }

  window.addEventListener('message', (ev) => {
    const msg = ev.data;
    if (msg.type === 'updateState') {
      soundEnabled = msg.data.soundEnabled;
      render(msg.data);
    } else if (msg.type === 'playSound') {
      playSound(msg.sound);
    }
  });

  vscode.postMessage({ type: 'ready' });
})();
</script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}
