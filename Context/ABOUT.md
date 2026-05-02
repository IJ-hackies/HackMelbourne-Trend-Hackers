# Git Gud

## What this is

A VS Code extension that watches your Git activity and reacts like a toxic esports gaming coach — roasting bad Git habits, scoring behavior, and gamifying your repo hygiene. Built for HackMelbourne ("Trend Hackers" team). Theme target: useful + meme-worthy + socially shareable.

## Tech stack

- TypeScript (npm workspaces monorepo)
- VS Code Extension API (`packages/vscode`)
- Shared core logic (`packages/core`)
- AI roast generation via Ollama (default) or Gemini, with 60+ template fallbacks
- Optional Web Speech API for voice TTS roasts (in-webview, no external service)

## Architecture

Monorepo with three workspaces:

- **`packages/core`** — Pure logic: Git event analysis, scoring, roast selection, achievements, personality classification, weekly report metrics. No VS Code or DOM dependencies, so it can be reused by the web package or tested in isolation.
- **`packages/vscode`** — The extension itself: detects Git events (file-system watcher on `.git/`), renders the sidebar dashboard, fires notifications, plays sound effects, calls the AI provider, hosts user-facing commands, and drives the in-sidebar Source Control card via the built-in `vscode.git` extension API. Talks to `core` for all decisioning.
- **`packages/web`** — Next.js site, intentionally deferred for the hackathon. Not actively developed; build-time only.

The **sidebar** is the canonical user surface. New user-facing features should add a button to the sidebar's Actions card and back it with a registered command. The command palette is a fallback, not the primary path.

Sidebar card order (top → bottom): **Rank → Source Control → Personality → Recent Offenses → Achievements → Stats → Actions → Settings**. Rank and Personality are non-collapsible; every other card is collapsible with an animated chevron header, and per-card collapse state persists in `globalState` under the key `gitgud.collapsedSections`.

AI roasts: Ollama is the default (local, free); Gemini is configurable via the sidebar settings. When neither is reachable, the extension falls back to a static template library.

## Features

- **AI roasts** with template fallback (60+ hand-written roasts)
- **Scoring & rank ladder** — Bronze → Silver → Gold → Platinum → Diamond
- **20 achievements** unlocked from real Git behavior
- **7 personality archetypes** classified from stats
- **Per-block merge conflict tracking** — individual roasts per resolution decision
- **Sidebar dashboard** — rank, in-sidebar Source Control card, personality, recent offenses, achievements, stats, Actions card, and AI roast settings.
- **In-sidebar Source Control** — branch dropdown (local + remote, ★ marks active, confirm-on-switch, picking a remote branch creates a tracking local), auto-growing commit message textarea with bottom-right Generate chip that calls Ollama/Gemini for a 1-line message (overwrites whatever's in the box; tone controlled by `gitgud.commitMessageStyle`), split Commit button (Commit / Commit & Push / Amend Last Commit), changes list with M/A/D/U/C status colors. Commit auto-stages everything (`all: true`); push auto-sets upstream on first push and surfaces a "Pull & Retry" affordance on non-fast-forward. Reactivity via debounced (~150ms) `vscode.git` `repo.state.onDidChange`. The card hides entirely when no workspace, no Git repo, or `vscode.git` extension is unavailable. Roasts/scoring fire as normal because the existing watcher detects the resulting Git activity.
- **Demo replay** (`gitgud.runDemo`) — injects a scripted sequence of cursed Git events for instant pitch material; bypasses the live Git watcher
- **Rank-card export** (`gitgud.exportRankCard`) — saves a 1200×630 SVG "rap sheet" with rank, archetype, and top crimes; offers Open + Share-to-X (tweet intent URL)
- **Weekly Hygiene Report** (`gitgud.weeklyReport`) — webview panel showing 7-day metrics (commits, force pushes, pushes to main, merge conflicts, branch switches, avg commit size, score delta, savage roast rate, clean streak) each with roast captions and a top-level verdict
- **Voice roasts** (`gitgud.voiceEnabled`) — optional in-webview SpeechSynthesis for savage roasts and rank-ups

## Configuration keys (`gitgud.*`)

- `enabled` — master toggle
- `aiProvider` — `ollama` (default) or `gemini`
- `ollamaApiKey`, `ollamaModel`, `ollamaBaseUrl`, `geminiApiKey`
- `voiceEnabled` — TTS toggle
- `commitMessageStyle` — `clean` (Conventional Commits, default) or `savage` (toxic-coach roast); used by the in-sidebar Source Control card's AI Generate button

## Commands

- `gitgud.showDashboard`, `gitgud.resetStats`, `gitgud.setApiKey` (legacy MVP)
- `gitgud.runDemo`, `gitgud.exportRankCard`, `gitgud.weeklyReport` (hackathon shareability)

## Decisions log

- **Live commit-message warnings** were prototyped (`packages/vscode/src/git/commit-message-watcher.ts`) and removed. Polling `repo.inputBox.value` worked but added noise without enough hackathon ROI.
- **Web rank-card landing page** was scoped, planned, and explicitly cut from hackathon scope. The SVG export is sufficient for sharing.
- **Teammate Suffering Index** was removed wholesale (Stage 2-late). Score/rank/achievements/personality already cover the "you're bad at git" angle and the suffering bar was redundant pixel real-estate. The `calculateSuffering` export, `SufferingResult` type, `suffering.ts` source file, the SVG rank-card "TEAMMATE SUFFERING" block, and the sidebar Suffering card are all gone.
- **Source Control: simplified, not faithful.** The in-sidebar Source Control card deliberately does NOT mirror VS Code's full SCM panel — no staged/unstaged split, no per-file +/- buttons. One flat changes list, Commit auto-stages everything. The reasoning: Git Gud's job is roasting + gamification, not replacing SCM. Power users still have VS Code's real Source Control panel one click away. Likewise, branch switching always confirms (we picked safety over the one-click feel of VS Code's status-bar picker), and push handles no-upstream automatically but surfaces non-FF as a user-driven Pull & Retry rather than auto-rebasing.
- **Source Control AI prompt** sees `git diff HEAD` (≤1500 chars) plus `git status --porcelain` so new/deleted files aren't under-emphasized. Output is sanitized: first line only, ≤72 chars, surrounding quotes/trailing periods stripped. 15s timeout. Generate is disabled when the working tree is clean or no AI key is configured.
