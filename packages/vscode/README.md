# Git Gud — Competitive Git Extension

**Gamify your Git workflow with esports-style roasts and rankings.**

## Features

- **Real-time Git monitoring** — Watches your commits, pushes, merges, and more
- **Esports-style roasts** — Get roasted for bad Git habits (60+ templates + AI-powered)
- **Rank ladder** — Bronze Committer → Diamond Git Wizard
- **20+ Achievements** — Unlock badges like "Force Push Felon" and "Merge Conflict Survivor"
- **Personality classifier** — Discover if you're a Commit Goblin, Chaos Mage, or Perfectionist
- **Team leaderboard** — Share stats with your team and compete weekly
- **Sound effects** — Meme-worthy audio feedback for your Git crimes
- **AI roast generation** — Ollama (local) or Gemini API for custom roasts

## Quick Start

1. Install the extension from VS Code Marketplace
2. Open the **Git Gud** sidebar from the Activity Bar
3. Start coding — the extension activates automatically when it detects a `.git` folder
4. Make a commit and get roasted!

## Commands

| Command | Description |
|---------|-------------|
| `Git Gud: Show Dashboard` | Open the sidebar |
| `Git Gud: Reset Stats` | Wipe all progress |
| `Git Gud: Set API Key` | Configure AI provider key |
| `Git Gud: Run Demo` | Demo a roast notification |
| `Git Gud: Export Rank Card` | Save rank card as SVG |
| `Git Gud: Weekly Hygiene Report` | View weekly report |
| `Git Gud: Share Stats to Team` | Sync stats to team leaderboard |

## Settings

- `gitgud.enabled` — Enable/disable monitoring
- `gitgud.roastIntensity` — mild / medium / savage
- `gitgud.notificationsEnabled` — Show notification popups
- `gitgud.aiProvider` — ollama / gemini
- `gitgud.ollamaApiKey` — API key for Ollama
- `gitgud.ollamaModel` — Ollama model name
- `gitgud.ollamaBaseUrl` — Ollama API base URL
- `gitgud.geminiApiKey` — Gemini API key
- `gitgud.voiceEnabled` — Speak roasts out loud
- `gitgud.teamCode` — Team code for shared leaderboard
- `gitgud.syncUrl` — URL to sync stats to web leaderboard

## Team Features

Share your Git crimes with the world:

1. Set your team code in settings
2. Run **"Share Stats to Team"** command after a session
3. View your team leaderboard at the web companion

## License

MIT — HackMelbourne Trend Hackers
