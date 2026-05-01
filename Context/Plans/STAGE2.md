# Stage 2 — Git Analysis Engine (core)

**Depends on:** Stage 1 (monorepo scaffold, `packages/core/` with base types like `GitEvent`, `Score`)

## Goal

Build the pure-logic analysis functions in `packages/core/` that take raw git event data and return structured verdicts. These are the "brain" functions — no UI, no persistence, no side effects. Everything downstream (roasts, scoring, the extension, the website) consumes their output, so getting the contracts right here matters more than getting every edge case.

## Approach

Bottom-up by analyzer. Each analyzer is an independent module with its own file, its own tests, and a focused concern. Once all analyzers exist, a thin `analyzeEvent()` orchestrator composes them into a single call that the extension and website will use.

The analyzers are intentionally stateless — they receive a git event (or a small window of recent events for session detection) and return a verdict. State management (history, streaks, accumulation) belongs to Stage 3 and Stage 4.

---

## Stage 2.1 — Analysis Types & Contracts

**Goal:** Define the TypeScript types that all analyzers produce, so the rest of the stage has stable contracts to build against.

**Deliverables:**
- `packages/core/src/analysis/types.ts` — shared analysis types:
  - `AnalysisVerdict` — base shape with `severity: 'info' | 'warning' | 'critical'`, `category: string`, `message: string`, `advice: string`
  - `CommitMessageVerdict`, `BranchNameVerdict`, `CommitSizeVerdict`, `RiskyActionVerdict`, `SessionVerdict` — per-analyzer verdict types extending the base
  - `AnalysisResult` — the unified return type of `analyzeEvent()`, containing an array of verdicts plus metadata
- `packages/core/src/analysis/index.ts` — barrel export

**Exit criteria:** Types compile. Importing them from the core package entry point works.

---

## Stage 2.2 — Commit Message Analyzer

**Goal:** Detect lazy, low-quality, or context-free commit messages.

**Deliverables:**
- `packages/core/src/analysis/commit-message.ts` — `analyzeCommitMessage(message: string): CommitMessageVerdict`
- Detection rules:
  - Too short (e.g. `"fix"`, `"wip"`, `"asdf"`)
  - Generic/meaningless (e.g. `"update"`, `"changes"`, `"stuff"`)
  - No verb / no context (doesn't describe what changed or why)
  - All caps rage commits (e.g. `"FIX THIS STUPID BUG"`)
  - Emoji-only commits
  - Copy-pasted default messages (e.g. `"Initial commit"` on the 50th commit, `"Merge branch"` with no additional context)
- Each detection returns a severity and a specific advice string
- `packages/core/src/analysis/__tests__/commit-message.test.ts`

**Exit criteria:** Tests cover each detection rule with at least one positive and one negative case. Clean messages return an info-level "all good" verdict.

---

## Stage 2.3 — Branch Name Analyzer

**Goal:** Detect bad branch naming conventions and direct-to-main work.

**Deliverables:**
- `packages/core/src/analysis/branch-name.ts` — `analyzeBranchName(branchName: string, isDefault: boolean): BranchNameVerdict`
- Detection rules:
  - Working directly on `main`/`master`/`develop` (critical)
  - Meaningless names (`"test"`, `"branch1"`, `"my-branch"`, `"temp"`)
  - No prefix convention (missing `feat/`, `fix/`, `chore/`, etc. — warn, not error)
  - Excessively long branch names
  - Names with spaces or special characters that cause issues
- `packages/core/src/analysis/__tests__/branch-name.test.ts`

**Exit criteria:** Tests cover each rule. Working on `main` is always critical severity.

---

## Stage 2.4 — Commit Size Analyzer

**Goal:** Detect giant monolithic commits and suspiciously tiny micro-commits.

**Deliverables:**
- `packages/core/src/analysis/commit-size.ts` — `analyzeCommitSize(stats: { filesChanged: number; insertions: number; deletions: number }): CommitSizeVerdict`
- Detection rules:
  - Giant commits (many files changed, huge line counts) — with escalating severity tiers
  - Single-file micro-commits that suggest saving-as-committing
  - High deletion-to-insertion ratio (possible accidental delete or reckless refactor)
  - Only generated/lock file changes (less interesting, lower severity)
- Configurable thresholds (exported constants, not magic numbers)
- `packages/core/src/analysis/__tests__/commit-size.test.ts`

**Exit criteria:** Tests cover each tier boundary. Thresholds are exported and documented in-code.

---

## Stage 2.5 — Risky Action Classifier

**Goal:** Identify dangerous git operations that would make teammates cry.

**Deliverables:**
- `packages/core/src/analysis/risky-action.ts` — `classifyRiskyAction(event: GitEvent): RiskyActionVerdict | null`
- Detection rules:
  - Force push (always critical)
  - Direct push to default branch (critical)
  - Rebase on a shared/remote-tracking branch (warning–critical depending on context)
  - Deleting remote branches
  - Resetting with `--hard` (if detectable from event data)
- Returns `null` if the event isn't risky (most events won't be)
- `packages/core/src/analysis/__tests__/risky-action.test.ts`

**Exit criteria:** Each risky action type has test coverage. Non-risky events return `null`.

---

## Stage 2.6 — Session Duration Detector

**Goal:** Detect unreasonable coding sessions (the "it's 4 AM and I'm still committing" detector).

**Deliverables:**
- `packages/core/src/analysis/session-duration.ts` — `analyzeSession(commitTimestamps: Date[]): SessionVerdict`
- Detection rules:
  - Long continuous session (commits spanning 4+ hours without a break)
  - Late-night coding (commits between midnight and 5 AM)
  - Weekend warrior (sustained weekend activity)
  - Burst patterns (many commits in a very short window — panic mode)
- A "session" is inferred from commit timestamps with a configurable gap threshold (e.g. 30 min gap = new session)
- `packages/core/src/analysis/__tests__/session-duration.test.ts`

**Exit criteria:** Tests cover each pattern. Session gap detection correctly splits timestamps into sessions.

---

## Stage 2.7 — Unified `analyzeEvent()` Orchestrator

**Goal:** Single entry point that runs all applicable analyzers on a git event and returns a combined result.

**Deliverables:**
- `packages/core/src/analysis/analyze-event.ts` — `analyzeEvent(event: GitEvent, context?: AnalysisContext): AnalysisResult`
  - `AnalysisContext` optionally carries recent commit timestamps (for session detection) and branch info
  - Calls each analyzer that's relevant to the event type
  - Collects all verdicts, deduplicates where sensible, sorts by severity
  - Returns the combined `AnalysisResult`
- Re-export from `packages/core/src/index.ts` so consumers do `import { analyzeEvent } from '@gitgud/core'`
- `packages/core/src/analysis/__tests__/analyze-event.test.ts` — integration-level tests with realistic event fixtures

**Exit criteria:** A single `analyzeEvent()` call with a commit event returns verdicts from commit message, commit size, branch name, risky action, and session analyzers as applicable. The function is importable from the core package root.

---

## Open Questions

- **GitEvent shape:** Stage 1 defines the base `GitEvent` type. If it turns out to be insufficient for what the analyzers need (e.g. missing `filesChanged` stats or `timestamp`), extend it here rather than back-patching Stage 1 — document what was added.
- **Threshold tuning:** Initial thresholds will be guesses. The roast system (Stage 3) and real usage (Stage 4) will reveal whether they need adjustment. Err on the side of triggering too often — it's funnier and easier to dial back.
