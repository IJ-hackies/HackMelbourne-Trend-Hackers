# Stage 3 — Roast & Scoring System (core)

## Goal

Build the personality layer and progression systems on top of the Stage 2 analysis engine. After this stage, a `GitEvent` goes in and a complete verdict comes out: a roast with advice, a score delta, a rank evaluation, achievement progress, a personality classification, and a teammate suffering stat. This is the last pure-core stage before the extension and website start consuming it.

## Approach

Build each system as an independent module in `packages/core/src/`, then wire them together through a unified `evaluate()` function that calls the Stage 2 `analyzeEvent()` internally. Order matters slightly — the roast system is standalone, but scoring feeds into ranks, and achievements depend on having score and event history. Personality classification and teammate suffering are leaf nodes that can be built in parallel once scoring exists.

**Depends on:** Stage 2 (`analyzeEvent()` and its result types in `packages/core/`).

---

## Stage 3.1 — Roast Template System

**Goal:** Generate procedural roasts for each analysis result, pairing humor with genuine advice.

**Deliverables:**
- `packages/core/src/roasts/templates.ts` — roast template definitions, organized by `GitEventType` and severity. Each template is a function that takes analysis metadata and returns a populated `Roast` (message + severity + advice). Minimum 3–5 templates per event type to avoid repetition.
- `packages/core/src/roasts/generator.ts` — `generateRoast(analysisResult): Roast` — selects a template based on event type and severity, populates it with specifics from the analysis (e.g., the actual bad commit message, the branch name, the number of files changed). Selection should have randomness so the same offense doesn't always produce the same roast.
- `packages/core/src/roasts/index.ts` — barrel export.

**Exit criteria:**
- `generateRoast()` returns a valid `Roast` for every `GitEventType`.
- Roasts reference specific details from the analysis (not just generic insults).
- Every roast has a non-empty `advice` field with actionable guidance.
- Calling `generateRoast()` twice with the same input can produce different messages.

---

## Stage 3.2 — Scoring Engine

**Goal:** Calculate a numeric git skill rating from event history, with per-event score deltas.

**Deliverables:**
- `packages/core/src/scoring/engine.ts` — `calculateScore(event, analysisResult, currentScore): Score` — returns the new total and the delta. Scoring rules:
  - Good practices (descriptive commits, reasonable size, proper branching) award points.
  - Bad practices (lazy messages, giant commits, force push, direct main push) deduct points.
  - Severity from the analysis scales the magnitude.
  - Score floor at 0 (no negative totals).
- `packages/core/src/scoring/rules.ts` — point values and multipliers as named constants, separated from the engine logic so they're easy to tune.
- `packages/core/src/scoring/index.ts` — barrel export.

**Exit criteria:**
- A good commit increases score; a bad commit decreases it.
- Score never goes below 0.
- `Score.breakdown` contains per-category contributions (e.g., `{ commitMessage: -10, commitSize: 5 }`).
- Point values are all defined in `rules.ts`, not hardcoded in the engine.

---

## Stage 3.3 — Rank System

**Goal:** Map score ranges to named ranks with promotion/demotion logic.

**Deliverables:**
- `packages/core/src/ranks/definitions.ts` — rank ladder as an ordered array of `Rank` objects:
  - Bronze Committer (0–99)
  - Silver Rebaser (100–299)
  - Gold Merger (300–599)
  - Platinum Merge Survivor (600–999)
  - Diamond Git Wizard (1000+)
  - (Thresholds are tunable — these are starting values.)
- `packages/core/src/ranks/evaluator.ts` — `evaluateRank(score): { rank: Rank; promoted: boolean; demoted: boolean; previousRank: Rank | null }` — determines current rank from score and compares against a provided previous rank to detect transitions.
- `packages/core/src/ranks/index.ts` — barrel export.

**Exit criteria:**
- `evaluateRank()` returns the correct rank for boundary scores (e.g., 99 → Bronze, 100 → Silver).
- Promotion and demotion flags are set correctly when rank changes.
- Rank definitions are data-driven (adding a rank = adding an entry to the array, no logic changes).

---

## Stage 3.4 — Achievement System

**Goal:** Define unlockable achievements with progress tracking and unlock detection.

