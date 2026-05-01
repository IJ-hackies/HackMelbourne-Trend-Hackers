# Git Gud

**Competitive Git for dangerously overconfident developers.**

Git Gud transforms everyday Git usage into a competitive esports-style experience. It watches Git activity and reacts like a toxic competitive gaming coach — roasting developers for bad habits while genuinely teaching proper workflow practices.

## Architecture

Monorepo with three packages:

```
packages/
  core/       # Shared logic — git analysis, scoring engine, roast generation, ranks, achievements
  vscode/     # VS Code extension — the primary product. Observes git events, calls core, renders UI
  web/        # Next.js website — social layer. Developer profiles, leaderboards, Git Wrapped, roast cards
```

**Data flow:** The extension is the sensor (detects git events via VS Code Git API and `.git/` file watchers), core is the brain (analyzes events, generates scores/roasts/achievements), and the website is the scoreboard (displays accumulated stats).

## Tech Stack

- **Language:** TypeScript
- **Monorepo:** npm workspaces
- **VS Code Extension:** VS Code Extension API, VS Code Git API
- **Website:** Next.js 16, React 19, Tailwind CSS 4
- **Git interaction:** Read-only observation via VS Code Git API + file system watchers on `.git/`. No git wrapping or aliasing.

## Commands

```bash
# Install dependencies
npm install

# Start the Next.js dev server
npm run dev

# Build all packages
npm run build

# Lint the web package
npm run lint --workspace=packages/web
```

## Key Systems

- **Git Analysis:** Evaluates commit messages, branch names, commit size, risky actions (force push, direct main push, rebases), coding session duration
- **Roast Generation:** Procedural templates that produce jokes, insults, and fake coaching commentary. Every roast includes genuine advice.
- **Scoring Engine:** Calculates git skill rating, toxicity score, teammate emotional damage, developer personality type
- **Rank System:** Bronze Committer → Silver Rebaser → Gold Merger → Platinum Merge Survivor → Diamond Git Wizard
- **Achievements:** Unlockable badges (Merge Conflict Survivor, Force Push Felon, Branch Necromancer, etc.)
- **Git Wrapped:** Annual summary feature with viral-friendly stats
- **Shareable Roast Cards:** Auto-generated cards for social media

## Tone & Branding

Intentionally overdramatic. Mimics competitive esports, ranked gaming, dramatic anime battles, and toxic multiplayer voice chat — applied to ordinary Git workflow.

## Development

The project is structured as a hackathon build. Stage plans live in `Context/PLAN.md` and `Context/Plans/STAGE1.md` through `STAGE4.md`. The context system includes `.claude/skills/` with commands like `/recontext` and `/replan`.
