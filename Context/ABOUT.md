# Git Gud

## What this is

A VS Code extension that watches your Git activity and reacts like a toxic esports gaming coach — roasting bad Git habits, scoring behavior, and gamifying your repo hygiene. Built for HackMelbourne ("Trend Hackers" team).

## Tech stack

- TypeScript (npm workspaces monorepo)
- VS Code Extension API (`packages/vscode`)
- Shared core logic (`packages/core`)
- Next.js companion site (`packages/web`, placeholder)
- AI roast generation via Ollama (default) or Gemini, with 60+ template fallbacks

## Architecture

Monorepo with three workspaces:

- **`packages/core`** — Pure logic: Git event analysis, scoring, roast selection, achievements, personality classification. No VS Code or DOM dependencies, so it can be reused by the web package or tested in isolation.
- **`packages/vscode`** — The extension itself: detects Git events, renders the sidebar dashboard, fires notifications, plays sound effects, and calls the AI provider. Talks to `core` for all decisioning.
- **`packages/web`** — Next.js site, currently a placeholder. <!-- TODO: verify intended purpose (landing page? leaderboard?) -->

AI roasts: Ollama is the default (local, free); Gemini is configurable via the sidebar settings. When neither is reachable, the extension falls back to a static template library.

## Current state

MVP is shipped: sidebar dashboard, sound effects, commands, Ollama API settings UI, and per-block merge conflict tracking are all in place (see recent commits). Features listed in the README — rank ladder, 20 achievements, 7 personality archetypes, Teammate Suffering Index — are implemented in `packages/core`. <!-- TODO: verify completeness of each subsystem -->
