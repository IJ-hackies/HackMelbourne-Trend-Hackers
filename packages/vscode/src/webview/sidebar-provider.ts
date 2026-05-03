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
  aiProvider: 'ollama' | 'gemini';
  ollamaApiKey: string;
  ollamaModel: string;
  ollamaBaseUrl: string;
  geminiApiKey: string;
  commitMessageStyle: 'clean' | 'savage';
  sourceControl: SourceControlSnapshot;
  collapsed: Record<string, boolean>;
}

export type SidebarMessage =
  | { type: 'ready' }
  | { type: 'runCommand'; command: string }
  | { type: 'saveSettings'; aiProvider: string; ollamaApiKey: string; ollamaModel: string; ollamaBaseUrl: string; geminiApiKey: string; commitMessageStyle: string }
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
        await cfg.update('aiProvider', msg.aiProvider || 'ollama', true);
        await cfg.update('ollamaApiKey', msg.ollamaApiKey || '', true);
        await cfg.update('ollamaModel', msg.ollamaModel || '', true);
        await cfg.update('ollamaBaseUrl', msg.ollamaBaseUrl || '', true);
        await cfg.update('geminiApiKey', msg.geminiApiKey || '', true);
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
    configFields: { aiProvider: 'ollama' | 'gemini'; ollamaApiKey: string; ollamaModel: string; ollamaBaseUrl: string; geminiApiKey: string; commitMessageStyle: 'clean' | 'savage'; soundEnabled: boolean },
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
      soundEnabled: configFields.soundEnabled,
      aiProvider: configFields.aiProvider,
      ollamaApiKey: configFields.ollamaApiKey,
      ollamaModel: configFields.ollamaModel,
      ollamaBaseUrl: configFields.ollamaBaseUrl,
      geminiApiKey: configFields.geminiApiKey,
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

  playSound(sound: 'fahhh' | 'dayum' | 'rank-up' | 'rank-down' | 'achievement' | 'critical' | 'event'): void {
    this.postMessage({ type: 'playSound', sound });
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
    const fahhhUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'sounds', 'fahhh.mpeg'));

    return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; media-src *;" />
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
  padding-left: 18px; /* balances the chev column so the title sits visually centered */
}
.card-header .chev {
  display: inline-block;
  width: 18px;
  text-align: center;
  font-size: 11px;
  line-height: 1;
  transition: transform 0.15s ease;
  color: var(--vscode-descriptionForeground);
}
.card-header.collapsed .chev { transform: rotate(-90deg); }
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
.rank-name { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.rank-score { font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums; }
.rank-delta { font-size: 12px; font-weight: 600; margin-left: 6px; }
.rank-delta.positive { color: var(--positive); }
.rank-delta.negative { color: var(--negative); }
.progress-track { height: 6px; background: var(--vscode-progressBar-background, #333); border-radius: 3px; margin-top: 8px; overflow: hidden; opacity: 0.3; }
.progress-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
.next-rank { font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 4px; }

/* PERSONALITY */
.personality-type { font-size: 15px; font-weight: 700; }
.personality-desc { font-size: 12px; color: var(--vscode-descriptionForeground); margin-top: 3px; font-style: italic; }

/* SOURCE CONTROL */
.sc-message-wrap {
  position: relative;
  background: var(--vscode-input-background);
  border: 1px solid var(--vscode-input-border, var(--vscode-widget-border, #555));
  border-radius: 3px;
  transition: border-color 0.15s ease;
}
.sc-message-wrap:focus-within { border-color: var(--vscode-focusBorder, var(--accent)); }
.sc-input {
  display: block;
  width: 100%;
  min-height: 56px;
  padding: 6px 8px 28px 8px;
  font-size: 12px;
  line-height: 1.4;
  font-family: var(--vscode-font-family, sans-serif);
  color: var(--vscode-input-foreground);
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  overflow: hidden;
  box-sizing: border-box;
}
.sc-input:disabled { opacity: 0.6; }
.sc-generate {
  position: absolute;
  right: 4px;
  bottom: 4px;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.4;
  font-family: var(--vscode-font-family, sans-serif);
  color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
  background: var(--vscode-button-secondaryBackground, rgba(255,255,255,0.06));
  border: 1px solid var(--vscode-widget-border, rgba(255,255,255,0.12));
  border-radius: 3px;
  cursor: pointer;
}
.sc-generate:hover:not(:disabled) { background: var(--vscode-button-secondaryHoverBackground, rgba(255,255,255,0.12)); }
.sc-generate:disabled { opacity: 0.5; cursor: not-allowed; }
.sc-btn {
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--vscode-font-family, sans-serif);
  color: var(--vscode-button-foreground);
  background: var(--vscode-button-background);
  border: none;
  border-radius: 3px;
  cursor: pointer;
  white-space: nowrap;
}
.sc-btn:hover:not(:disabled) { background: var(--vscode-button-hoverBackground); }
.sc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.sc-btn.secondary {
  color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
  background: var(--vscode-button-secondaryBackground, transparent);
  border: 1px solid var(--vscode-widget-border, rgba(255,255,255,0.12));
}
.sc-btn.secondary:hover:not(:disabled) { background: var(--vscode-button-secondaryHoverBackground, rgba(255,255,255,0.04)); }
.sc-commit-row { display: flex; margin-top: 8px; }
.sc-commit-main {
  flex: 1;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.sc-commit-caret {
  width: 24px;
  padding: 0;
  border-left: 1px solid rgba(0,0,0,0.25);
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
.sc-menu {
  position: relative;
}
.sc-menu-pop {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 2px;
  background: var(--vscode-menu-background, var(--vscode-editorWidget-background));
  border: 1px solid var(--vscode-widget-border, #555);
  border-radius: 3px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  z-index: 10;
  min-width: 180px;
  display: none;
}
.sc-menu-pop.open { display: block; }
.sc-menu-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--vscode-menu-foreground, var(--vscode-foreground));
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
}
.sc-menu-item:hover { background: var(--vscode-menu-selectionBackground, rgba(255,255,255,0.08)); }
.sc-branch-row { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.sc-branch-label { font-size: 11px; color: var(--vscode-descriptionForeground); flex-shrink: 0; }
.sc-select {
  flex: 1; min-width: 0;
  padding: 4px 6px;
  font-size: 12px;
  color: var(--vscode-dropdown-foreground, var(--vscode-foreground));
  background: var(--vscode-dropdown-background, var(--vscode-input-background));
  border: 1px solid var(--vscode-dropdown-border, var(--vscode-input-border, #555));
  border-radius: 3px;
  outline: none;
}
.sc-changes {
  margin-top: 10px;
  border-top: 1px solid var(--vscode-widget-border, rgba(255,255,255,0.06));
  padding-top: 8px;
}
.sc-changes-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--vscode-descriptionForeground);
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
}
.sc-change-list { list-style: none; max-height: 180px; overflow-y: auto; }
.sc-change-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  font-size: 12px;
}
.sc-change-status {
  flex-shrink: 0;
  width: 14px;
  text-align: center;
  font-weight: 700;
  font-family: var(--vscode-editor-font-family, monospace);
}
.sc-change-status.M { color: #e2c08d; }
.sc-change-status.A { color: var(--positive); }
.sc-change-status.D { color: var(--negative); }
.sc-change-status.U, .sc-change-status\\?\\? { color: var(--positive); }
.sc-change-status.C { color: var(--critical); }
.sc-change-path {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sc-error {
  margin-top: 6px;
  font-size: 11px;
  color: var(--negative);
  word-break: break-word;
}
.sc-empty {
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  font-style: italic;
  padding: 4px 0;
}
.sc-pullretry {
  margin-top: 6px;
  font-size: 11px;
  color: var(--negative);
  display: flex;
  gap: 6px;
  align-items: center;
}

/* EVENTS */
.event-list { list-style: none; }
.event-item { display: flex; align-items: baseline; gap: 6px; padding: 4px 0; border-bottom: 1px solid var(--vscode-widget-border, rgba(255,255,255,0.06)); font-size: 12px; }
.event-item:last-child { border-bottom: none; }
.event-icon { flex-shrink: 0; width: 18px; text-align: center; }
.event-type { flex-shrink: 0; font-weight: 600; width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.event-delta { flex-shrink: 0; font-weight: 700; font-variant-numeric: tabular-nums; width: 40px; text-align: right; }
.event-delta.positive { color: var(--positive); }
.event-delta.negative { color: var(--negative); }
.event-time { flex-shrink: 0; color: var(--vscode-descriptionForeground); font-size: 11px; margin-left: auto; }
.event-roast { display: block; font-size: 11px; color: var(--vscode-descriptionForeground); padding: 2px 0 2px 24px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.empty-state { color: var(--vscode-descriptionForeground); font-style: italic; font-size: 12px; text-align: center; padding: 12px 0; }

/* ACHIEVEMENTS */
.achievement-grid { display: flex; flex-direction: column; gap: 6px; }
.achievement-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.ach-icon { flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; background: var(--vscode-badge-background, #333); color: var(--vscode-badge-foreground, #fff); }
.ach-icon.unlocked { background: var(--rank-gold); color: #000; }
.ach-info { flex: 1; min-width: 0; }
.ach-name { font-weight: 600; }
.ach-name.locked { opacity: 0.5; }
.ach-desc { font-size: 11px; color: var(--vscode-descriptionForeground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ach-progress-track { width: 100%; height: 3px; background: var(--vscode-progressBar-background, #333); border-radius: 2px; margin-top: 2px; overflow: hidden; opacity: 0.4; }
.ach-progress-fill { height: 100%; border-radius: 2px; background: var(--accent); transition: width 0.4s ease; }
.ach-count { font-size: 11px; color: var(--vscode-descriptionForeground); margin-bottom: 6px; }

/* STATS */
.stat-grid { display: flex; flex-direction: column; }
.stat-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 5px 0;
  font-size: 12px;
  border-bottom: 1px solid var(--vscode-widget-border, rgba(255,255,255,0.05));
}
.stat-item:last-child { border-bottom: none; }
.stat-label {
  color: var(--vscode-descriptionForeground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.stat-value {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  color: var(--vscode-foreground);
  flex-shrink: 0;
}

/* SETTINGS */
.settings-field { margin-bottom: 8px; }
.settings-label { display: block; font-size: 11px; font-weight: 600; margin-bottom: 3px; color: var(--vscode-descriptionForeground); }
.settings-input, .settings-select {
  width: 100%; padding: 4px 6px; font-size: 12px;
  font-family: var(--vscode-font-family, monospace);
  color: var(--vscode-input-foreground);
  background: var(--vscode-input-background);
  border: 1px solid var(--vscode-input-border, var(--vscode-widget-border, #555));
  border-radius: 3px; outline: none;
}
.settings-input:focus, .settings-select:focus { border-color: var(--vscode-focusBorder, var(--accent)); }
.settings-hint { font-size: 10px; color: var(--vscode-descriptionForeground); margin-top: 2px; opacity: 0.7; }
.settings-save { margin-top: 4px; padding: 4px 12px; font-size: 11px; font-weight: 600; color: var(--vscode-button-foreground); background: var(--vscode-button-background); border: none; border-radius: 3px; cursor: pointer; }
.settings-save:hover { background: var(--vscode-button-hoverBackground); }
.settings-saved { font-size: 11px; color: var(--positive); margin-left: 8px; opacity: 0; transition: opacity 0.3s ease; }
.settings-saved.show { opacity: 1; }
.settings-status { font-size: 11px; margin-top: 6px; }
.settings-status.connected { color: var(--positive); }
.settings-status.disconnected { color: var(--vscode-descriptionForeground); }

/* ACTIONS */
.action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.action-btn {
  padding: 6px 8px; font-size: 11px; font-weight: 600;
  font-family: var(--vscode-font-family, sans-serif);
  color: var(--vscode-foreground);
  background: transparent;
  border: 1px solid var(--vscode-widget-border, rgba(255,255,255,0.12));
  border-radius: 3px; cursor: pointer; text-align: center;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  min-width: 0; transition: background 0.15s ease, border-color 0.15s ease;
}
.action-btn:hover { background: rgba(255,255,255,0.04); border-color: var(--vscode-focusBorder, var(--accent)); }
.action-btn.danger { color: var(--negative); border-color: rgba(225,112,85,0.35); }
.action-btn.danger:hover { background: rgba(225,112,85,0.08); border-color: var(--negative); }

/* LATEST ROAST */
.latest-roast-img {
  width: 100%;
  aspect-ratio: 16/9;
  background: var(--vscode-editor-background);
  border: 1px dashed var(--vscode-widget-border, rgba(255,255,255,0.15));
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  overflow: hidden;
}
.latest-roast-img-placeholder {
  font-size: 32px;
  opacity: 0.4;
}
.latest-roast-text { font-size: 12px; font-weight: 600; line-height: 1.4; margin-bottom: 4px; }
.latest-roast-text.severity-savage { color: var(--critical); }
.latest-roast-text.severity-medium { color: #e2c08d; }
.roast-history-text.severity-savage { color: var(--critical); }
.roast-history-text.severity-medium { color: #e2c08d; }
.latest-roast-time { font-size: 10px; color: var(--vscode-descriptionForeground); }
.latest-roast-empty { font-size: 12px; color: var(--vscode-descriptionForeground); font-style: italic; text-align: center; padding: 8px 0; }
.latest-roast-toggle {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 4px 0;
  font-size: 11px;
  font-family: inherit;
  color: var(--accent);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: center;
}
.latest-roast-toggle:hover { text-decoration: underline; }
.roast-history-list { list-style: none; margin-top: 6px; }
.roast-history-item {
  padding: 5px 0;
  border-top: 1px solid var(--vscode-widget-border, rgba(255,255,255,0.06));
}
.roast-history-text { display: block; font-size: 11px; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.roast-history-time { display: block; font-size: 10px; color: var(--vscode-descriptionForeground); margin-top: 2px; }

/* LOADING */
.loading { text-align: center; padding: 40px 12px; color: var(--vscode-descriptionForeground); }
.loading-title { font-size: 16px; font-weight: 700; margin-bottom: 6px; color: var(--vscode-foreground); }
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

  const RANK_COLORS = { bronze: '#cd7f32', silver: '#c0c0c0', gold: '#ffd700', platinum: '#00cec9', diamond: '#00d2ff' };
  const EVENT_ICONS = {
    'commit': '\\u{1F4DD}', 'branch-switch': '\\u{1F500}', 'force-push': '\\u{1F4A5}',
    'merge-conflict': '\\u{2694}\\u{FE0F}', 'rebase': '\\u{1F504}', 'push': '\\u{1F4E4}', 'merge': '\\u{1F517}',
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

  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  }
  function esc(str) { const d = document.createElement('div'); d.textContent = str == null ? '' : String(str); return d.innerHTML; }

  function collapsibleHeader(key, icon, title, collapsed) {
    return '<div class="card-header ' + (collapsed ? 'collapsed' : '') + '" data-collapse-key="' + key + '">' +
      '<span class="card-title">' + icon + ' ' + title + '</span>' +
      '<span class="chev">\\u{25BC}</span>' +
    '</div>';
  }

  let roastHistoryExpanded = false;

  const SEVERITY_ICONS = { savage: '\\u{1F525}', medium: '\\u{26A0}\\u{FE0F}', mild: '\\u{2139}\\u{FE0F}' };
  const SEVERITY_CLASSES = { savage: 'severity-savage', medium: 'severity-medium', mild: 'severity-mild' };

  function renderLatestRoast(d) {
    const roasts = (d.eventHistory || []).filter(e => e.roastExcerpt);
    const latest = roasts[0];
    let h = '<div class="card">';
    h += '<div class="card-title">\\u{1F525} Latest Roast</div>';
    h += '<div class="latest-roast-img"><div class="latest-roast-img-placeholder">\\u{1F5BC}\\u{FE0F}</div></div>';
    if (latest) {
      const icon = SEVERITY_ICONS[latest.severity] || SEVERITY_ICONS.mild;
      const cls = SEVERITY_CLASSES[latest.severity] || SEVERITY_CLASSES.mild;
      h += '<div class="latest-roast-text ' + cls + '">' + icon + ' ' + esc(latest.roastExcerpt) + '</div>';
      h += '<div class="latest-roast-time">' + timeAgo(latest.timestamp) + '</div>';
    } else {
      h += '<div class="latest-roast-empty">No roasts yet. Go do something questionable.</div>';
    }
    if (roasts.length > 1) {
      h += '<button class="latest-roast-toggle" id="roast-history-toggle">' + (roastHistoryExpanded ? 'Hide history' : 'Show past roasts (' + (roasts.length - 1) + ')') + '</button>';
      if (roastHistoryExpanded) {
        h += '<ul class="roast-history-list">';
        for (const r of roasts.slice(1, 10)) {
          const rIcon = SEVERITY_ICONS[r.severity] || SEVERITY_ICONS.mild;
          const rCls = SEVERITY_CLASSES[r.severity] || SEVERITY_CLASSES.mild;
          h += '<li class="roast-history-item">';
          h += '<span class="roast-history-text ' + rCls + '">' + rIcon + ' ' + esc(r.roastExcerpt) + '</span>';
          h += '<span class="roast-history-time">' + timeAgo(r.timestamp) + '</span>';
          h += '</li>';
        }
        h += '</ul>';
      }
    }
    h += '</div>';
    return h;
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
    h += '<div class="card-title">\\u{2694}\\u{FE0F} Rank</div>';
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
    h += collapsibleHeader('sc', '\\u{1F527}', 'Source Control', collapsed);
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
    const hasKey = (d.aiProvider === 'gemini' && d.geminiApiKey) || (d.aiProvider === 'ollama' && d.ollamaApiKey);
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
    h += '<button class="sc-btn sc-commit-main" id="sc-commit" ' + (commitDisabled ? 'disabled' : '') + '>\\u2713 Commit</button>';
    h += '<button class="sc-btn sc-commit-caret" id="sc-commit-caret" ' + (commitDisabled ? 'disabled' : '') + ' title="More commit actions">\\u25BE</button>';
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
    h += '<div class="sc-changes-title"><span>\\u{25BE} Changes</span><span>' + sc.changes.length + '</span></div>';
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
    h += '<div class="card-title">\\u{1F9E0} Personality</div>';
    h += '<div class="personality-type">' + esc(d.personality.type) + '</div>';
    h += '<div class="personality-desc">' + esc(d.personality.description) + '</div>';
    h += '</div>';
    return h;
  }

  function renderOffenses(d) {
    const collapsed = !!d.collapsed['offenses'];
    let h = '<div class="card">';
    h += collapsibleHeader('offenses', '\\u{1F4CB}', 'Recent Offenses', collapsed);
    h += '<div class="card-body ' + (collapsed ? 'collapsed' : '') + '" style="margin-top:36px">';
    if (d.eventHistory.length === 0) {
      h += '<div class="empty-state">No offenses recorded yet. Go commit something.</div>';
    } else {
      h += '<ul class="event-list">';
      for (const e of d.eventHistory.slice(0, 15)) {
        const icon = EVENT_ICONS[e.type] || '\\u{2022}';
        const edelta = e.scoreDelta >= 0 ? '+' + e.scoreDelta : '' + e.scoreDelta;
        const edeltaClass = e.scoreDelta >= 0 ? 'positive' : 'negative';
        h += '<li><div class="event-item">';
        h += '<span class="event-icon">' + icon + '</span>';
        h += '<span class="event-type">' + esc(e.type) + '</span>';
        h += '<span class="event-delta ' + edeltaClass + '">' + edelta + '</span>';
        h += '<span class="event-time">' + timeAgo(e.timestamp) + '</span>';
        h += '</div>';
        if (e.roastExcerpt) h += '<div class="event-roast">' + esc(e.roastExcerpt) + '</div>';
        h += '</li>';
      }
      h += '</ul>';
    }
    h += '</div></div>';
    return h;
  }

  function renderAchievements(d) {
    const collapsed = !!d.collapsed['achievements'];
    const unlockedCount = d.achievements.filter(a => a.unlocked).length;
    let h = '<div class="card">';
    h += collapsibleHeader('achievements', '\\u{1F3C6}', 'Achievements', collapsed);
    h += '<div class="card-body ' + (collapsed ? 'collapsed' : '') + '" style="margin-top:36px">';
    h += '<div class="ach-count">' + unlockedCount + ' / ' + d.achievements.length + ' unlocked</div>';
    h += '<div class="achievement-grid">';
    const sorted = [...d.achievements].sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0) || b.progress - a.progress);
    for (const a of sorted) {
      h += '<div class="achievement-row">';
      h += '<div class="ach-icon ' + (a.unlocked ? 'unlocked' : '') + '">' + (a.unlocked ? '\\u{2713}' : '\\u{1F512}') + '</div>';
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
    h += collapsibleHeader('stats', '\\u{1F4CA}', 'Stats', collapsed);
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
    h += collapsibleHeader('actions', '\\u{26A1}', 'Actions', collapsed);
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
    h += collapsibleHeader('settings', '\\u{2699}\\u{FE0F}', 'AI Roast Settings', collapsed);
    h += '<div class="card-body ' + (collapsed ? 'collapsed' : '') + '" style="margin-top:36px">';

    h += '<div class="settings-field"><label class="settings-label">AI Provider</label>';
    h += '<select class="settings-select" id="cfg-provider">';
    h += '<option value="ollama"' + (d.aiProvider === 'ollama' ? ' selected' : '') + '>Ollama</option>';
    h += '<option value="gemini"' + (d.aiProvider === 'gemini' ? ' selected' : '') + '>Gemini</option>';
    h += '</select></div>';

    h += '<div class="settings-field"><label class="settings-label">Commit Message Style</label>';
    h += '<select class="settings-select" id="cfg-commit-style">';
    h += '<option value="clean"' + (d.commitMessageStyle === 'clean' ? ' selected' : '') + '>Clean (Conventional Commits)</option>';
    h += '<option value="savage"' + (d.commitMessageStyle === 'savage' ? ' selected' : '') + '>Savage (toxic-coach)</option>';
    h += '</select></div>';

    h += '<div class="settings-field"><label class="settings-label">Ollama API Key</label>';
    h += '<input class="settings-input" type="password" id="cfg-apikey" value="' + esc(d.ollamaApiKey) + '" placeholder="Enter Ollama API key..." /></div>';

    h += '<div class="settings-field"><label class="settings-label">Ollama Model</label>';
    h += '<input class="settings-input" type="text" id="cfg-model" value="' + esc(d.ollamaModel) + '" placeholder="deepseek-v4-flash:cloud" />';
    h += '<div class="settings-hint">Leave blank for default</div></div>';

    h += '<div class="settings-field"><label class="settings-label">Ollama Base URL</label>';
    h += '<input class="settings-input" type="text" id="cfg-baseurl" value="' + esc(d.ollamaBaseUrl) + '" placeholder="https://ollama.com/v1" />';
    h += '<div class="settings-hint">Leave blank for default</div></div>';

    h += '<div class="settings-field"><label class="settings-label">Gemini API Key</label>';
    h += '<input class="settings-input" type="password" id="cfg-gemini-key" value="' + esc(d.geminiApiKey) + '" placeholder="Enter Gemini API key..." /></div>';

    h += '<div style="display:flex;align-items:center">';
    h += '<button class="settings-save" id="settings-save">Save</button>';
    h += '<span class="settings-saved" id="settings-saved">Saved!</span>';
    h += '</div>';

    const hasKey = (d.aiProvider === 'gemini' && d.geminiApiKey.length > 0) || (d.aiProvider === 'ollama' && d.ollamaApiKey.length > 0);
    h += '<div class="settings-status ' + (hasKey ? 'connected' : 'disconnected') + '">';
    h += hasKey ? '\\u{2705} AI roasts enabled (' + esc(d.aiProvider) + ')' : '\\u{26A0}\\u{FE0F} No API key — using template roasts';
    h += '</div>';
    h += '</div></div>';
    return h;
  }

  function render(d) {
    state = d;
    let html = '';
    html += renderLatestRoast(d);
    html += renderRankCard(d);
    html += renderPersonality(d);
    html += renderSourceControl(d);
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

    // Roast history toggle
    const roastToggle = document.getElementById('roast-history-toggle');
    if (roastToggle) roastToggle.addEventListener('click', () => {
      roastHistoryExpanded = !roastHistoryExpanded;
      render(state);
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
      vscode.postMessage({
        type: 'saveSettings',
        aiProvider: v('cfg-provider'),
        ollamaApiKey: v('cfg-apikey'),
        ollamaModel: v('cfg-model'),
        ollamaBaseUrl: v('cfg-baseurl'),
        geminiApiKey: v('cfg-gemini-key'),
        commitMessageStyle: v('cfg-commit-style'),
      });
      const saved = document.getElementById('settings-saved');
      if (saved) { saved.classList.add('show'); setTimeout(() => saved.classList.remove('show'), 2000); }
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
