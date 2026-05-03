import * as vscode from 'vscode';
import { RANK_LADDER, checkAchievements, classifyPersonality } from '@git-gud/core';
import type { PlayerState } from '@git-gud/core';
import type { StoredEvent } from '../storage/state-manager';
import type { SourceControlSnapshot } from '../git/source-control';

export interface SidebarData {
  rank: { id: string; name: string; tier: number; threshold: number };
  nextRank: { id: string; name: string; tier: number; threshold: number } | null;
  score: { total: number; delta: number };
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
  aiProvider: 'ollama' | 'gemini' | 'claude' | 'openai' | 'xai';
  ollamaApiKey: string;
  ollamaModel: string;
  ollamaBaseUrl: string;
  geminiApiKey: string;
  geminiModel: string;
  claudeApiKey: string;
  claudeModel: string;
  openaiApiKey: string;
  openaiModel: string;
  xaiApiKey: string;
  xaiModel: string;
  commitMessageStyle: 'clean' | 'savage';
  sourceControl: SourceControlSnapshot;
  collapsed: Record<string, boolean>;
}

export type SidebarMessage =
  | { type: 'ready' }
  | { type: 'runCommand'; command: string }
  | { type: 'saveSettings'; aiProvider: string; ollamaApiKey: string; ollamaModel: string; ollamaBaseUrl: string; geminiApiKey: string; geminiModel: string; claudeApiKey: string; claudeModel: string; openaiApiKey: string; openaiModel: string; xaiApiKey: string; xaiModel: string; commitMessageStyle: string }
  | { type: 'sc:generate' }
  | { type: 'sc:commit'; message: string; push?: boolean; amend?: boolean }
  | { type: 'sc:pullAndPush' }
  | { type: 'sc:checkout'; branchFull: string; isRemote: boolean }
  | { type: 'toggleCollapsed'; key: string; collapsed: boolean };

export interface SidebarHandlers {
  onSCGenerate: () => Promise<void>;
  onSCCommit: (message: string, push: boolean, amend: boolean) => Promise<void>;
  onSCPullAndPush: () => Promise<void>;
  onSCCheckout: (branchFull: string, isRemote: boolean) => Promise<void>;
  onCollapsedChange: (key: string, collapsed: boolean) => void;
}

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'gitgud.sidebar';

  private _view?: vscode.WebviewView;
  private _pendingData?: SidebarData;
  private _handlers?: SidebarHandlers;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  setHandlers(h: SidebarHandlers): void {
    this._handlers = h;
  }

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

    webviewView.webview.onDidReceiveMessage(async (msg: SidebarMessage) => {
      if (msg.type === 'ready' && this._pendingData) {
        this._postState(this._pendingData);
      } else if (msg.type === 'runCommand') {
        vscode.commands.executeCommand(msg.command);
      } else if (msg.type === 'saveSettings') {
        const cfg = vscode.workspace.getConfiguration('gitgud');
        await cfg.update('aiProvider', msg.aiProvider || 'gemini', true);
        await cfg.update('ollamaApiKey', msg.ollamaApiKey || '', true);
        await cfg.update('ollamaModel', msg.ollamaModel || '', true);
        await cfg.update('ollamaBaseUrl', msg.ollamaBaseUrl || '', true);
        await cfg.update('geminiApiKey', msg.geminiApiKey || '', true);
        await cfg.update('geminiModel', msg.geminiModel || 'gemini-2.5-flash', true);
        await cfg.update('claudeApiKey', msg.claudeApiKey || '', true);
        await cfg.update('claudeModel', msg.claudeModel || 'claude-sonnet-4-6', true);
        await cfg.update('openaiApiKey', msg.openaiApiKey || '', true);
        await cfg.update('openaiModel', msg.openaiModel || 'gpt-4o-mini', true);
        await cfg.update('xaiApiKey', msg.xaiApiKey || '', true);
        await cfg.update('xaiModel', msg.xaiModel || 'grok-3-mini', true);
        await cfg.update('commitMessageStyle', msg.commitMessageStyle || 'clean', true);
      } else if (msg.type === 'sc:generate') {
        await this._handlers?.onSCGenerate();
      } else if (msg.type === 'sc:commit') {
        await this._handlers?.onSCCommit(msg.message, !!msg.push, !!msg.amend);
      } else if (msg.type === 'sc:pullAndPush') {
        await this._handlers?.onSCPullAndPush();
      } else if (msg.type === 'sc:checkout') {
        await this._handlers?.onSCCheckout(msg.branchFull, msg.isRemote);
      } else if (msg.type === 'toggleCollapsed') {
        this._handlers?.onCollapsedChange(msg.key, msg.collapsed);
      }
    });
  }

  buildSidebarData(
    playerState: PlayerState,
    eventHistory: StoredEvent[],
    configFields: { aiProvider: 'ollama' | 'gemini' | 'claude' | 'openai' | 'xai'; ollamaApiKey: string; ollamaModel: string; ollamaBaseUrl: string; geminiApiKey: string; geminiModel: string; claudeApiKey: string; claudeModel: string; openaiApiKey: string; openaiModel: string; xaiApiKey: string; xaiModel: string; commitMessageStyle: 'clean' | 'savage' },
    sourceControl: SourceControlSnapshot,
    collapsed: Record<string, boolean>,
  ): SidebarData {
    const rankIdx = RANK_LADDER.findIndex(r => r.id === playerState.rank.id);
    const nextRank = rankIdx < RANK_LADDER.length - 1 ? RANK_LADDER[rankIdx + 1] : null;

    const statsWithScore = { ...playerState.stats, score: playerState.score.total };
    const achievements = checkAchievements(statsWithScore, playerState.unlockedAchievements);
    const personality = classifyPersonality(statsWithScore);

    return {
      rank: playerState.rank,
      nextRank,
      score: playerState.score,
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
      soundEnabled: true,
      aiProvider: configFields.aiProvider,
      ollamaApiKey: configFields.ollamaApiKey,
      ollamaModel: configFields.ollamaModel,
      ollamaBaseUrl: configFields.ollamaBaseUrl,
      geminiApiKey: configFields.geminiApiKey,
      geminiModel: configFields.geminiModel,
      claudeApiKey: configFields.claudeApiKey,
      claudeModel: configFields.claudeModel,
      openaiApiKey: configFields.openaiApiKey,
      openaiModel: configFields.openaiModel,
      xaiApiKey: configFields.xaiApiKey,
      xaiModel: configFields.xaiModel,
      commitMessageStyle: configFields.commitMessageStyle,
      sourceControl,
      collapsed,
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

  private _getHtml(_webview: vscode.Webview): string {
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
  --bg: #0a0a0b;
  --panel: #111114;
  --panel-2: #15151a;
  --ink: #ededee;
  --ink-2: #c4c4c8;
  --mute: #8a8a92;
  --line: #1f1f24;
  --accent: #c8ff00;
  --accent-2: #d6ff3a;
  --hot: #ff3d6a;
  --positive: #c8ff00;
  --negative: #ff3d6a;
  --critical: #ff3d6a;
  --rank-bronze: #cd7f32;
  --rank-silver: #c0c0c0;
  --rank-gold: #ffd700;
  --rank-platinum: #00cec9;
  --rank-diamond: #c8ff00;
  --mono: ui-monospace, "JetBrains Mono", "Fira Code", "SF Mono", Menlo, Consolas, monospace;
  --sans: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: var(--sans);
  font-size: 13px;
  color: var(--ink);
  background: var(--bg);
  background-image:
    radial-gradient(900px 500px at 100% -10%, rgba(200, 255, 0, 0.06), transparent 60%),
    radial-gradient(700px 420px at -20% 30%, rgba(255, 61, 106, 0.05), transparent 60%);
  background-attachment: fixed;
  padding: 0;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

.container { padding: 12px; }

.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 10px;
}

.card-title {
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--mute);
  margin-bottom: 10px;
}

.card-header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  cursor: pointer;
  user-select: none;
}
.card-header .card-title {
  text-align: center;
  margin-bottom: 0;
  grid-column: 1 / 2;
  padding-left: 18px;
}
.card-header .chev {
  display: inline-block;
  width: 18px;
  text-align: center;
  font-size: 10px;
  line-height: 1;
  transition: transform 0.15s ease;
  color: var(--mute);
}
.card-header.collapsed .chev { transform: rotate(-90deg); }
.card-header:hover .chev { color: var(--accent); }
.card-body {
  overflow: hidden;
  max-height: 4000px;
  opacity: 1;
  transition: max-height 0.28s ease, opacity 0.2s ease, margin-top 0.28s ease;
}
.card-body.collapsed {
  max-height: 0 !important;
  opacity: 0;
  margin-top: 0 !important;
  pointer-events: none;
}

