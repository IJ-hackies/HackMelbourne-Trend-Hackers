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

- **`packages/core`** — Pure logic: Git event analysis, scoring, roast selection, achievements, personality classification, suffering index, weekly report metrics. No VS Code or DOM dependencies, so it can be reused by the web package or tested in isolation.
- **`packages/vscode`** — The extension itself: detects Git events, renders the sidebar dashboard, fires notifications, plays sound effects, calls the AI provider, and hosts user-facing commands. Talks to `core` for all decisioning.
- **`packages/web`** — Next.js site, intentionally deferred for the hackathon. Not actively developed; build-time only.

The **sidebar** is the canonical user surface. New user-facing features should add a button to the sidebar's Actions card and back it with a registered command. The command palette is a fallback, not the primary path.

AI roasts: Ollama is the default (local, free); Gemini is configurable via the sidebar settings. When neither is reachable, the extension falls back to a static template library.

## Features

- **AI roasts** with template fallback (60+ hand-written roasts)
- **Scoring & rank ladder** — Bronze → Silver → Gold → Platinum → Diamond
- **20 achievements** unlocked from real Git behavior
- **7 personality archetypes** classified from stats
- **Teammate Suffering Index** (0–100, with verdict titles)
- **Per-block merge conflict tracking** — individual roasts per resolution decision
- **Sidebar dashboard** — rank, score, suffering, personality, recent offenses, achievements, stats, settings, and an Actions card
- **Demo replay** (`gitgud.runDemo`) — injects a scripted sequence of cursed Git events for instant pitch material; bypasses the live Git watcher
- **Rank-card export** (`gitgud.exportRankCard`) — saves a 1200×630 SVG "rap sheet" with rank, archetype, suffering, and top crimes; offers Open + Share-to-X (tweet intent URL)
- **Weekly Hygiene Report** (`gitgud.weeklyReport`) — webview panel showing 7-day metrics (commits, force pushes, pushes to main, merge conflicts, branch switches, avg commit size, score delta, savage roast rate, clean streak) each with roast captions and a top-level verdict
- **Voice roasts** (`gitgud.voiceEnabled`) — optional in-webview SpeechSynthesis for savage roasts and rank-ups

## Configuration keys (`gitgud.*`)

- `enabled` — master toggle
- `aiProvider` — `ollama` (default) or `gemini`
- `ollamaApiKey`, `ollamaModel`, `ollamaBaseUrl`, `geminiApiKey`
- `voiceEnabled` — TTS toggle

## Commands

- `gitgud.showDashboard`, `gitgud.resetStats`, `gitgud.setApiKey` (legacy MVP)
- `gitgud.runDemo`, `gitgud.exportRankCard`, `gitgud.weeklyReport` (hackathon shareability)

## Decisions log

- **Live commit-message warnings** were prototyped (`packages/vscode/src/git/commit-message-watcher.ts`) and removed. Polling `repo.inputBox.value` worked but added noise without enough hackathon ROI.
- **Web rank-card landing page** was scoped, planned, and explicitly cut from hackathon scope. The SVG export is sufficient for sharing.
