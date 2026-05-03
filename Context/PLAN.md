# Plan

Hackathon-aligned roadmap. Stages 1 and 2 are shipped; later stages are post-hackathon work.

## Stage 1 — Core MVP ✅

Shared logic + VS Code extension with sidebar dashboard, scoring, roasts (template + Ollama + Gemini), achievements, personality, sound effects, and per-block merge conflict tracking.

## Stage 2 — Hackathon shareability ✅

Features that turn the extension into a demoable, shareable, social-media-friendly product:

- Scripted **demo replay** command (`gitgud.runDemo`) for predictable pitch demos
- **Rank-card SVG export** (`gitgud.exportRankCard`) with Share-to-X tweet intent
- **Weekly Hygiene Report** webview panel for the "useful" angle
- **Voice roasts** (`gitgud.voiceEnabled`) for memeable audio moments
- **Sidebar Actions card** — primary surface for all new commands
- **In-sidebar Source Control card** — branch picker, AI-generated 1-line commit messages (`clean` / `savage` style toggle), split Commit / Commit & Push / Amend button, live changes list via `vscode.git` API
- **Sidebar UX pass** — collapsible cards (all except Rank + Personality) with persisted state, animated expand/collapse, redesigned Stats list, removal of the Suffering Index
- **Roast intensity setting** (`roastIntensity`) — mild/medium/savage severity adjustment
- **Team sync** — `gitgud.shareToTeam` command + web package leaderboard/sync API routes
- **Parallel roast generation** — individual and combined roasts generated concurrently
- **Tag-based meme/trend selection** — `memes.ts` refactored from random per-category sampling to a verdict-driven taxonomy: structured `MemeCategory` records with vibe tags + descriptions + per-term notes, a typed `VERDICT_TAGS` bridge, and `pickMemePoolForVerdicts` that surfaces the top-3 tag-matching categories per event
- **Positive (hype) feedback** — clean events trigger `generateHype` (AI hype prompt + 12 hype templates fallback) instead of a static "Clean action. Shocking." line
- **Anti-template prompt + notifier hardening** — banned em-dash label openers and "Bro,"/"Bruh,"/"Yo,"/"Ayo," crutches via prompt rules + `stripEmDashTemplate` sanitizer; replaced the notifier's hardcoded `prefix — message` join with a varied `composeRoastLine` (rotates joiners, sometimes drops the prefix entirely)
- **5-provider AI support** — added Claude, ChatGPT, and Grok clients alongside Ollama and Gemini. Default provider flipped to Gemini. Model selection is a per-provider strict-enum dropdown; each provider stores its own `<provider>ApiKey` + `<provider>Model`. Sidebar Settings card shows only the active provider's fields (others stored in hidden inputs); changing the provider auto-saves to swap the visible fields. Shared prompt logic extracted to `roasts/prompt-shared.ts` and `roasts/models.ts`

## Stage 3 — Polish & distribution (partially started)

- ✅ **Static landing site** in `site/` (single HTML + CSS, no build) auto-deployed to GitHub Pages via `.github/workflows/pages.yml` on push to `main`.
- Hero GIF at the top of `README.md` and on the landing site (record `gitgud.runDemo` once)
- README polish: tagline, install steps, screenshots, badges
- VS Code Marketplace packaging: icon, screenshots, publisher setup, CI publish workflow
- Once published: swap site CTAs from "install via VSIX" to one-click Marketplace install + add Marketplace badges

## Stage 4 — AI provider polish (partially shipped)

Originally planned as Stage 2; deprioritized for the hackathon and partially landed in Stage 2-late.

- ✅ **Sidebar model picker** — strict per-provider model dropdown (no more JSON edits).
- ✅ **Multi-provider support** — Gemini, Claude, ChatGPT, Grok, Ollama all selectable.
- Surface clearer errors when providers are unreachable (currently logs to console + falls through to templates).
- Cache repeated roast prompts so identical events don't re-call the API.

## Stage 5 — Web companion (partially started)

`packages/web` has two API routes (`/api/leaderboard`, `/api/sync`, in-memory storage) plus frontend pages (landing `page.tsx`, `profile/`, `leaderboard/`, `roast-card/`, `wrapped/`). Remaining work: persistent storage (replace in-memory store), authentication, and tightening the UI of the existing pages. Note: the public-facing marketing landing now lives in `site/` (Stage 3), not here — `packages/web` is the dynamic companion app.