/* RANK */
.rank-name { font-size: 17px; font-weight: 800; letter-spacing: -0.01em; margin-bottom: 6px; }
.rank-score { font-size: 26px; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; color: var(--ink); }
.rank-delta { font-family: var(--mono); font-size: 12px; font-weight: 700; margin-left: 8px; }
.rank-delta.positive { color: var(--accent); }
.rank-delta.negative { color: var(--hot); }
.progress-track { height: 4px; background: var(--line); border-radius: 999px; margin-top: 10px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 999px; transition: width 0.5s ease; box-shadow: 0 0 12px -2px currentColor; }
.next-rank { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.05em; color: var(--mute); margin-top: 8px; text-transform: uppercase; }

/* PERSONALITY */
.personality-type { font-size: 16px; font-weight: 800; letter-spacing: -0.01em; }
.personality-desc { font-size: 12.5px; color: var(--ink-2); margin-top: 4px; font-style: italic; }

/* SOURCE CONTROL */
.sc-message-wrap {
  position: relative;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 6px;
  transition: border-color 0.15s ease;
}
.sc-message-wrap:focus-within { border-color: var(--accent); }
.sc-input {
  display: block;
  width: 100%;
  min-height: 56px;
  padding: 8px 10px 32px 10px;
  font-size: 12.5px;
  line-height: 1.45;
  font-family: var(--mono);
  color: var(--ink);
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  overflow: hidden;
  box-sizing: border-box;
}
.sc-input::placeholder { color: var(--mute); }
.sc-input:disabled { opacity: 0.6; }
.sc-generate {
  position: absolute;
  right: 5px;
  bottom: 5px;
  padding: 3px 10px;
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.4;
  font-family: var(--mono);
  letter-spacing: 0.05em;
  color: var(--ink);
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.sc-generate:hover:not(:disabled) { background: var(--accent); color: var(--bg); border-color: var(--accent); }
.sc-generate:disabled { opacity: 0.4; cursor: not-allowed; }
.sc-btn {
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 700;
  font-family: var(--mono);
  letter-spacing: 0.02em;
  color: var(--bg);
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, transform 0.08s;
}
.sc-btn:hover:not(:disabled) { background: var(--accent-2); }
.sc-btn:active:not(:disabled) { transform: translateY(1px); }
.sc-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.sc-btn.secondary {
  color: var(--ink);
  background: transparent;
  border: 1px solid var(--line);
}
.sc-btn.secondary:hover:not(:disabled) { background: var(--panel-2); border-color: var(--mute); }
.sc-commit-row { display: flex; margin-top: 10px; }
.sc-commit-main {
  flex: 1;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.sc-commit-caret {
  width: 28px;
  padding: 0;
  border-left: 1px solid rgba(10,10,11,0.25);
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
.sc-menu { position: relative; }
.sc-menu-pop {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 6px;
  box-shadow: 0 8px 24px -8px rgba(0,0,0,0.6);
  z-index: 10;
  min-width: 180px;
  display: none;
  overflow: hidden;
}
.sc-menu-pop.open { display: block; }
.sc-menu-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  font-size: 12px;
  font-family: var(--sans);
  color: var(--ink);
  background: transparent;
  border: none;
  cursor: pointer;
}
.sc-menu-item:hover { background: var(--bg); color: var(--accent); }
.sc-branch-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.sc-branch-label { font-family: var(--mono); font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--mute); flex-shrink: 0; }
.sc-select {
  flex: 1; min-width: 0;
  padding: 6px 8px;
  font-size: 12px;
  font-family: var(--mono);
  color: var(--ink);
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 6px;
  outline: none;
  transition: border-color 0.15s;
}
.sc-select:focus { border-color: var(--accent); }
.sc-select { appearance: none; -webkit-appearance: none; background-image: linear-gradient(45deg, transparent 50%, var(--mute) 50%), linear-gradient(135deg, var(--mute) 50%, transparent 50%); background-position: calc(100% - 14px) 50%, calc(100% - 9px) 50%; background-size: 5px 5px, 5px 5px; background-repeat: no-repeat; padding-right: 24px; }

/* Native dropdown popup styling (Electron/Chromium) */
select option, select optgroup {
  background: var(--panel-2);
  color: var(--ink);
  font-family: var(--mono);
  font-size: 12px;
  padding: 6px 8px;
}
select optgroup {
  color: var(--mute);
  font-style: normal;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 10px;
}
select option:checked, select option:hover {
  background: var(--accent) linear-gradient(0deg, var(--accent), var(--accent));
  color: var(--bg);
}
.sc-changes {
  margin-top: 12px;
  border-top: 1px solid var(--line);
  padding-top: 10px;
}
.sc-changes-title {
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--mute);
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
}
.sc-change-list { list-style: none; max-height: 180px; overflow-y: auto; }
.sc-change-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
  font-size: 12px;
  font-family: var(--mono);
}
.sc-change-status {
  flex-shrink: 0;
  width: 14px;
  text-align: center;
  font-weight: 700;
}
.sc-change-status.M { color: #e2c08d; }
.sc-change-status.A { color: var(--accent); }
.sc-change-status.D { color: var(--hot); }
.sc-change-status.U, .sc-change-status\\?\\? { color: var(--accent); }
.sc-change-status.C { color: var(--hot); }
.sc-change-path {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--ink-2);
}
.sc-error {
  margin-top: 8px;
  font-size: 11.5px;
  font-family: var(--mono);
  color: var(--hot);
  word-break: break-word;
}
.sc-empty {
  font-size: 11.5px;
  color: var(--mute);
  font-style: italic;
  padding: 4px 0;
}
.sc-pullretry {
  margin-top: 8px;
  font-size: 11.5px;
  color: var(--hot);
  display: flex;
  gap: 8px;
  align-items: center;
}

