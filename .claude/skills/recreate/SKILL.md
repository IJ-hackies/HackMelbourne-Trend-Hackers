---
name: recreate
description: Bootstrap the project context system in any repo — creates the `Context/` folder with `ABOUT.md` and `PLAN.md`, the `Context/Plans/` folder, and installs the `/recontext`, `/reupdate`, `/replan`, `/replan-breakdown`, and `/reaudit` skills into `.claude/skills/`. Use this skill whenever the user says "recreate", "set up context", "bootstrap context", "init context system", "add the re- skills", or otherwise wants to set up the context + plans infrastructure in a new or existing repo. Trigger even for partial requests like "add recontext to this repo" or "set up the context folder".
---

# Recreate

Set up the full project context system in the current repo. This creates the folder structure, starter files, and companion skills that make `/recontext`, `/reupdate`, `/replan`, `/replan-breakdown`, and `/reaudit` work.

## Why this exists

The context system is a lightweight way to give Claude (and humans) persistent project understanding across conversations. Without it, every new session starts cold. This skill does the one-time setup so you don't have to remember the folder layout or copy skill files by hand.

## What gets created

### Folder structure

```
Context/
├── ABOUT.md        # What this project is, how it works
├── PLAN.md         # High-level staged plan
├── FUTURE.md       # (not created — user-owned, optional)
└── Plans/          # Detailed per-stage breakdowns
```

### Skills (in `.claude/skills/`)

```
.claude/skills/
├── recontext/SKILL.md        # Load context into conversation
├── reupdate/SKILL.md         # Sync context after session work
├── replan/SKILL.md           # Generate PLAN.md from ABOUT.md
├── replan-breakdown/SKILL.md # Break a plan stage into substages
└── reaudit/SKILL.md          # Deep multi-agent codebase audit
```

## Process

