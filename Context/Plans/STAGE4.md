# Stage 4 — VS Code Extension MVP

**Depends on:** Stage 1 (monorepo, `packages/vscode/` scaffold), Stage 2 (`analyzeEvent()` and all analyzers), Stage 3 (roast generation, scoring engine, rank/achievement systems)

## Goal

Wire the core package into a working VS Code extension that detects real git activity, runs it through analysis/roast/scoring, and surfaces results to the developer via notifications and a sidebar dashboard. This is where Git Gud becomes a real product — everything before this was library code.

## Approach

Outside-in, starting from event detection (the sensor layer), then notification output (the simplest feedback loop), then persistence (so state survives restarts), then the sidebar webview (the richest UI). This order means we get a working demo loop — do something in git, get roasted — as early as possible, then layer on polish.

Sound effects come last because they're optional and depend on the notification system already working.

---

## Stage 4.1 — Git Event Detection

**Goal:** Detect git activity in the workspace and emit structured `GitEvent` objects that the core package can consume.

**Deliverables:**
- `packages/vscode/src/git/event-detector.ts` — main event detection module:
  - Subscribe to the VS Code Git API (`vscode.extensions.getExtension('vscode.git')`) for:
    - Commits (repository state changes, HEAD changes)
    - Branch switches (active branch change)
    - Push events (if exposed by the API)
  - File system watchers on `.git/` for events the Git API doesn't surface:
    - `.git/refs/` changes — detect force pushes by comparing ref history
    - `.git/MERGE_HEAD` — detect merge conflicts in progress
    - `.git/rebase-merge/` or `.git/rebase-apply/` — detect active rebases
    - `.git/HEAD` — backup branch switch detection
  - Debounce rapid file system events (git operations touch multiple files in quick succession)
- `packages/vscode/src/git/event-mapper.ts` — converts raw VS Code Git API / file watcher signals into `GitEvent` objects from `@gitgud/core`
  - Extract commit message, branch name, file change stats from the Git API
  - Infer event type (commit, branch switch, force push, merge conflict, rebase) from the signal source
- `packages/vscode/src/git/types.ts` — any extension-specific types needed beyond what core provides (e.g. `RawGitSignal` before mapping)

**Exit criteria:** With the extension running in the Extension Development Host, making a commit or switching branches logs a correctly-shaped `GitEvent` to the output channel. Force push and merge conflict detection work when the corresponding `.git/` files appear.

---

## Stage 4.2 — Notification Popups

**Goal:** Show roast + advice as VS Code notifications when git events are detected. This is the minimum viable feedback loop.

**Deliverables:**
- `packages/vscode/src/notifications/roast-notifier.ts` — takes an `AnalysisResult` and roast output from core, shows VS Code notifications:
  - `vscode.window.showInformationMessage` for info-level verdicts
  - `vscode.window.showWarningMessage` for warnings
  - `vscode.window.showErrorMessage` for critical verdicts (force push, direct main push)
  - Notification text: the roast line first, then the genuine advice
  - "View Details" button on notifications that opens the sidebar (once it exists — stub for now)
- `packages/vscode/src/extension.ts` — wire up the event pipeline:
  - Event detector emits `GitEvent` → call `analyzeEvent()` from core → call roast generator from core → call scoring from core → pass to notifier
  - Register the pipeline on extension activation

**Exit criteria:** Making a bad commit (e.g. message "fix") in the Extension Development Host triggers a notification with a roast and advice. Different severity levels use different notification types.

---

## Stage 4.3 — Local Persistence

**Goal:** Store user stats so score, rank, achievements, and history survive extension restarts.

**Deliverables:**
- `packages/vscode/src/storage/state-manager.ts` — persistence layer using VS Code `globalState` API:
  - `loadState(): PlayerState` — reads accumulated stats from globalState
  - `saveState(state: PlayerState): void` — writes back after each event
  - `PlayerState` shape: current score, current rank, achievement progress, event history (capped — keep last N events), session timestamps, personality traits accumulator
  - Reset command: `gitgud.resetStats` registered in `package.json` contributions
- `packages/vscode/src/storage/migration.ts` — version the state schema so future changes don't lose data (even a simple version number + migration function is enough)
- Update the pipeline in `extension.ts`: load state on activation, update state after each event, save state after each update

**Exit criteria:** Make several commits, reload the extension (Developer: Reload Window), verify stats are preserved. The reset command clears everything.

---

## Stage 4.4 — Sidebar Webview Dashboard

