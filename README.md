# Git Gud

Competitive Git for dangerously overconfident developers. A VS Code extension that watches your Git activity and reacts like a toxic esports gaming coach.

## Features

- **AI-Powered Roasts** — Ollama (default) or Gemini generate contextual roasts for bad Git habits
- **Template Fallback** — 60+ hand-written roast templates when AI is unavailable
- **Scoring & Ranking** — Bronze to Diamond rank ladder with severity-based scoring
- **20 Achievements** — Unlock achievements for your Git crimes (and virtues)
- **Personality System** — 7 developer archetypes classified from your behavior
- **Teammate Suffering Index** — How much pain you inflict on collaborators (0-100)
- **Per-Block Merge Conflict Tracking** — Individual roasts for each conflict resolution decision
- **Rich Dashboard** — Full sidebar with rank, stats, offenses, achievements with progress bars
- **Shareable Rap Sheet** — Export your rank as a 1200×630 SVG card and tweet it (`Git Gud: Export Rank Card`)
- **Demo Mode** — One command (`Git Gud: Run Demo`) replays a sequence of cursed Git events for instant pitch material
- **Voice Roasts** — Optional TTS speaks savage roasts and rank-ups out loud (`gitgud.voiceEnabled`)

## Setup

```bash
npm install
npm run build
```

Then open `packages/vscode` in VS Code and press F5 to launch the extension host.

## Architecture

Monorepo with npm workspaces:
- `packages/core` — Shared logic (analysis, scoring, roasts, achievements, personality)
- `packages/vscode` — VS Code extension (UI, event detection, notifications)
- `packages/web` — Next.js site (placeholder)
