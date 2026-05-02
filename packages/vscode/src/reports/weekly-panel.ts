import * as vscode from 'vscode';
import { generateWeeklyReport } from '@git-gud/core';
import type { PlayerState } from '@git-gud/core';
import type { StoredEvent } from '../storage/state-manager';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function showWeeklyReport(playerState: PlayerState, events: StoredEvent[]): void {
  const report = generateWeeklyReport(events, { ...playerState.stats, score: playerState.score.total });
  const panel = vscode.window.createWebviewPanel(
    'gitgud.weeklyReport',
    'Git Gud — Weekly Hygiene Report',
    vscode.ViewColumn.Active,
    { enableScripts: false, retainContextWhenHidden: false },
  );

  const startDate = new Date(report.rangeStart).toLocaleDateString();
  const endDate = new Date(report.rangeEnd).toLocaleDateString();

  const cards = report.metrics
    .map(
      (m) => `
      <div class="metric metric-${m.tone}">
        <div class="label">${escapeHtml(m.label)}</div>
        <div class="value">${escapeHtml(m.value)}</div>
        <div class="caption">${escapeHtml(m.caption)}</div>
      </div>`,
    )
    .join('');

  panel.webview.html = /*html*/ `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
  body { font-family: var(--vscode-font-family, sans-serif); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 24px; max-width: 1100px; margin: 0 auto; }
  h1 { font-size: 28px; margin: 0 0 4px; letter-spacing: 1px; }
  .range { color: var(--vscode-descriptionForeground); margin-bottom: 4px; font-size: 13px; }
  .verdict { font-size: 18px; font-style: italic; margin: 16px 0 28px; padding: 14px 18px; background: var(--vscode-editorWidget-background); border-left: 4px solid #6c5ce7; border-radius: 4px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
  .metric { padding: 16px; border-radius: 8px; background: var(--vscode-editorWidget-background); border: 1px solid var(--vscode-widget-border, transparent); }
  .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.4px; color: var(--vscode-descriptionForeground); }
  .value { font-size: 32px; font-weight: 800; margin: 6px 0 4px; font-variant-numeric: tabular-nums; }
  .caption { font-size: 13px; color: var(--vscode-descriptionForeground); font-style: italic; }
  .metric-good .value { color: #00b894; }
  .metric-bad .value { color: #e17055; }
  .metric-neutral .value { color: var(--vscode-foreground); }
  .footer { margin-top: 24px; font-size: 12px; color: var(--vscode-descriptionForeground); text-align: center; }
</style></head>
<body>
  <h1>📋 Weekly Hygiene Report</h1>
  <div class="range">${escapeHtml(startDate)} → ${escapeHtml(endDate)} · ${report.totalEvents} events tracked</div>
  <div class="verdict">${escapeHtml(report.verdict)}</div>
  <div class="grid">${cards}</div>
  <div class="footer">Git Gud · git gud or get gud at git</div>
</body></html>`;
}
