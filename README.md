# Git Gud Coach

**Your Git habits, but make it ranked.** A VS Code extension that watches every commit, push, and merge — then roasts you for it like a toxic esports coach who drew the short straw and got assigned to a software dev.

Force-push to main? Bombardiro Crocodilo wouldn't ship that. Commit message says `"a"`? Negative aura. Six commits in eight minutes? The crowd is in shambles.

Behind the brainrot it's a real coaching tool: every Git event is scored, ranks climb (or fall) on a Bronze→Diamond ladder, and a Weekly Hygiene Report quantifies how unhinged your week actually was.

Built at **HackMelbourne** by team Trend Hackers.

---

## Features

### Roasts and hype
- **5 AI providers** — Gemini (default), Claude, ChatGPT, Grok, Ollama. Strict per-provider model dropdown in the sidebar; each provider stores its own key + model so switching never loses state.
- **Tag-based meme selection** — every Git crime maps to a curated subset of 13 internet/gaming/brainrot vocab categories (`destructive`, `chaotic`, `cringe`, `tryhard`, `dramatic`, `absurd`, `lazy`). The AI sees only the registers that fit the actual offense — no random brainrot in a force-push roast.
- **Positive feedback (hype)** — clean commits trigger a celebratory in-voice message instead of silence. Same anti-template rules; falls back to 12 hand-written hype templates if AI is unreachable.
- **Reaction images** — the AI picks a contextually appropriate reaction image from a curated pool and surfaces it in the sidebar's Latest Roast card.
- **60+ template fallbacks** — every provider has a working fallback for offline or rate-limited demos.

### Gamification
- **Rank ladder** — Bronze → Silver → Gold → Platinum → Diamond, with promotion/demotion notifications.
- **20 achievements** unlocked from real Git behavior (clean streaks, force-push counts, late-night commits, etc.).
- **7 personality archetypes** classified from your aggregate stats.
- **Per-block merge conflict tracking** — individual roasts for each resolution decision when you're in a conflict.

### Sidebar dashboard
Rank → Latest Roast → Source Control → Recent Offenses → Achievements → Stats → Actions → Settings. Every collapsible card persists state. Brand palette (lime / hot pink / dark) renders identically on light and dark themes.

### In-sidebar Source Control
Branch dropdown (local + remote, confirm-on-switch), AI-generated commit messages with a `clean` (Conventional Commits) / `savage` (toxic-coach) tone toggle, split Commit / Commit & Push / Amend Last Commit button, live changes list. Auto-stages on commit; auto-sets upstream on first push; Pull & Retry on non-fast-forward.

### Audio + share
- **Sound effects** — categorised by score impact: positive deltas play a random sound from `media/sounds/Good/`, negative deltas from `media/sounds/Bad/`. Volume slider in Settings (0–100%, defaults to 30%).
- **Voice roasts** — optional in-webview SpeechSynthesis for savage roasts and rank-ups (`gitgud.voiceEnabled`).
- **Rank-card export** (`gitgud.exportRankCard`) — 1200×630 SVG "rap sheet" with rank, archetype, top crimes; one click to share to X.
- **Weekly Hygiene Report** (`gitgud.weeklyReport`) — webview panel with 7-day metrics (commits, force-pushes, pushes to main, merge conflicts, branch switches, avg commit size, score delta, savage roast rate, clean streak), each with roast captions.
- **Demo replay** (`gitgud.runDemo`) — scripted sequence of cursed Git events for predictable pitch demos.
- **Team sync** (`gitgud.shareToTeam`) — push your stats to a shared team leaderboard via the web package's `/api/sync` endpoint.

---

## Setup

```bash
npm install
npm run build
```

Open `packages/vscode` in VS Code and press **F5** to launch the Extension Development Host. Open or create a Git repo in the dev window — the sidebar shows up under the Git Gud activity-bar icon.

Configure your AI provider in the sidebar's **Settings** card. Drop your key in, pick a model, save. Roasts kick in on the next Git event.

### Configuration keys (`gitgud.*`)

- `aiProvider` — `gemini` (default) | `claude` | `openai` | `xai` | `ollama`
- `<provider>ApiKey`, `<provider>Model` — one set per provider
- `ollamaBaseUrl` — only when Ollama is selected
- `commitMessageStyle` — `clean` | `savage` (used by the SC card's AI Generate)
- `roastIntensity` — `mild` | `medium` | `savage`
- `notificationsEnabled` — VS Code popup toggle
- `soundEnabled`, `soundVolume` (0.0–1.0)
- `voiceEnabled` — TTS toggle
- `teamCode`, `syncUrl` — team leaderboard

---

## Architecture

Monorepo with npm workspaces plus a static landing site:

- **`packages/core`** — pure logic: Git event analysis, scoring, roast selection, achievements, personality, weekly metrics. No VS Code or DOM dependencies. Owns the meme taxonomy (`memes.ts`), the verdict→tag bridge (`VERDICT_TAGS`), and per-provider AI clients (`roasts/{ollama,gemini,claude,openai,xai}.ts`) that share prompt construction via `prompt-shared.ts`.
- **`packages/vscode`** — the extension. Detects Git events (filesystem watcher on `.git/`), renders the sidebar, fires notifications and sounds, drives the in-sidebar Source Control card via the built-in `vscode.git` API.
- **`packages/web`** — Next.js companion app with `/api/leaderboard` and `/api/sync` routes plus frontend pages (landing, profile, leaderboard, roast-card, wrapped). In-memory storage; no DB.
- **`site/`** — static marketing landing page (single `index.html` + `styles.css`) auto-deployed to GitHub Pages.

---

## Commands

| Command | What it does |
|---|---|
| `Git Gud: Show Dashboard` | Focus the sidebar |
| `Git Gud: Run Demo` | Replay scripted events for a pitch demo |
| `Git Gud: Export Rank Card` | Save a shareable SVG rap sheet |
| `Git Gud: Weekly Hygiene Report` | Open the 7-day metrics panel |
| `Git Gud: Share Stats to Team` | Sync stats to the team leaderboard |
| `Git Gud: Reset Stats` | Wipe your scoring state |
| `Git Gud: Toggle Sound` | Quick toggle for sound effects |
