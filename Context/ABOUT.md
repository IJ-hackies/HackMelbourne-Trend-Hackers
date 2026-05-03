# Git Gud

## What this is

A VS Code extension that watches your Git activity and reacts like a toxic esports gaming coach — roasting bad Git habits, scoring behavior, and gamifying your repo hygiene. Built for HackMelbourne ("Trend Hackers" team). Theme target: useful + meme-worthy + socially shareable.

## Tech stack

- TypeScript (npm workspaces monorepo)
- VS Code Extension API (`packages/vscode`)
- Shared core logic (`packages/core`)
- AI roast generation via Ollama (default: `deepseek-v4-flash:cloud` on `https://ollama.com/api`) or Gemini, with 60+ template fallbacks
- Meme/trend taxonomy (`memes.ts`) — 13 structured `MemeCategory` records (id, description, vibe tags, terms, optional per-term notes). Selection is verdict-driven: a typed `VERDICT_TAGS` table maps every verdict pattern to a 7-tag vibe vocabulary (`destructive, chaotic, lazy, tryhard, cringe, dramatic, absurd`), `pickMemePoolForVerdicts` scores categories by tag-overlap and surfaces the top 3 with sample terms in the prompt. A separate `HYPE_VOCAB` curated list powers positive-feedback messages
- Optional Web Speech API for voice TTS roasts (in-webview, no external service)

## Architecture

Monorepo with three workspaces:

- **`packages/core`** — Pure logic: Git event analysis, scoring, roast selection, achievements, personality classification, weekly report metrics. No VS Code or DOM dependencies, so it can be reused by the web package or tested in isolation.
- **`packages/vscode`** — The extension itself: detects Git events (file-system watcher on `.git/`), renders the sidebar dashboard, fires notifications, plays sound effects, calls the AI provider, hosts user-facing commands, and drives the in-sidebar Source Control card via the built-in `vscode.git` extension API. Talks to `core` for all decisioning.
- **`packages/web`** — Next.js 16 companion site with API routes (`/api/leaderboard`, `/api/sync` — in-memory storage, no database) and frontend pages (landing `page.tsx`, `profile/`, `leaderboard/`, `roast-card/`, `wrapped/`). Dependencies include React 19, Tailwind 4, and `@git-gud/core`. Not the same surface as `site/` (see below).
- **`site/`** — Static marketing landing page (single `index.html` + `styles.css`, no build step) auto-deployed to GitHub Pages by `.github/workflows/pages.yml` on push to `main`. Hosts the public-facing pitch and "Open in VS Code" deep link. Separate from `packages/web` so it can ship without a Node runtime.

The **sidebar** is the canonical user surface. New user-facing features should add a button to the sidebar's Actions card and back it with a registered command. The command palette is a fallback, not the primary path.

Sidebar card order (top → bottom): **Rank → Source Control → Personality → Recent Offenses → Achievements → Stats → Actions → Settings**. Rank and Personality are non-collapsible; every other card is collapsible with an animated chevron header, and per-card collapse state persists in `globalState` under the key `gitgud.collapsedSections`.

The sidebar uses a hardcoded brand palette (lime `#c8ff00` accent, hot pink `#ff3d6a`, dark `#0a0a0b` / `#111114` panels, JetBrains Mono labels, Inter body) and inline Lucide-style SVG icons throughout — it does not inherit VS Code theme variables, so it looks the same on light and dark themes. This matches `site/` for brand consistency.

AI roasts: Ollama is the default (`deepseek-v4-flash:cloud` on `https://ollama.com/api`); Gemini is configurable via the sidebar settings. When neither is reachable, the extension falls back to a static template library. Roasts are generated in parallel (individual per-verdict + combined) for speed.

## Features

