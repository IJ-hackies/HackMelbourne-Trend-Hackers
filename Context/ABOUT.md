# Git Gud

"Competitive Git for dangerously overconfident developers."

## What this is

Git Gud transforms everyday Git usage into a competitive esports-style experience. It watches Git activity and reacts like a toxic competitive gaming coach — roasting developers for bad habits while genuinely teaching proper workflow practices. The humor comes from treating mundane Git mistakes like high-stakes esports disasters.

## Tech stack

- **Language:** TypeScript
- **Monorepo:** npm/pnpm workspaces
- **VS Code Extension:** VS Code Extension API, VS Code Git API
- **Shared Core:** Internal package (not published to npm) — scoring, roasts, analysis, achievements
- **Website:** Next.js 16, React 19, Tailwind CSS 4
- **Git interaction:** Read-only observation via VS Code Git API + file system watchers on `.git/`. No git wrapping or aliasing.

## Architecture

Monorepo with three packages:

```
packages/
  core/       # Shared logic — git analysis, scoring engine, roast generation, rank/achievement definitions
  vscode/     # VS Code extension — the primary product. Observes git events, calls core, renders UI
  web/        # Next.js website — social layer. Developer profiles, leaderboards, Git Wrapped, roast cards
```

**Data flow:** The extension is the sensor (detects git events via VS Code Git API and `.git/` file watchers), core is the brain (analyzes events, generates scores/roasts/achievements), and the website is the scoreboard (displays accumulated stats).

The core package is internal shared code — both the extension and website import from it directly via workspace references. It is not published to npm.

## Key systems

- **Git Analysis:** Evaluates commit messages, branch names, commit size, risky actions (force push, direct main push, rebases), coding session duration
- **Roast Generation:** Procedural templates that produce jokes, insults, and fake coaching commentary. Every roast includes genuine advice.
- **Scoring Engine:** Calculates git skill rating, toxicity score, teammate emotional damage, developer personality type
- **Rank System:** Bronze Committer → Silver Rebaser → Platinum Merge Survivor → Diamond Git Wizard. Bad practices reduce rank.
- **Achievements:** Unlockable badges (Merge Conflict Survivor, Force Push Felon, Branch Necromancer, etc.)
- **Git Wrapped:** Annual summary feature — viral-friendly stats like "437 questionable commits, 29 merge conflicts survived"
- **Shareable Roast Cards:** Auto-generated images for social media ("Top 1% Worst Commit Messages")

## Tone & branding

Intentionally overdramatic. Mimics competitive esports, ranked gaming, dramatic anime battles, and toxic multiplayer voice chat — applied to ordinary Git workflow. The contrast between mundane actions and absurdly serious reactions is the core humor.

## Current state

Monorepo fully set up (Stage 1 complete). Git analysis engine built with all analyzers and tests (Stage 2 complete). Roast templates, scoring engine, and rank system implemented with tests (Stage 3 partially complete — achievements, suffering calculator, and personality classifier still needed). VS Code extension scaffold activates and imports core. Next.js 16 web package scaffolded. Stages 4–6 not yet started.