1. **Check what already exists.** Glob for `Context/`, `.context/`, `context/`, `.claude/skills/recontext/`, `.claude/skills/reupdate/`, `.claude/skills/replan/`, `.claude/skills/replan-breakdown/`, `.claude/skills/reaudit/`. If any of these exist, don't overwrite — report what's already there and ask the user how to proceed. Partial setups are common (e.g. the folder exists but skills don't) — fill in only the gaps.

2. **Detect casing conventions.** If the repo already has context-like folders (e.g. lowercase `context/`), match that convention instead of forcing `Context/`. Default to capitalized `Context/` for new setups.

3. **Create the folder structure.**
   - `Context/` (or matched casing)
   - `Context/Plans/`

4. **Create `ABOUT.md`.** Interview the user briefly — ask what the project does in 1-2 sentences, the main tech stack, and any key architectural choices. Then write a starter ABOUT.md with this structure:

   ```markdown
   # <Project Name>

   ## What this is
   <1-2 sentences from the user>

   ## Tech stack
   <bullet list>

   ## Architecture
   <brief description — fill in what you can infer from the repo, ask about what you can't>

   ## Current state
   <what exists so far — scan the repo to ground this in reality>
   ```

   If the user wants to skip the interview ("just set it up"), infer what you can from the repo (README, package.json, pyproject.toml, go.mod, etc.) and write a best-effort ABOUT.md. Mark anything you're uncertain about with `<!-- TODO: verify -->` so the user can check it.

5. **Create `PLAN.md`.** If the user has a plan in mind, write it. If not, create a minimal scaffold:

   ```markdown
   # Plan

   ## Stage 1 — <name>
   <goal>

   ## Stage 2 — <name>
   <goal>
   ```

   If the repo already has substantial code, try to infer what "stages" have been completed and what's next, and propose a plan the user can edit. Don't invent stages that aren't grounded in the project's actual trajectory.

6. **Install the skills.** Create `.claude/skills/` if it doesn't exist, then write the five skill files. The content for each skill is defined below.

7. **Don't create `FUTURE.md`.** It's user-owned and optional. Mention it exists as a concept if the user asks, but don't generate one.

8. **Report what you did.** List every file created and briefly describe the system: "You now have `/recontext` to load context, `/reupdate` to sync after work, `/replan` to generate a plan from ABOUT.md, `/replan-breakdown` to expand plan stages, and `/reaudit` to run a deep multi-agent codebase audit."

## Skill contents

### `.claude/skills/recontext/SKILL.md`

```markdown
---
name: recontext
description: Load project context by reading every file in the Context/ folder except FUTURE.md. Use this skill whenever the user asks you to "recontext", get up to speed, understand the project, load context, or refresh your understanding of what this project is about — even if they don't explicitly mention the Context folder.
---

# Recontext

Your job is to load the project's context so you understand what it is and how it works.

## Steps

1. Detect the context folder. Look for `Context/`, `.context/`, or `context/` — use whichever exists.
2. Read every file in the context folder **except `FUTURE.md`** (case-insensitive). FUTURE.md is intentionally excluded because it describes speculative future plans that should not shape current understanding.
3. After reading, give the user a brief (3-6 bullet) summary of what the project is, so they can confirm you're grounded.

Read files in parallel when possible. Do not read FUTURE.md under any circumstance as part of this skill.
```

### `.claude/skills/reupdate/SKILL.md`

```markdown
---
name: reupdate
description: Update context files to reflect what was done in the current conversation, then audit the codebase for any remaining mismatches. Use this skill whenever the user says "reupdate", "update context", "sync context", "update the context files", "refresh progress", or otherwise asks to reflect session work back into the context docs. Trigger this even if the user only mentions updating "progress" or "about" — the skill handles deciding which files actually need edits.
---

# Reupdate

Two jobs, in order:

1. **Session sync** — look at what changed or got decided *this conversation* and update the context folder so a future `/recontext` reflects it.
2. **Mismatch audit** — scan the broader codebase for anything that has drifted from what the context files claim.

The session sync is the primary purpose. The audit is a secondary safety net that catches drift you didn't cause this session.

## Why this exists

The context folder is the project's living memory. If session work lands but the docs don't move, the next session starts stale. And even between sessions, code can drift from what the docs describe — the audit catches that.

## Part 1 — Session sync

1. **Reconstruct the session.** Review the conversation history to identify what actually happened: files created/modified, decisions made, pipeline stages advanced, bugs fixed, architectural choices, things tried and abandoned. Use `git status` and `git diff` to ground yourself in concrete changes — the diff is authoritative, but the conversation captures decisions and reasoning that don't show up in code.

2. **Read the context files.** Detect the context folder (`Context/`, `.context/`, or `context/`), then glob and read each file that could plausibly need updates. **Never read or write `FUTURE.md`** — it's speculative and owned by the user. Also skip anything the user has explicitly told you not to touch.

3. **Update based on session work.** For each file, ask: does this session's work invalidate or extend anything here?
   - `PROGRESS.md` — almost always gets a new entry when something shipped. Append newest entries at the top. Use today's absolute date (check `currentDate`, don't guess). Include branch name if relevant.
   - `ABOUT.md` — update when architecture, pipeline shape, tech choices, or the "current implementation" paragraph drifted. Skip for routine feature work that doesn't change the project's story.
   - `SCHEMA.md` — update when the data contract moved (new scope, field, mutability rule, stage mapping). Skip for pure implementation changes.
   - Other files — read and judge.

4. **Make surgical edits.** Prefer `Edit` over `Write`. Don't rewrite sections that are still accurate. Match existing voice, formatting, and level of detail.

## Part 2 — Mismatch audit

After the session sync is complete, do a broader check:

1. **Cross-reference context claims against the codebase.** For each substantive claim in the context files, verify it still holds. Use Glob and Grep — don't just trust the docs or your memory.

2. **Check for undocumented additions.** Look for major new directories, entry points, config files, or architectural components that exist in the repo but aren't reflected in the context docs.

3. **Fix what you find.** Apply the same surgical edit approach. If a mismatch is ambiguous, flag it in your report rather than silently editing.

4. **Don't go overboard.** This is a targeted audit, not a full codebase review. Focus on claims that are concretely verifiable.

## General rules

- **Don't invent facts.** If unsure whether something landed, check the code or the diff.
- **Don't touch `FUTURE.md`** under any circumstance.
- **Don't add speculative plans or "next steps"** to `PROGRESS.md` — it's a log of what shipped.
- **Don't create new files** in the context folder unless the user asked. Propose first if warranted.
- **Minimal diff, maximum signal.**
- **Don't commit the changes.** Leave staging/commit decisions to the user.

## Report

Tell the user:
1. **Session updates** — which files you touched and a one-line summary of each change.
2. **Audit findings** — any mismatches found and whether you fixed them or flagged them.
3. **Clean bill** — if the audit found nothing, say so.

## Edge cases

- **Nothing substantive happened this session.** Say so and skip Part 1. Still run Part 2.
- **Multiple things landed but only some are worth logging.** Bundle related work into one entry.
- **The session work contradicts ABOUT.md.** Update ABOUT.md — the docs serve the code.
- **User worked across multiple branches.** Attribute each entry to the branch it landed on.
- **Audit finds a mismatch you didn't cause.** Fix it if clearly stale. Flag it if ambiguous.
```

### `.claude/skills/replan/SKILL.md`

```markdown
---
name: replan
description: Generate or regenerate a comprehensive staged development plan (PLAN.md) from the project's ABOUT.md. Use this skill whenever the user says "replan", "create a plan", "generate the plan", "write PLAN.md", "make a roadmap", "plan the project", or otherwise wants to produce or overhaul a staged development roadmap based on what the project is. Trigger this even if the user just says "/replan" or "I need a plan for this project". Also trigger when the user says something like "the plan is out of date" or "rewrite the plan from scratch".
---

# Replan

Read the project's ABOUT.md and produce a comprehensive staged development plan in PLAN.md. The plan should be a concrete, sequential roadmap that takes the project from its current state to its vision — not a wishlist, not a backlog, but an ordered sequence of stages where each one builds on the last.

## Why this exists

ABOUT.md describes *what* the project is. PLAN.md describes *how to get there*. Writing a good plan requires understanding the architecture, the tech stack, the dependencies between components, and the order in which things must be built. This skill does that translation.

## Process

1. **Find and read ABOUT.md.** Check `Context/ABOUT.md`, `.context/ABOUT.md`, `context/ABOUT.md`, then root-level `ABOUT.md`. If none exists, check for a `README.md`. If neither exists, suggest running `/recreate` first.

2. **Read any existing PLAN.md.** If a plan already exists, ask before overwriting — it may contain completed-stage records the user wants to preserve.

3. **Scan the codebase for current state.** Use Glob and Grep to understand what's already built, the real tech stack, and how far along the project is. Plans that describe building things that already exist are useless.

4. **Read other context files** if they exist (PROGRESS.md, SCHEMA.md, etc.) for decisions or constraints.

5. **Interview the user if needed.** If ABOUT.md is thin, ask: What does "done" look like? Any hard constraints? What's highest priority? If ABOUT.md is rich enough, draft directly.

6. **Write the plan** as sequential, dependency-ordered stages. Each stage should be a shippable increment with specific deliverables. Mark completed stages with checkmarks. The first stage is always the smallest buildable unit. Later stages can be less detailed.

7. **Write PLAN.md** as a sibling to ABOUT.md. Use `Write` for new plans, `Edit` for updates.

8. **Report back.** List stages with one-line summaries and ask the user to review.

## What NOT to do

- Don't create the Plans/ folder or stage breakdowns — that's `/replan-breakdown`'s job.
- Don't add stages for things clearly out of scope.
- Don't duplicate ABOUT.md content — reference it.
- Don't commit anything.
```

### `.claude/skills/replan-breakdown/SKILL.md`

```markdown
---
name: replan-breakdown
description: Break down a specific stage from a project's high-level plan into a detailed, actionable stage breakdown markdown file. Use this skill whenever the user asks to "break down stage N", "expand stage N of the plan", "create a detailed plan for stage N", "write the STAGE<N>.md", or otherwise wants to take a stage from a top-level PLAN.md and produce a granular per-substage breakdown in a sibling Plans/ folder. Trigger even when the user just says something like "/replan-breakdown 3" or "do the breakdown for stage 4".
---

# Replan Breakdown

Take a single stage from a project's top-level plan and produce a detailed breakdown markdown file for it, matching the style of any existing stage breakdowns in the project.

## Inputs

- **Stage number** (required): which stage to break down. Passed as an argument (e.g. `3`) or inferred from the user's message.

## Locating the files

Plans live in different places in different repos. Look in this order, and stop at the first hit:

1. `Context/PLAN.md` with breakdowns in `Context/Plans/STAGE<N>.md`
2. `.context/plan.md` with breakdowns in `.context/plans/stage<N>.md`
3. `context/PLAN.md` with breakdowns in `context/Plans/STAGE<N>.md`
4. `PLAN.md` at repo root with breakdowns in `plans/STAGE<N>.md` or `plans/stage<N>.md`
5. `plan.md` at repo root with breakdowns in `plans/stage<N>.md`

If none of these exist, ask the user where the plan lives. If the plan file exists but the breakdowns folder doesn't, create it next to the plan file using the same casing convention.

## Process

1. **Read the top-level plan** and locate the section for the requested stage. Read surrounding stages too — the breakdown has to fit coherently between what comes before and after.
2. **Read at least one existing stage breakdown** (if any exist) to match its structure, tone, depth, and conventions. Consistency matters more than your preferences.
3. **Read the project's ABOUT.md / README** if present, so the breakdown is grounded in how the project actually works.
4. **Check for relevant existing source code** that the stage will touch. A breakdown that references real file paths is far more useful than one written purely from the plan.
5. **Write the breakdown file** at the correct path. If a file for that stage already exists, ask before overwriting.

## What a good breakdown contains

Mirror existing files in the project, but generally include:

- **Goal** — one or two sentences on what this stage achieves and why.
- **Approach** — the rough strategy and reasoning behind it.
- **Substages** (e.g. `Stage N.1`, `Stage N.2`, ...) — each with:
  - Goal
  - Concrete deliverables (file paths, schemas, functions, configs)
  - Exit criteria that are objectively checkable
- **Dependencies** on prior stages, where relevant.
- **Open questions / risks** if there are genuinely unresolved decisions. Don't manufacture these.

## Style

- Match the existing breakdowns' voice and formatting conventions.
- Refer to real files and modules by path.
- Don't pad. If a substage is small, let it be small.
- Don't restate the entire PLAN.md — the breakdown's job is to *expand*, not duplicate.

## After writing

Tell the user the path you wrote, and briefly (2-3 bullets) what the substages are so they can sanity-check without opening the file.
```

### `.claude/skills/reaudit/SKILL.md`

```markdown
---
name: reaudit
description: "Deep-audit the entire codebase against the project's core concepts and plan, deploying parallel agents to find inaccuracies, inefficiencies, missing edge cases, and small refinements. Use this skill whenever the user says 'reaudit', 'audit the code', 'find issues', 'check for problems', 'deep review', 'quality sweep', or otherwise wants a comprehensive code-quality pass that goes beyond linting — finding logic bugs, missing imports, TOCTOU races, unsafe ID generation, prompt drift, and other subtle issues that automated tools miss."
---

# Reaudit

You are performing a deep, multi-agent audit of the codebase. The goal is to find every small detail that could be refined or fixed — the kind of issues that automated linters and type checkers miss but that degrade reliability, security, or correctness at runtime.

This is not a surface-level review. You are looking for things like:
- Missing imports that only fail at runtime
- TOCTOU (time-of-check-to-time-of-use) races in file operations
- Unsafe ID generation (Math.random() where crypto.randomBytes is needed)
- Unhandled JSON parse failures in data loaded from disk
- Fire-and-forget async patterns with no error handling
- Prompt/SOP drift where agent instructions reference things that no longer exist in code
- Schema mismatches between types and runtime validation
- Resource leaks (streams not closed, readers not cancelled)
- Dead code or unreachable branches
- Inconsistencies between parallel implementations of the same helper

## Process

### Phase 1 — Load context

1. Read `Context/ABOUT.md` to understand the project's core concepts and architecture.
2. Read `Context/PLAN.md` to understand current state and completed stages.
3. Skim the source tree structure to understand the module layout.

### Phase 2 — Deploy parallel audit agents

Spawn 5-8 agents (using the Agent tool), each covering a distinct subsystem. Partition by module boundaries. Each agent reads every file in its scope and reports findings in a structured format with: File, Line(s), Severity (CRITICAL/IMPORTANT/MINOR/NITPICK), Category, Description, and Suggested fix.

Launch all agents in a single message so they run concurrently.

### Phase 3 — Aggregate and prioritize

Deduplicate findings, categorize by severity, and count totals.

### Phase 4 — Report

Present a structured report with findings grouped by severity, then ask the user which levels they want fixed. Fix starting from CRITICAL, verify with type checking after each batch, and run the test suite at the end.

Do not fix anything during the audit phase — fixes come after user review.
```

## What NOT to do

- Don't overwrite existing files without asking. The user may have hand-edited them.
- Don't create `FUTURE.md`. It's user-owned.
- Don't commit anything. Leave that to the user.
- Don't add project-specific content to the skills — they're meant to be generic and work in any repo.
- Don't install skills the user didn't ask for. The five listed above are the standard set.

## Edge cases

- **Repo already has everything.** Report what exists and ask if they want to reset, update, or leave it alone.
- **Partial setup.** Fill in only the gaps. If `Context/` exists but skills don't, just install skills. If skills exist but `Context/` doesn't, just create the folder.
- **User only wants a subset.** Respect that. If they say "just add recontext", do only that.
- **Non-git repo.** The context system works without git, but mention that `/reupdate` will be less effective without `git diff` to ground its session reconstruction.
