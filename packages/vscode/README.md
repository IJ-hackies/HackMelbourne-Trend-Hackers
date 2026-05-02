# Git Gud — Competitive Git Extension

**Gamify your Git workflow with esports-style roasts and rankings.**

![Git Gud](icon.png)

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

1. Install the extension from VS Code: Marketplace
2. Open the 🔥 **Git Gud** sidebar from the Activity Bar
3. Start coding — the extension activates automatically when it detects a `.git` folder
4. Make a commit and get roasted!

## Commands

| Command | Description |
|---------|-------------|
| `Git Gud: Show Dashboard` | Open the sidebar |
| `Git Gud: Show Profile` | Display current rank/score |
| `Git Gud: Test Roast` | Demo a roast notification |
| `Git Gud: Reset Stats` | Wipe all progress |
| `Git Gud: Toggle Sound` | Enable/disable sound effects |
| `Git Gud: Set AI Model` | Switch between template/Ollama/Gemini |
| `Git Gud: Share to Team` | Sync stats to team leaderboard |

## Settings

- `gitgud.enabled` — Enable/disable monitoring
- `gitgud.roastIntensity` — mild / medium / savage
- `gitgud.aiProvider` — template / ollama / gemini
- `gitgud.aiModel` — Ollama model name (default: kimi-k2.6:cloud)
- `gitgud.apiKey` — API key for AI provider
- `gitgud.teamCode` — Team code for shared leaderboard
- `gitgud.syncUrl` — URL to sync stats to web leaderboard

## Team Features

Share your Git crimes with the world:

1. Set your team code in settings
2. Run **"Share to Team"** command after a session
3. View your team leaderboard at the web companion

## Web Companion

Visit the Git Gud web app for:
- Public leaderboards
- Shareable roast cards
- Git Wrapped yearly summaries
- Team rivalries

## License

MIT — HackMelbourne Trend Hackers