/* EVENTS */
.event-scroll {
  max-height: 460px;
  overflow-y: auto;
  margin: 0 -6px;
  padding: 0 6px;
}
.event-scroll::-webkit-scrollbar { width: 8px; }
.event-scroll::-webkit-scrollbar-track { background: transparent; }
.event-scroll::-webkit-scrollbar-thumb { background: var(--line); border-radius: 999px; }
.event-scroll::-webkit-scrollbar-thumb:hover { background: var(--mute); }
.event-list { list-style: none; }
.event-row {
  padding: 12px 0;
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  transition: background 0.12s ease;
  margin: 0 -6px;
  padding-left: 6px;
  padding-right: 6px;
  border-radius: 4px;
}
.event-row:hover { background: var(--panel-2); }
.event-row:last-child { border-bottom: none; }
.event-item {
  display: flex; align-items: center; gap: 10px;
  font-size: 12px;
}
.event-icon { flex-shrink: 0; width: 18px; text-align: center; font-size: 14px; }
.event-type {
  flex-shrink: 0; font-family: var(--mono); font-weight: 600;
  font-size: 11.5px; letter-spacing: 0.02em;
  width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: var(--ink);
}
.event-delta {
  flex-shrink: 0; font-family: var(--mono); font-weight: 700;
  font-variant-numeric: tabular-nums; min-width: 44px; text-align: right;
  font-size: 12px;
}
.event-delta.positive { color: var(--accent); }
.event-delta.negative { color: var(--hot); }
.event-time { flex-shrink: 0; font-family: var(--mono); color: var(--mute); font-size: 10.5px; margin-left: auto; }
.event-roast {
  display: block; font-size: 12px; color: var(--ink-2);
  line-height: 1.5;
  padding: 8px 0 0 28px;
  font-style: italic;
}
.event-roast.truncated {
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.event-expand {
  margin: 10px 0 4px 28px;
  padding: 0;
  background: none;
  border: none;
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--mute);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 0.12s;
}
.event-expand:hover { color: var(--accent); }
.event-expand .icon { font-size: 11px; }
.event-advice {
  margin: 8px 0 4px 28px;
  padding: 10px 12px;
  background: rgba(200, 255, 0, 0.05);
  border: 1px solid rgba(200, 255, 0, 0.15);
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--ink-2);
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.event-advice .icon { color: var(--accent); font-size: 14px; flex-shrink: 0; margin-top: 2px; }
.empty-state { color: var(--mute); font-style: italic; font-size: 12px; text-align: center; padding: 16px 0; }

/* ACHIEVEMENTS */
.achievement-grid { display: flex; flex-direction: column; gap: 8px; }
.achievement-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
.ach-icon {
  flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; background: var(--panel-2); color: var(--mute);
  border: 1px solid var(--line);
}
.ach-icon.unlocked { background: var(--accent); color: var(--bg); border-color: var(--accent); box-shadow: 0 0 12px -4px var(--accent); }
.ach-info { flex: 1; min-width: 0; }
.ach-name { font-weight: 700; font-size: 12.5px; color: var(--ink); }
.ach-name.locked { color: var(--mute); font-weight: 600; }
.ach-desc { font-size: 11.5px; color: var(--mute); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
.ach-progress-track { width: 100%; height: 2px; background: var(--line); border-radius: 999px; margin-top: 4px; overflow: hidden; }
.ach-progress-fill { height: 100%; border-radius: 999px; background: var(--accent); transition: width 0.4s ease; }
.ach-count { font-family: var(--mono); font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--mute); margin-bottom: 10px; }

