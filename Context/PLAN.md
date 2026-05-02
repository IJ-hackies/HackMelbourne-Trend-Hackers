# Plan

Hackathon-aligned roadmap. Stages 1 and 2 are shipped; later stages are post-hackathon work.

## Stage 1 — Core MVP ✅

Shared logic + VS Code extension with sidebar dashboard, scoring, roasts (template + Ollama + Gemini), achievements, personality, suffering index, sound effects, and per-block merge conflict tracking.

## Stage 2 — Hackathon shareability ✅

Features that turn the extension into a demoable, shareable, social-media-friendly product:

- Scripted **demo replay** command (`gitgud.runDemo`) for predictable pitch demos
- **Rank-card SVG export** (`gitgud.exportRankCard`) with Share-to-X tweet intent
- **Weekly Hygiene Report** webview panel for the "useful" angle
- **Voice roasts** (`gitgud.voiceEnabled`) for memeable audio moments
- **Sidebar Actions card** — primary surface for all new commands

## Stage 3 — Polish & distribution

Post-hackathon, only if the project continues:

- Hero GIF at the top of `README.md` (record `gitgud.runDemo` once)
- README polish: tagline, install steps, screenshots, badges
- VS Code Marketplace packaging: icon, screenshots, publisher setup, CI publish workflow

## Stage 4 — AI provider polish (deferred)

Originally planned as Stage 2; deprioritized for the hackathon. Surface clear errors when providers are unreachable, cache repeated roast prompts, let users pick a model from the sidebar without editing JSON.

## Stage 5 — Web companion (deferred)

`packages/web` is currently a Next.js stub. Decide its purpose (landing page? shareable rank cards via URL? team leaderboard?) and build the first version.

## Stage 6 — Stretch

Multiplayer / team features: shared leaderboards, weekly rivalries, team-level Teammate Suffering Index aggregation.