**Deliverables:**
- `packages/core/src/achievements/definitions.ts` — achievement catalog. Each entry: `id`, `name`, `description`, `condition` (a function that takes event history / stats and returns `{ unlocked: boolean; progress: number }`). Starting set:
  - **Merge Conflict Survivor** — resolve N merge conflicts
  - **Force Push Felon** — force push M times
  - **Branch Necromancer** — switch to a branch that hasn't been touched in 2+ weeks
  - **Commit Goblin** — make 10+ commits in a single session
  - **Clean Streak** — N consecutive commits with good messages
  - **README Avoider** — reach a score threshold without ever editing a README
  - (At least 8–10 achievements to start.)
- `packages/core/src/achievements/tracker.ts` — `checkAchievements(event, analysisResult, stats): Achievement[]` — evaluates all achievement conditions against current stats, returns any newly unlocked or progressed achievements.
- `packages/core/src/achievements/index.ts` — barrel export.
- Extend or define a `PlayerStats` type (in `packages/core/src/types.ts` or a new file) to hold the cumulative counters achievements need (total commits, total force pushes, current streak length, etc.).

**Exit criteria:**
- `checkAchievements()` correctly detects a newly unlocked achievement when the condition is met.
- Progress is reported as a 0–1 fraction for partially completed achievements.
- Adding a new achievement = adding an entry to the definitions array, no tracker changes.

---

## Stage 3.5 — Teammate Suffering Calculator & Personality Classifier

**Goal:** Two comedic stat systems that give developers an identity beyond their score.

**Deliverables:**
- `packages/core/src/personality/suffering.ts` — `calculateSuffering(stats): { score: number; title: string }` — a comedic "teammate emotional damage" metric derived from how chaotic the user's git history is. Inputs: force push count, merge conflict frequency, average commit size, direct-to-main pushes. Output: a 0–100 score and a descriptive title (e.g., "Mild Annoyance", "Active Hazard", "Geneva Convention Violation").
- `packages/core/src/personality/classifier.ts` — `classifyPersonality(stats): { type: string; description: string }` — assigns a developer archetype based on behavioral patterns:
  - **Commit Goblin** — very frequent, very small commits
  - **Chaos Mage** — lots of force pushes, rebases, risky actions
  - **README Avoider** — never touches docs
  - **Monolith Merchant** — giant commits, few branches
  - **Branch Hoarder** — creates many branches, rarely merges
  - **The Perfectionist** — high score, clean history, long time between commits
  - (At least 6 archetypes.)
- `packages/core/src/personality/index.ts` — barrel export.

**Exit criteria:**
- Suffering score scales with chaotic behavior (more force pushes = higher score).
- Personality classifier picks the dominant archetype, not just the first match.
- Both functions are pure — they take stats in and return a result, no side effects.

---

## Stage 3.6 — Unified `evaluate()` Pipeline

**Goal:** Single entry point that takes a `GitEvent` and player state, runs the full pipeline, and returns everything the extension or website needs.

**Deliverables:**
- `packages/core/src/evaluate.ts` — `evaluate(event, playerState): EvaluationResult` where:
  - `playerState` contains current score, rank, achievement progress, and event history (defined as a type in `types.ts` or a new `packages/core/src/state.ts`).
  - Internally calls: `analyzeEvent()` (Stage 2) → `generateRoast()` → `calculateScore()` → `evaluateRank()` → `checkAchievements()` → `calculateSuffering()` → `classifyPersonality()`.
  - Returns `EvaluationResult`: `{ roast: Roast; score: Score; rank: RankEvaluation; achievements: Achievement[]; suffering: SufferingResult; personality: PersonalityResult; analysis: AnalysisResult }`.
- Update `packages/core/src/index.ts` barrel to export `evaluate`, `EvaluationResult`, and all sub-module public APIs.

**Exit criteria:**
- `evaluate()` returns a complete `EvaluationResult` for any valid `GitEvent`.
- The extension (Stage 4) and website (Stage 5) only need to call `evaluate()` — they don't import sub-modules directly.
- `packages/core/` builds cleanly with all new modules included.

---

## Open Questions

- **Roast tone calibration:** How savage is too savage? The plan says "toxic competitive gaming coach" but the line between funny and off-putting is subjective. May need a severity preference or filter after playtesting.
- **Achievement stat persistence:** `checkAchievements()` needs cumulative stats (total force pushes, streak length). The type shape is defined here, but who *stores* it is Stage 4's problem (VS Code extension state). Worth keeping in mind so `PlayerStats` has everything the extension will need to persist.