/* STATS */
.stat-grid { display: flex; flex-direction: column; }
.stat-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 0;
  font-size: 12.5px;
  border-bottom: 1px solid var(--line);
}
.stat-item:last-child { border-bottom: none; }
.stat-label {
  font-family: var(--mono);
  color: var(--mute);
  font-size: 11.5px;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.stat-value {
  font-family: var(--mono);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  color: var(--ink);
  flex-shrink: 0;
}

/* SETTINGS */
.settings-field { margin-bottom: 12px; }
.settings-label {
  display: block;
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 5px;
  color: var(--mute);
}
.settings-input, .settings-select {
  width: 100%; padding: 7px 9px; font-size: 12px;
  font-family: var(--mono);
  color: var(--ink);
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 6px; outline: none;
  transition: border-color 0.15s;
}
.settings-input:focus, .settings-select:focus { border-color: var(--accent); }
.settings-select { appearance: none; -webkit-appearance: none; background-image: linear-gradient(45deg, transparent 50%, var(--mute) 50%), linear-gradient(135deg, var(--mute) 50%, transparent 50%); background-position: calc(100% - 14px) 50%, calc(100% - 9px) 50%; background-size: 5px 5px, 5px 5px; background-repeat: no-repeat; padding-right: 24px; }
.settings-input::placeholder { color: var(--mute); }
.settings-hint { font-family: var(--mono); font-size: 10px; color: var(--mute); margin-top: 4px; opacity: 0.8; }
.settings-save {
  margin-top: 6px; padding: 8px 16px; font-size: 11.5px; font-weight: 700;
  font-family: var(--mono); letter-spacing: 0.05em;
  color: var(--bg); background: var(--accent);
  border: 1px solid var(--accent); border-radius: 6px; cursor: pointer;
  transition: background 0.15s;
}
.settings-save:hover { background: var(--accent-2); }
.settings-saved { font-family: var(--mono); font-size: 11px; color: var(--accent); margin-left: 10px; opacity: 0; transition: opacity 0.3s ease; }
.settings-saved.show { opacity: 1; }
.settings-status { font-family: var(--mono); font-size: 11px; margin-top: 10px; }
.settings-status.connected { color: var(--accent); }
.settings-status.disconnected { color: var(--mute); }

/* ACTIONS */
.action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.action-btn {
  padding: 9px 10px; font-size: 11.5px; font-weight: 700;
  font-family: var(--mono); letter-spacing: 0.05em;
  color: var(--ink);
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 6px; cursor: pointer; text-align: center;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  min-width: 0; transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.action-btn:hover { background: var(--bg); border-color: var(--accent); color: var(--accent); }
.action-btn.danger { color: var(--hot); border-color: rgba(255,61,106,0.35); }
.action-btn.danger:hover { background: rgba(255,61,106,0.08); border-color: var(--hot); color: var(--hot); }

/* ICONS */
.icon {
  display: inline-block;
  vertical-align: -0.18em;
  width: 1em;
  height: 1em;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
  flex-shrink: 0;
}
.card-title .icon { font-size: 13px; margin-right: 4px; color: var(--accent); }
.event-icon .icon { font-size: 14px; color: var(--mute); }
.event-icon.danger .icon { color: var(--hot); }
.event-icon.warn .icon { color: #e2c08d; }
.ach-icon .icon { font-size: 12px; vertical-align: -0.15em; }
.status-icon { font-size: 13px; vertical-align: -0.18em; margin-right: 4px; }

/* LOADING */
.loading { text-align: center; padding: 56px 12px; color: var(--mute); }
.loading-title {
  font-family: var(--mono); font-size: 14px; font-weight: 800;
  letter-spacing: 0.2em; margin-bottom: 8px; color: var(--accent);
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

  const RANK_COLORS = { bronze: '#cd7f32', silver: '#c0c0c0', gold: '#ffd700', platinum: '#00cec9', diamond: '#c8ff00' };

  // Lucide-style icon paths (24x24 viewBox, stroke=currentColor)
  const ICONS = {
    swords: '<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" y1="14" x2="9" y2="18"/><line x1="7" y1="17" x2="4" y2="20"/><line x1="3" y1="19" x2="5" y2="21"/>',
    branch: '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    brain: '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>',
    scroll: '<path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    commit: '<circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/>',
    shuffle: '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    rotate: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    merge: '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    warn: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    chevron: '<polyline points="6 9 12 15 18 9"/>',
    chevronUp: '<polyline points="18 15 12 9 6 15"/>',
    bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    dot: '<circle cx="12" cy="12" r="2"/>',
  };
  function svgIcon(name, extraClass) {
    const path = ICONS[name] || ICONS.dot;
    const cls = 'icon' + (extraClass ? ' ' + extraClass : '');
    return '<svg class="' + cls + '" viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>';
  }
  const EVENT_ICONS = {
    'commit': 'commit', 'branch-switch': 'shuffle', 'force-push': 'flame',
    'merge-conflict': 'swords', 'rebase': 'rotate', 'push': 'upload', 'merge': 'merge',
  };
  const EVENT_ICON_TONE = {
    'force-push': 'danger', 'merge-conflict': 'danger', 'commit': 'warn',
  };

  let state = null;
  let soundEnabled = true;
  // Local UI state preserved across re-renders:
  let scMessage = '';
  let scGenerating = false;
  let scError = '';
  let scShowPullRetry = false;
  let scMenuOpen = false;
  let scLastError = '';
  // Per-event expanded state (keyed by index in current eventHistory)
  let eventExpanded = {};

  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  }
  function esc(str) { const d = document.createElement('div'); d.textContent = str == null ? '' : String(str); return d.innerHTML; }

  function collapsibleHeader(key, iconName, title, collapsed) {
    return '<div class="card-header ' + (collapsed ? 'collapsed' : '') + '" data-collapse-key="' + key + '">' +
      '<span class="card-title">' + svgIcon(iconName) + title + '</span>' +
      '<span class="chev">' + svgIcon('chevron') + '</span>' +
    '</div>';
  }

  function renderRankCard(d) {
    const color = RANK_COLORS[d.rank.id] || '#c0c0c0';
    let progress = 0;
    if (d.nextRank) {
      const range = d.nextRank.threshold - d.rank.threshold;
      progress = range > 0 ? Math.min(1, (d.score.total - d.rank.threshold) / range) : 1;
    } else { progress = 1; }
    const deltaSign = d.score.delta >= 0 ? '+' : '';
    const deltaClass = d.score.delta >= 0 ? 'positive' : 'negative';
    let h = '<div class="card">';
    h += '<div class="card-title">' + svgIcon('swords') + 'Rank</div>';
    h += '<div class="rank-name" style="color:' + color + '">' + esc(d.rank.name) + '</div>';
    h += '<div><span class="rank-score">' + d.score.total + '</span>';
    h += '<span class="rank-delta ' + deltaClass + '">' + deltaSign + d.score.delta + '</span></div>';
    h += '<div class="progress-track"><div class="progress-fill" style="width:' + (progress * 100) + '%;background:' + color + '"></div></div>';
    h += d.nextRank ? '<div class="next-rank">Next: ' + esc(d.nextRank.name) + ' @ ' + d.nextRank.threshold + '</div>' : '<div class="next-rank">Max rank achieved</div>';
    h += '</div>';
    return h;
  }

  function renderSourceControl(d) {
    const sc = d.sourceControl;
    if (!sc || !sc.available) return '';
    const collapsed = !!d.collapsed['sc'];
    let h = '<div class="card">';
    h += collapsibleHeader('sc', 'branch', 'Source Control', collapsed);
    h += '<div class="card-body ' + (collapsed ? 'collapsed' : '') + '" style="margin-top:36px">';

    // Branch picker
    h += '<div class="sc-branch-row">';
    h += '<span class="sc-branch-label">Branch</span>';
    h += '<select class="sc-select" id="sc-branch">';
    const current = sc.branch || '';
    h += '<option value="" ' + (current ? '' : 'selected') + ' disabled>(detached)</option>';
    if (sc.branches.length === 0 && current) {
      h += '<option value="L:' + esc(current) + '" selected>' + esc(current) + '</option>';
    }
    const locals = sc.branches.filter(b => !b.isRemote);
    const remotes = sc.branches.filter(b => b.isRemote);
    if (locals.length > 0) {
      h += '<optgroup label="Local">';
      for (const b of locals) {
        const isActive = b.name === current;
        h += '<option value="L:' + esc(b.full) + '" ' + (isActive ? 'selected' : '') + '>' + (isActive ? '\\u2605 ' : '') + esc(b.name) + '</option>';
      }
      h += '</optgroup>';
    }
    if (remotes.length > 0) {
      h += '<optgroup label="Remote">';
      for (const b of remotes) {
        h += '<option value="R:' + esc(b.full) + '">' + esc(b.full) + '</option>';
      }
      h += '</optgroup>';
    }
    h += '</select>';
    h += '</div>';

    // Message + Generate
    const hasChanges = sc.changes.length > 0;
    const hasKey = !!(d[d.aiProvider + 'ApiKey']);
    const genDisabled = !hasChanges || !hasKey || scGenerating;
    h += '<div class="sc-message-wrap">';
    h += '<textarea class="sc-input" id="sc-message" rows="2" placeholder="Message (' + (d.commitMessageStyle === 'savage' ? 'savage' : 'clean') + ')" ' + (scGenerating ? 'disabled' : '') + '>' + esc(scMessage) + '</textarea>';
    h += '<button class="sc-generate" id="sc-generate" ' + (genDisabled ? 'disabled' : '') + ' title="' + (hasKey ? 'Generate commit message from diff (overwrites current)' : 'Set an AI key in Settings') + '">' + (scGenerating ? 'Generating\\u2026' : 'Generate') + '</button>';
    h += '</div>';
    if (scError) {
      h += '<div class="sc-error">' + esc(scError) + '</div>';
    }

    // Commit split-button
    const commitDisabled = !hasChanges || scGenerating;
    h += '<div class="sc-commit-row sc-menu">';
    h += '<button class="sc-btn sc-commit-main" id="sc-commit" ' + (commitDisabled ? 'disabled' : '') + '>' + svgIcon('check') + ' Commit</button>';
    h += '<button class="sc-btn sc-commit-caret" id="sc-commit-caret" ' + (commitDisabled ? 'disabled' : '') + ' title="More commit actions">' + svgIcon('chevron') + '</button>';
    h += '<div class="sc-menu-pop ' + (scMenuOpen ? 'open' : '') + '" id="sc-menu-pop">';
    h += '<button class="sc-menu-item" data-commit-action="commit-push">Commit &amp; Push</button>';
    h += '<button class="sc-menu-item" data-commit-action="amend">Amend Last Commit</button>';
    h += '</div>';
    h += '</div>';

    if (scShowPullRetry) {
      h += '<div class="sc-pullretry"><span>Push rejected (remote ahead).</span><button class="sc-btn secondary" id="sc-pullretry-btn">Pull &amp; Retry</button></div>';
    }

    // Changes
    h += '<div class="sc-changes">';
    h += '<div class="sc-changes-title"><span>' + svgIcon('chevron') + ' Changes</span><span>' + sc.changes.length + '</span></div>';
    if (sc.changes.length === 0) {
      h += '<div class="sc-empty">Working tree clean.</div>';
    } else {
      h += '<ul class="sc-change-list">';
      for (const c of sc.changes.slice(0, 200)) {
        h += '<li class="sc-change-item">';
        h += '<span class="sc-change-status ' + esc(c.status) + '">' + esc(c.status) + '</span>';
        h += '<span class="sc-change-path" title="' + esc(c.path) + '">' + esc(c.path) + '</span>';
        h += '</li>';
      }
      h += '</ul>';
    }
    h += '</div>';

    h += '</div></div>';
    return h;
  }

  function renderPersonality(d) {
    let h = '<div class="card">';
    h += '<div class="card-title">' + svgIcon('brain') + 'Personality</div>';
    h += '<div class="personality-type">' + esc(d.personality.type) + '</div>';
    h += '<div class="personality-desc">' + esc(d.personality.description) + '</div>';
    h += '</div>';
    return h;
  }

  function renderOffenses(d) {
    const collapsed = !!d.collapsed['offenses'];
    let h = '<div class="card">';
    h += collapsibleHeader('offenses', 'scroll', 'Recent Offenses', collapsed);
    h += '<div class="card-body ' + (collapsed ? 'collapsed' : '') + '" style="margin-top:36px">';
    if (d.eventHistory.length === 0) {
      h += '<div class="empty-state">No offenses recorded yet. Go commit something.</div>';
    } else {
      h += '<div class="event-scroll"><ul class="event-list">';
      for (let i = 0; i < d.eventHistory.length; i++) {
        const e = d.eventHistory[i];
        const iconName = EVENT_ICONS[e.type] || 'dot';
        const tone = EVENT_ICON_TONE[e.type] || '';
        const edelta = e.scoreDelta >= 0 ? '+' + e.scoreDelta : '' + e.scoreDelta;
        const edeltaClass = e.scoreDelta >= 0 ? 'positive' : 'negative';
        const expanded = !!eventExpanded[i];
        const hasAdvice = !!(e.roastAdvice && e.roastAdvice.length > 0);
        h += '<li class="event-row" data-event-idx="' + i + '">';
        h += '<div class="event-item">';
        h += '<span class="event-icon ' + tone + '">' + svgIcon(iconName) + '</span>';
        h += '<span class="event-type">' + esc(e.type) + '</span>';
        h += '<span class="event-delta ' + edeltaClass + '">' + edelta + '</span>';
        h += '<span class="event-time">' + timeAgo(e.timestamp) + '</span>';
        h += '</div>';
        if (e.roastExcerpt) {
          h += '<div class="event-roast' + (expanded ? '' : ' truncated') + '">' + esc(e.roastExcerpt) + '</div>';
        }
        if (hasAdvice) {
          h += '<button class="event-expand" data-expand-idx="' + i + '">';
          h += svgIcon(expanded ? 'chevronUp' : 'chevron');
          h += '<span>' + (expanded ? 'Hide advice' : 'Show advice') + '</span>';
          h += '</button>';
          if (expanded) {
            h += '<div class="event-advice">' + svgIcon('bulb') + '<span>' + esc(e.roastAdvice) + '</span></div>';
          }
        }
        h += '</li>';
      }
      h += '</ul></div>';
    }
    h += '</div></div>';
    return h;
  }

  function renderAchievements(d) {
    const collapsed = !!d.collapsed['achievements'];
    const unlockedCount = d.achievements.filter(a => a.unlocked).length;
    let h = '<div class="card">';
    h += collapsibleHeader('achievements', 'trophy', 'Achievements', collapsed);
    h += '<div class="card-body ' + (collapsed ? 'collapsed' : '') + '" style="margin-top:36px">';
    h += '<div class="ach-count">' + unlockedCount + ' / ' + d.achievements.length + ' unlocked</div>';
    h += '<div class="achievement-grid">';
    const sorted = [...d.achievements].sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0) || b.progress - a.progress);
    for (const a of sorted) {
      h += '<div class="achievement-row">';
      h += '<div class="ach-icon ' + (a.unlocked ? 'unlocked' : '') + '">' + svgIcon(a.unlocked ? 'check' : 'lock') + '</div>';
      h += '<div class="ach-info">';
      h += '<div class="ach-name ' + (a.unlocked ? '' : 'locked') + '">' + esc(a.name) + '</div>';
      h += '<div class="ach-desc">' + esc(a.description) + '</div>';
      if (!a.unlocked) h += '<div class="ach-progress-track"><div class="ach-progress-fill" style="width:' + (a.progress * 100) + '%"></div></div>';
      h += '</div></div>';
    }
    h += '</div></div></div>';
    return h;
  }

  function renderStats(d) {
    const collapsed = !!d.collapsed['stats'];
    let h = '<div class="card">';
    h += collapsibleHeader('stats', 'chart', 'Stats', collapsed);
    h += '<div class="card-body ' + (collapsed ? 'collapsed' : '') + '" style="margin-top:36px">';
    h += '<div class="stat-grid">';
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
      h += '<div class="stat-item"><span class="stat-label">' + label + '</span><span class="stat-value">' + val + '</span></div>';
    }
    h += '</div></div></div>';
    return h;
  }

  function renderActions(d) {
    const collapsed = !!d.collapsed['actions'];
    let h = '<div class="card">';
    h += collapsibleHeader('actions', 'zap', 'Actions', collapsed);
    h += '<div class="card-body ' + (collapsed ? 'collapsed' : '') + '" style="margin-top:36px">';
    h += '<div class="action-grid">';
    h += '<button class="action-btn" data-cmd="gitgud.runDemo">Demo</button>';
    h += '<button class="action-btn" data-cmd="gitgud.exportRankCard">Rank Card</button>';
    h += '<button class="action-btn" data-cmd="gitgud.weeklyReport">Report</button>';
    h += '<button class="action-btn danger" data-cmd="gitgud.resetStats">Reset</button>';
    h += '</div></div></div>';
    return h;
  }

  function renderSettings(d) {
    const collapsed = !!d.collapsed['settings'];
    let h = '<div class="card">';
    h += collapsibleHeader('settings', 'settings', 'AI Roast Settings', collapsed);
    h += '<div class="card-body ' + (collapsed ? 'collapsed' : '') + '" style="margin-top:36px">';

    var PROVIDER_MODELS = {
      ollama: ['deepseek-v4-flash:cloud','deepseek-v4-pro:cloud','kimi-k2.6:cloud','glm-5.1:cloud','gemma4:cloud','qwen3.5:cloud'],
      gemini: ['gemini-2.5-flash','gemini-2.5-pro','gemini-2.5-flash-lite'],
      claude: ['claude-opus-4-7','claude-sonnet-4-6','claude-haiku-4-5'],
      openai: ['gpt-5','gpt-4o','gpt-4o-mini','o1-mini'],
      xai: ['grok-4','grok-3','grok-3-mini']
    };
    var PROVIDER_LABEL = { ollama:'Ollama', gemini:'Gemini', claude:'Claude', openai:'ChatGPT', xai:'Grok' };

    function modelOptions(provider, current) {
      var opts = PROVIDER_MODELS[provider] || [];
      return opts.map(function(m){ return '<option value="'+esc(m)+'"'+(m===current?' selected':'')+'>'+esc(m)+'</option>'; }).join('');
    }

    h += '<div class="settings-field"><label class="settings-label">AI Provider</label>';
    h += '<select class="settings-select" id="cfg-provider">';
    ['gemini','claude','openai','xai','ollama'].forEach(function(p){
      h += '<option value="'+p+'"'+(d.aiProvider===p?' selected':'')+'>'+PROVIDER_LABEL[p]+'</option>';
    });
    h += '</select></div>';

    h += '<div class="settings-field"><label class="settings-label">Commit Message Style</label>';
    h += '<select class="settings-select" id="cfg-commit-style">';
    h += '<option value="clean"' + (d.commitMessageStyle === 'clean' ? ' selected' : '') + '>Clean (Conventional Commits)</option>';
    h += '<option value="savage"' + (d.commitMessageStyle === 'savage' ? ' selected' : '') + '>Savage (toxic-coach)</option>';
    h += '</select></div>';

    // Hidden inputs preserve unselected providers' keys/models so they survive save round-trips.
    var hidden = [
      ['cfg-ollama-key', d.ollamaApiKey],
      ['cfg-ollama-model', d.ollamaModel],
      ['cfg-ollama-baseurl', d.ollamaBaseUrl],
      ['cfg-gemini-key', d.geminiApiKey],
      ['cfg-gemini-model', d.geminiModel],
      ['cfg-claude-key', d.claudeApiKey],
      ['cfg-claude-model', d.claudeModel],
      ['cfg-openai-key', d.openaiApiKey],
      ['cfg-openai-model', d.openaiModel],
      ['cfg-xai-key', d.xaiApiKey],
      ['cfg-xai-model', d.xaiModel]
    ];
    hidden.forEach(function(pair){
      h += '<input type="hidden" id="'+pair[0]+'" value="'+esc(pair[1] || '')+'" />';
    });

    // Active-provider visible fields
    var p = d.aiProvider;
    var keyVal = d[p+'ApiKey'] || '';
    var modelVal = d[p+'Model'] || '';
    h += '<div class="settings-field"><label class="settings-label">'+PROVIDER_LABEL[p]+' API Key</label>';
    h += '<input class="settings-input" type="password" id="cfg-active-key" value="' + esc(keyVal) + '" placeholder="Enter '+PROVIDER_LABEL[p]+' API key..." /></div>';

    h += '<div class="settings-field"><label class="settings-label">'+PROVIDER_LABEL[p]+' Model</label>';
    h += '<select class="settings-select" id="cfg-active-model">' + modelOptions(p, modelVal) + '</select></div>';

    if (p === 'ollama') {
      h += '<div class="settings-field"><label class="settings-label">Ollama Base URL</label>';
      h += '<input class="settings-input" type="text" id="cfg-active-baseurl" value="' + esc(d.ollamaBaseUrl) + '" placeholder="https://ollama.com/v1" />';
      h += '<div class="settings-hint">Leave blank for default</div></div>';
    }

    h += '<div style="display:flex;align-items:center">';
    h += '<button class="settings-save" id="settings-save">Save</button>';
    h += '<span class="settings-saved" id="settings-saved">Saved!</span>';
    h += '</div>';

    var hasKey = !!keyVal;
    h += '<div class="settings-status ' + (hasKey ? 'connected' : 'disconnected') + '">';
    h += hasKey ? '<span class="status-icon">' + svgIcon('check') + '</span>AI roasts enabled (' + esc(PROVIDER_LABEL[p]) + ')' : '<span class="status-icon">' + svgIcon('warn') + '</span>No API key — using template roasts';
    h += '</div>';
    h += '</div></div>';
    return h;
  }

  function render(d) {
    state = d;
    let html = '';
    html += renderRankCard(d);
    html += renderSourceControl(d);
    html += renderPersonality(d);
    html += renderOffenses(d);
    html += renderAchievements(d);
    html += renderStats(d);
    html += renderActions(d);
    html += renderSettings(d);
    root.innerHTML = html;
    bind();
  }

  function bind() {
    // Collapsible headers
    document.querySelectorAll('[data-collapse-key]').forEach(el => {
      el.addEventListener('click', () => {
        const key = el.getAttribute('data-collapse-key');
        const wasCollapsed = el.classList.contains('collapsed');
        el.classList.toggle('collapsed');
        const body = el.parentElement.querySelector('.card-body');
        if (body) body.classList.toggle('collapsed');
        vscode.postMessage({ type: 'toggleCollapsed', key, collapsed: !wasCollapsed });
      });
    });

    // Event row expand toggles
    document.querySelectorAll('[data-expand-idx]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const idx = e.currentTarget.getAttribute('data-expand-idx');
        eventExpanded[idx] = !eventExpanded[idx];
        if (state) render(state);
      });
    });
    document.querySelectorAll('[data-event-idx]').forEach(row => {
      row.addEventListener('click', e => {
        if (e.target.closest('[data-expand-idx]')) return;
        const idx = row.getAttribute('data-event-idx');
        const ev = state && state.eventHistory[idx];
        if (!ev || !ev.roastAdvice) return;
        eventExpanded[idx] = !eventExpanded[idx];
        if (state) render(state);
      });
    });

    // Action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const cmd = e.currentTarget.getAttribute('data-cmd');
        if (cmd) vscode.postMessage({ type: 'runCommand', command: cmd });
      });
    });

    // Source Control
    const msgInput = document.getElementById('sc-message');
    function autosize(ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.max(56, ta.scrollHeight) + 'px';
    }
    if (msgInput) {
      autosize(msgInput);
      msgInput.addEventListener('input', e => { scMessage = e.target.value; autosize(e.target); });
    }

    const genBtn = document.getElementById('sc-generate');
    if (genBtn) genBtn.addEventListener('click', () => {
      if (scGenerating) return;
      scGenerating = true; scError = '';
      vscode.postMessage({ type: 'sc:generate' });
      render(state);
    });

    const commitBtn = document.getElementById('sc-commit');
    if (commitBtn) commitBtn.addEventListener('click', () => doCommit(false, false));

    const caretBtn = document.getElementById('sc-commit-caret');
    if (caretBtn) caretBtn.addEventListener('click', e => {
      e.stopPropagation();
      scMenuOpen = !scMenuOpen;
      const pop = document.getElementById('sc-menu-pop');
      if (pop) pop.classList.toggle('open');
    });

    document.querySelectorAll('[data-commit-action]').forEach(b => {
      b.addEventListener('click', e => {
        const action = e.currentTarget.getAttribute('data-commit-action');
        scMenuOpen = false;
        const pop = document.getElementById('sc-menu-pop');
        if (pop) pop.classList.remove('open');
        if (action === 'commit-push') doCommit(true, false);
        else if (action === 'amend') doCommit(false, true);
      });
    });

    document.addEventListener('click', () => {
      if (scMenuOpen) {
        scMenuOpen = false;
        const pop = document.getElementById('sc-menu-pop');
        if (pop) pop.classList.remove('open');
      }
    });

    const pullRetry = document.getElementById('sc-pullretry-btn');
    if (pullRetry) pullRetry.addEventListener('click', () => {
      scShowPullRetry = false;
      vscode.postMessage({ type: 'sc:pullAndPush' });
      render(state);
    });

    const branchSel = document.getElementById('sc-branch');
    if (branchSel) branchSel.addEventListener('change', e => {
      const v = e.target.value;
      if (!v) return;
      const isRemote = v.startsWith('R:');
      const full = v.slice(2);
      const sc = state.sourceControl;
      if (!isRemote && full === sc.branch) return;
      if (!confirm('Switch to "' + full + '"?')) {
        e.target.value = sc.branch ? 'L:' + sc.branch : '';
        return;
      }
      vscode.postMessage({ type: 'sc:checkout', branchFull: full, isRemote });
    });

    // Settings
    const saveBtn = document.getElementById('settings-save');
    if (saveBtn) saveBtn.addEventListener('click', () => {
      const v = id => (document.getElementById(id) || {}).value || '';
      const provider = v('cfg-provider') || 'gemini';
      // Fold the active visible inputs into the right per-provider hidden buckets.
      const activeKey = v('cfg-active-key');
      const activeModel = v('cfg-active-model');
      const activeBase = v('cfg-active-baseurl');
      const buckets = {
        ollama: { key: v('cfg-ollama-key'), model: v('cfg-ollama-model'), base: v('cfg-ollama-baseurl') },
        gemini: { key: v('cfg-gemini-key'), model: v('cfg-gemini-model') },
        claude: { key: v('cfg-claude-key'), model: v('cfg-claude-model') },
        openai: { key: v('cfg-openai-key'), model: v('cfg-openai-model') },
        xai: { key: v('cfg-xai-key'), model: v('cfg-xai-model') },
      };
      if (buckets[provider]) {
        buckets[provider].key = activeKey;
        buckets[provider].model = activeModel;
        if (provider === 'ollama') buckets.ollama.base = activeBase;
      }
      vscode.postMessage({
        type: 'saveSettings',
        aiProvider: provider,
        ollamaApiKey: buckets.ollama.key,
        ollamaModel: buckets.ollama.model,
        ollamaBaseUrl: buckets.ollama.base,
        geminiApiKey: buckets.gemini.key,
        geminiModel: buckets.gemini.model,
        claudeApiKey: buckets.claude.key,
        claudeModel: buckets.claude.model,
        openaiApiKey: buckets.openai.key,
        openaiModel: buckets.openai.model,
        xaiApiKey: buckets.xai.key,
        xaiModel: buckets.xai.model,
        commitMessageStyle: v('cfg-commit-style'),
      });
      const saved = document.getElementById('settings-saved');
      if (saved) { saved.classList.add('show'); setTimeout(() => saved.classList.remove('show'), 2000); }
    });

    // Auto-save the provider change so the visible API-key / model fields swap immediately.
    const provSel = document.getElementById('cfg-provider');
    if (provSel) provSel.addEventListener('change', () => {
      if (saveBtn) saveBtn.click();
    });
  }

  function doCommit(push, amend) {
    const message = (scMessage || '').trim();
    if (!message && !amend) {
      scError = 'Commit message required.';
      render(state);
      return;
    }
    scError = '';
    vscode.postMessage({ type: 'sc:commit', message, push, amend });
  }

  function playSound(type) {
    if (!soundEnabled) return;
    try {
      const ctx = new AudioContext();
      switch (type) {
        case 'rank-up': {
          const notes = [523, 659, 784, 1047];
          notes.forEach((freq, i) => {
            const o = ctx.createOscillator(); const g = ctx.createGain();
            o.type = 'square'; o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
            g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.1);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.2);
            o.start(ctx.currentTime + i * 0.1); o.stop(ctx.currentTime + i * 0.1 + 0.2);
          });
          break;
        }
        case 'rank-down': {
          const notes = [523, 466, 415, 349];
          notes.forEach((freq, i) => {
            const o = ctx.createOscillator(); const g = ctx.createGain();
            o.type = 'sawtooth'; o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
            g.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.12);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.25);
            o.start(ctx.currentTime + i * 0.12); o.stop(ctx.currentTime + i * 0.12 + 0.25);
          });
          break;
        }
        case 'achievement': {
          [523, 659, 784].forEach(freq => {
            const o = ctx.createOscillator(); const g = ctx.createGain();
            o.type = 'sine'; o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
            g.gain.setValueAtTime(0.12, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.5);
          });
          break;
        }
        case 'critical': {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = 'square'; o.frequency.value = 120; o.connect(g); g.connect(ctx.destination);
          g.gain.setValueAtTime(0.2, ctx.currentTime);
          g.gain.setValueAtTime(0.0, ctx.currentTime + 0.08);
          g.gain.setValueAtTime(0.2, ctx.currentTime + 0.12);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.3);
          break;
        }
        case 'event': {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = 'sine'; o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
          g.gain.setValueAtTime(0.1, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
          o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.12);
          break;
        }
      }
    } catch (_) {}
  }

  window.addEventListener('message', ev => {
    const msg = ev.data;
    if (msg.type === 'updateState') {
      soundEnabled = msg.data.soundEnabled;
      render(msg.data);
    } else if (msg.type === 'playSound') {
      playSound(msg.sound);
    } else if (msg.type === 'speakRoast' && msg.text) {
      try {
        if (typeof speechSynthesis !== 'undefined') {
          const utt = new SpeechSynthesisUtterance(String(msg.text));
          utt.rate = 1.05; utt.pitch = 0.85;
          speechSynthesis.cancel(); speechSynthesis.speak(utt);
        }
      } catch (_) {}
    } else if (msg.type === 'sc:generated') {
      scGenerating = false;
      if (msg.error) { scError = msg.error; }
      else if (msg.message) { scMessage = msg.message; scError = ''; }
      if (state) render(state);
    } else if (msg.type === 'sc:committed') {
      scMessage = '';
      scError = msg.error || '';
      scShowPullRetry = !!msg.needsPull;
      if (state) render(state);
    } else if (msg.type === 'sc:pushResult') {
      scShowPullRetry = !!msg.needsPull;
      scError = msg.error || '';
      if (state) render(state);
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