- **AI roasts** with template fallback (60+ hand-written roasts). Prompts include anti-template rules (no em-dash label openers, no "Bro," openers, length/structure variation) and a post-process sanitizer (`stripEmDashTemplate`) strips any em dashes and leading "Bro,/Bruh,/Yo,/Ayo," that slip through
- **Positive (hype) feedback** — when every verdict on an event is `clean`, the combined-roast path calls `generateHype` instead of returning a static line. Hype generation has its own system prompt (celebratory, in-voice, same anti-template rules), draws from `HYPE_VOCAB`, and falls back to 12 hand-written `HYPE_TEMPLATES` when no AI provider is reachable
- **Scoring & rank ladder** — Bronze → Silver → Gold → Platinum → Diamond
- **20 achievements** unlocked from real Git behavior
- **7 personality archetypes** classified from stats
- **Per-block merge conflict tracking** — individual roasts per resolution decision
- **Recent Offenses with expandable advice** — each event row in the sidebar can be clicked to reveal a constructive tip (the `advice` field of the underlying `Roast`) in a lime-tinted callout. Stored on `StoredEvent.roastAdvice`. The list is scrollable inside the card (max-height ~460px).
- **Sidebar dashboard** — rank, in-sidebar Source Control card, personality, recent offenses, achievements, stats, Actions card, and AI roast settings.
- **In-sidebar Source Control** — branch dropdown (local + remote, ★ marks active, confirm-on-switch, picking a remote branch creates a tracking local), auto-growing commit message textarea with bottom-right Generate chip that calls Ollama/Gemini for a 1-line message (overwrites whatever's in the box; tone controlled by `gitgud.commitMessageStyle`), split Commit button (Commit / Commit & Push / Amend Last Commit), changes list with M/A/D/U/C status colors. Commit auto-stages everything (`all: true`); push auto-sets upstream on first push and surfaces a "Pull & Retry" affordance on non-fast-forward. Reactivity via debounced (~150ms) `vscode.git` `repo.state.onDidChange`. The card hides entirely when no workspace, no Git repo, or `vscode.git` extension is unavailable. Roasts/scoring fire as normal because the existing watcher detects the resulting Git activity.
- **Demo replay** (`gitgud.runDemo`) — injects a scripted sequence of cursed Git events for instant pitch material; bypasses the live Git watcher
- **Rank-card export** (`gitgud.exportRankCard`) — saves a 1200×630 SVG "rap sheet" with rank, archetype, and top crimes; offers Open + Share-to-X (tweet intent URL)
- **Weekly Hygiene Report** (`gitgud.weeklyReport`) — webview panel showing 7-day metrics (commits, force pushes, pushes to main, merge conflicts, branch switches, avg commit size, score delta, savage roast rate, clean streak) each with roast captions and a top-level verdict
- **Voice roasts** (`gitgud.voiceEnabled`) — optional in-webview SpeechSynthesis for savage roasts and rank-ups
- **Roast intensity** (`gitgud.roastIntensity`) — `mild`, `medium`, or `savage`; adjusts the severity of displayed notifications
- **Team sync** (`gitgud.shareToTeam`) — syncs player stats to a shared team leaderboard via the web package's `/api/sync` endpoint; configured by `teamCode` and `syncUrl`

## Configuration keys (`gitgud.*`)

- `enabled` — master toggle
- `aiProvider` — `ollama` (default) or `gemini`
- `ollamaApiKey`, `ollamaModel`, `ollamaBaseUrl`, `geminiApiKey`
- `voiceEnabled` — TTS toggle
- `commitMessageStyle` — `clean` (Conventional Commits, default) or `savage` (toxic-coach roast); used by the in-sidebar Source Control card's AI Generate button
- `roastIntensity` — `mild`, `medium`, or `savage` (default); adjusts notification severity level
- `notificationsEnabled` — toggle notification popups
- `teamCode` — team code for shared leaderboard
- `syncUrl` — URL for team stats sync (default: `http://localhost:3000/api/sync`)

## Commands

- `gitgud.showDashboard`, `gitgud.resetStats`, `gitgud.setApiKey` (legacy MVP)
- `gitgud.runDemo`, `gitgud.exportRankCard`, `gitgud.weeklyReport` (hackathon shareability)
- `gitgud.shareToTeam` (team leaderboard sync)

## Decisions log

- **Live commit-message warnings** were prototyped (`packages/vscode/src/git/commit-message-watcher.ts`) and removed. Polling `repo.inputBox.value` worked but added noise without enough hackathon ROI.
- **Web rank-card landing page** was scoped, planned, and explicitly cut from hackathon scope. The SVG export is sufficient for sharing.
- **Teammate Suffering Index** was removed wholesale (Stage 2-late). Score/rank/achievements/personality already cover the "you're bad at git" angle and the suffering bar was redundant pixel real-estate. The `calculateSuffering` export, `SufferingResult` type, `suffering.ts` source file, the SVG rank-card "TEAMMATE SUFFERING" block, and the sidebar Suffering card are all gone.
- **Source Control: simplified, not faithful.** The in-sidebar Source Control card deliberately does NOT mirror VS Code's full SCM panel — no staged/unstaged split, no per-file +/- buttons. One flat changes list, Commit auto-stages everything. The reasoning: Git Gud's job is roasting + gamification, not replacing SCM. Power users still have VS Code's real Source Control panel one click away. Likewise, branch switching always confirms (we picked safety over the one-click feel of VS Code's status-bar picker), and push handles no-upstream automatically but surfaces non-FF as a user-driven Pull & Retry rather than auto-rebasing.
- **Source Control AI prompt** sees `git diff HEAD` (≤1500 chars) plus `git status --porcelain` so new/deleted files aren't under-emphasized. Output is sanitized: first line only, ≤72 chars, surrounding quotes/trailing periods stripped. 15s timeout. Generate is disabled when the working tree is clean or no AI key is configured.
- **Marketing site lives in `site/`, not `packages/web`.** GitHub Pages can't run Next.js API routes, and `packages/web` already hosts the API + companion frontend. A separate static `site/` (plain HTML/CSS, no build) keeps the public landing zero-runtime and lets the GH Pages workflow stay trivial.
- **Sidebar palette is hardcoded, not theme-aware.** The reskin matches `site/` exactly, so the sidebar looks the same on VS Code light themes as dark. Considered keeping `--vscode-*` variables as fallbacks; rejected because brand consistency with the landing page won out.
- **Meme selection is now verdict-driven, not random.** `pickMemePool` (random shuffle across all 13 categories) was replaced with `pickMemePoolForVerdicts`, which uses a 7-tag vibe vocabulary and a typed `VERDICT_TAGS` bridge to surface only the categories that fit the actual Git crime committed. Categories also gained descriptions and per-term notes so the prompt can convey *register* and not just slang. TypeScript enforces exhaustiveness — adding a new verdict pattern fails to compile until it's tagged. Refresh strategy is pure manual editing of `memes.ts`; no API/scraping/CI nag.
- **Positive feedback path added.** `generateCombinedRoast` previously returned a hardcoded `"Clean action. Shocking."` when every verdict was clean. It now calls `generateHype`, which uses a celebratory system prompt, draws from `HYPE_VOCAB`, and falls back to a 12-entry `HYPE_TEMPLATES` array. Same anti-template rules as roasts; severity is always `mild`.
- **Em dash was a notifier-side artifact, not a model-side one.** The notification template `${prefix} — ${roast.message}` was hard-baking the formula. Replaced with `composeRoastLine`, which rotates among `prefix. message`, `prefix... message`, `prefix, message` (lowercased), `prefix: message`, `prefix! message`, `prefix? message`, and 25% of the time drops the prefix entirely. Combined with prompt-side anti-em-dash rules and the `stripEmDashTemplate` sanitizer, em dashes are gone end-to-end.
