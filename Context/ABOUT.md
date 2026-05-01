# Git Gud

"Competitive Git for dangerously overconfident developers."

## What this is

Git Gud transforms everyday Git usage into a competitive esports-style experience. It watches Git activity and reacts like a toxic competitive gaming coach — roasting developers for bad habits while genuinely teaching proper workflow practices. The humor comes from treating mundane Git mistakes like high-stakes esports disasters.

## Tech stack

- **Language:** TypeScript
- **Monorepo:** npm/pnpm workspaces
- **VS Code Extension:** VS Code Extension API, VS Code Git API
- **Shared Core:** Internal package (not published to npm) — scoring, roasts, analysis, achievements
- **AI Roast Generation:** Ollama cloud API (OpenAI-compatible endpoint at `https://ollama.com/v1`), default model `kimi-k2.6:cloud`. Requires `OLLAMA_API_KEY` environment variable.
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

**Data flow:** The extension is the sensor (detects git events via VS Code Git API and `.git/` file watchers), core is the brain (analyzes events, generates scores/roasts/achievements), and the website is the scoreboard (displays accumulated stats). The `evaluate()` pipeline is async — roast generation calls the Ollama cloud API, so all callers must `await` it.

The core package is internal shared code — both the extension and website import from it directly via workspace references. It is not published to npm.

## Key systems

- **Git Analysis:** Evaluates commit messages, branch names, commit size, risky actions (force push, direct main push, rebases), coding session duration
- **Roast Generation:** AI-generated roasts via Ollama cloud API using a toxic esports coach persona prompt. A brainrot library (40+ gen-z slang entries with meanings and git-context examples) is injected into the system prompt so the AI uses current internet slang naturally. Preset templates (80+) serve as automatic fallback when the API is unavailable. Every roast includes genuine advice. Key exports: `generateRoast(verdict, config?)` (async, AI-first), `generateTemplateRoast(verdict)` (sync, templates only), `RoastConfig` (API key, model, base URL).
- **Scoring Engine:** Calculates git skill rating, toxicity score, teammate emotional damage, developer personality type
- **Rank System:** Bronze Committer → Silver Rebaser → Platinum Merge Survivor → Diamond Git Wizard. Bad practices reduce rank.
- **Achievements:** Unlockable badges (Merge Conflict Survivor, Force Push Felon, Branch Necromancer, etc.)
- **Git Wrapped:** Annual summary feature — viral-friendly stats like "437 questionable commits, 29 merge conflicts survived"
- **Shareable Roast Cards:** Auto-generated images for social media ("Top 1% Worst Commit Messages")

## Tone & branding

Intentionally overdramatic. Mimics competitive esports, ranked gaming, dramatic anime battles, and toxic multiplayer voice chat — applied to ordinary Git workflow. The contrast between mundane actions and absurdly serious reactions is the core humor.

## Current state

Monorepo fully set up (Stage 1 complete). Git analysis engine built with all analyzers and tests (Stage 2 complete). Full roast/scoring/personality layer complete (Stage 3 complete) — AI roast generation via Ollama cloud API (`kimi-k2.6:cloud`) with brainrot slang library and 80+ template fallbacks, scoring engine, rank system, achievement system (10 achievements), teammate suffering calculator, developer personality classifier (7 archetypes), and unified async `evaluate()` pipeline all implemented with tests (141 passing). VS Code extension scaffold activates and imports core. Next.js 16 web package scaffolded. Stages 4–6 not yet started.
