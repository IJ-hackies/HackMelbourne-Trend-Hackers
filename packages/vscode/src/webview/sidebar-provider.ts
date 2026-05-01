import type { PlayerState } from '@git-gud/core';
import * as vscode from 'vscode';

export class SidebarProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _state?: PlayerState;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this._getHtml();

        if (this._state) {
            this.update(this._state);
        }
    }

    update(state: PlayerState): void {
        this._state = state;
        if (this._view) {
            this._view.webview.postMessage({ type: 'update', state });
        }
    }

    private _getHtml(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Git Gud Dashboard</title>
    <style>
        :root {
            --bg: var(--vscode-editor-background, #1e1e1e);
            --fg: var(--vscode-editor-foreground, #cccccc);
            --accent: var(--vscode-button-background, #0e639c);
            --accent-fg: var(--vscode-button-foreground, #ffffff);
            --warn: #cca700;
            --crit: #f14c4c;
            --success: #4ec9b0;
            --border: var(--vscode-panel-border, #3c3c3c);
        }
        body { font-family: var(--vscode-font-family, sans-serif); background: var(--bg); color: var(--fg); margin: 0; padding: 12px; }
        .card { border: 1px solid var(--border); border-radius: 6px; padding: 10px; margin-bottom: 10px; }
        .card h3 { margin: 0 0 6px; font-size: 13px; text-transform: uppercase; opacity: 0.7; }
        .rank { font-size: 18px; font-weight: bold; color: var(--accent); }
        .score { font-size: 24px; font-weight: bold; }
        .score-delta { font-size: 12px; opacity: 0.8; }
        .offense { padding: 6px; border-radius: 4px; margin-bottom: 4px; background: rgba(255,255,255,0.03); }
        .offense.critical { border-left: 3px solid var(--crit); }
        .offense.warning { border-left: 3px solid var(--warn); }
        .offense.info { border-left: 3px solid var(--success); }
        .achievements { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 6px; }
        .badge { padding: 6px; border-radius: 4px; text-align: center; font-size: 11px; opacity: 0.4; background: rgba(255,255,255,0.03); }
        .badge.unlocked { opacity: 1; background: rgba(78,201,176,0.15); border: 1px solid var(--success); }
        .personality { font-size: 14px; font-weight: bold; }
        .suffering { font-size: 20px; font-weight: bold; color: var(--crit); }
        .progress { width: 100%; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--accent); transition: width 0.3s; }
    </style>
</head>
<body>
    <div class="card">
        <h3>Rank</h3>
        <div class="rank" id="rank">Loading...</div>
        <div class="progress"><div class="progress-fill" id="rank-progress"></div></div>
    </div>
    <div class="card">
        <h3>Git Skill Score</h3>
        <div class="score" id="score">0</div>
        <div class="score-delta" id="score-delta"></div>
    </div>
    <div class="card">
        <h3>Personality</h3>
        <div class="personality" id="personality">-</div>
        <div style="font-size:11px; opacity:0.7; margin-top:4px;" id="personality-desc">-</div>
    </div>
    <div class="card">
        <h3>Teammate Suffering</h3>
        <div class="suffering" id="suffering">0/100</div>
        <div style="font-size:11px; opacity:0.7;" id="suffering-title">-</div>
    </div>
    <div class="card">
        <h3>Recent Offenses</h3>
        <div id="offenses"></div>
    </div>
    <div class="card">
        <h3>Achievements</h3>
        <div class="achievements" id="achievements"></div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        window.addEventListener('message', (event) => {
            const msg = event.data;
            if (msg.type === 'update') {
                render(msg.state);
            }
        });

        function render(state) {
            document.getElementById('rank').textContent = state.rank.name;
            document.getElementById('score').textContent = state.score.total;
            const delta = state.score.delta;
            const deltaEl = document.getElementById('score-delta');
            deltaEl.textContent = delta > 0 ? '+' + delta : delta < 0 ? String(delta) : '';
            deltaEl.style.color = delta > 0 ? 'var(--success)' : delta < 0 ? 'var(--crit)' : 'var(--fg)';

            document.getElementById('personality').textContent = state.personality.type;
            document.getElementById('personality-desc').textContent = state.personality.description;
            document.getElementById('suffering').textContent = state.suffering.score + '/100';
            document.getElementById('suffering-title').textContent = state.suffering.title;

            // Rank progress
            const tiers = [
                {id:'bronze',threshold:0},
                {id:'silver',threshold:100},
                {id:'gold',threshold:300},
                {id:'platinum',threshold:600},
                {id:'diamond',threshold:1000}
            ];
            const currentIdx = tiers.findIndex(t => t.id === state.rank.id);
            const nextThreshold = tiers[currentIdx + 1]?.threshold || state.rank.threshold + 500;
            const progress = Math.max(0, Math.min(100, ((state.score.total - state.rank.threshold) / (nextThreshold - state.rank.threshold)) * 100));
            document.getElementById('rank-progress').style.width = progress + '%';

            // Offenses
            const offenses = state.stats.eventHistory.slice(-15).reverse();
            const offContainer = document.getElementById('offenses');
            offContainer.innerHTML = '';
            for (const ev of offenses) {
                const div = document.createElement('div');
                div.className = 'offense ' + (ev.metadata?.severity || 'info');
                div.textContent = new Date(ev.timestamp).toLocaleTimeString() + ' — ' + ev.type;
                offContainer.appendChild(div);
            }

            // Achievements
            const achContainer = document.getElementById('achievements');
            achContainer.innerHTML = '';
            for (const a of state.achievements) {
                const div = document.createElement('div');
                div.className = 'badge' + (a.unlocked ? ' unlocked' : '');
                div.title = a.description;
                div.textContent = a.name;
                achContainer.appendChild(div);
            }
        }

        // Request initial data
        vscode.postMessage({ type: 'ready' });
    </script>
</body>
</html>`;
    }
}