**Goal:** Build a rich sidebar panel showing the developer's rank, score, recent offenses, streaks, and achievements.

**Deliverables:**
- `packages/vscode/src/webview/sidebar-provider.ts` — implements `vscode.WebviewViewProvider`, registered for the `gitgud-sidebar` view in `package.json`
  - Sends current `PlayerState` to the webview on open and after each event
  - Receives messages from the webview (e.g. "show achievement details")
- `packages/vscode/src/webview/sidebar.html` + `packages/vscode/src/webview/sidebar.css` + `packages/vscode/src/webview/sidebar.js` — the webview content:
  - **Rank display** — current rank name, badge/icon, progress bar to next rank
  - **Score** — current git skill rating with recent change indicator (+/- from last event)
  - **Recent offenses** — scrollable list of last 10–15 events with roast excerpts and timestamps
  - **Active streaks** — current streak info (consecutive good commits, days without force push, etc.)
  - **Achievements** — grid of achievement badges, unlocked ones highlighted, locked ones greyed with progress hints
  - **Personality type** — current developer personality classification with description
  - **Teammate suffering score** — the comedic chaos metric, displayed prominently
- `packages/vscode/package.json` — register the view container and view:
  - Activity bar icon for Git Gud (custom icon or a built-in one)
  - `contributes.viewsContainers.activitybar` and `contributes.views`
- Style the webview to match VS Code's theme (use CSS variables from `vscode.css`)

**Exit criteria:** The sidebar opens from the activity bar, displays real data from the user's git activity, and updates live when new events are detected without needing to close/reopen.

---

## Stage 4.5 — Commands & Configuration

**Goal:** Register user-facing commands and settings so developers can control the extension.

**Deliverables:**
- `packages/vscode/package.json` — register commands and settings in `contributes`:
  - Commands:
    - `gitgud.showDashboard` — focus the sidebar
    - `gitgud.resetStats` — clear all stats (with confirmation prompt)
    - `gitgud.toggleSound` — enable/disable sound effects
    - `gitgud.showProfile` — show a summary notification with current rank and stats
  - Configuration (`contributes.configuration`):
    - `gitgud.enabled` — master on/off toggle (default: true)
    - `gitgud.soundEnabled` — sound effects toggle (default: true)
    - `gitgud.notificationsEnabled` — notification popup toggle (default: true)
    - `gitgud.roastIntensity` — `"mild" | "medium" | "savage"` (default: `"medium"`)
- `packages/vscode/src/config.ts` — read settings from `vscode.workspace.getConfiguration('gitgud')`, react to setting changes via `onDidChangeConfiguration`
- Update notification and event pipeline to respect `enabled`, `notificationsEnabled`, and `roastIntensity` settings

**Exit criteria:** All commands appear in the command palette. Disabling `gitgud.enabled` stops event detection. Changing `roastIntensity` changes the tone of subsequent roasts.

---

## Stage 4.6 — Sound Effects

**Goal:** Add esports-style audio cues on git events for maximum drama. Optional and toggleable.

**Deliverables:**
- `packages/vscode/media/sounds/` — audio files (short, <1s clips):
  - Rank up jingle
  - Rank down sad trombone
  - Achievement unlock fanfare
  - Critical offense alert (force push, main push)
  - General event blip
  - Format: `.mp3` or `.ogg`, kept small for extension bundle size
- `packages/vscode/src/audio/sound-player.ts` — plays sounds via the webview's `Audio` API (VS Code extensions can't play audio natively — route through the sidebar webview)
  - Respects the `gitgud.soundEnabled` setting
  - Volume control (keep it reasonable by default)
- Wire sound triggers into the event pipeline alongside notifications

**Exit criteria:** With sound enabled, a force push plays the alert sound. A rank-up plays the jingle. Toggling `gitgud.soundEnabled` to false silences everything. Sounds don't play if the sidebar webview isn't open (graceful degradation, not an error).

---

## Open Questions

- **Git API availability:** The VS Code Git extension exposes a limited API. Some events (like force push) aren't directly observable and must be inferred from `.git/` file changes. The exact detection reliability will only be known during implementation — be prepared to document which events are reliably detected vs. best-effort.
- **Webview framework:** The breakdown assumes vanilla HTML/CSS/JS for the sidebar webview. If the team prefers a lightweight framework (Svelte, Preact) for the webview, that's fine but adds a build step for the extension. Decide before starting 4.4.
- **Sound licensing:** Audio clips need to be royalty-free or original. Source these before 4.6 — don't leave placeholder silences.
