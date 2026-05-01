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

1. `Context/PLAN.md` with breakdowns in `Context/Plans/STAGE<N>.md` (capitalized)
2. `context/plan.md` with breakdowns in `context/plans/stage<N>.md`
3. `PLAN.md` at repo root with breakdowns in `plans/STAGE<N>.md` or `plans/stage<N>.md`
4. `plan.md` at repo root with breakdowns in `plans/stage<N>.md`

If none of these exist, ask the user where the plan lives rather than guessing. If the plan file exists but the breakdowns folder doesn't, create it next to the plan file using the same casing convention as the plan file.

## Process

1. **Read the top-level plan** and locate the section for the requested stage. Read the surrounding stages too — the stage you're breaking down has to fit coherently between what comes before and after.
2. **Read at least one existing stage breakdown** in the plans folder (if any exist) to match its structure, tone, depth, and conventions. Do not invent a new format when the project already has one — consistency matters more than your personal preferences here.
3. **Read the project's ABOUT.md / README** if present, so the breakdown is grounded in how the project actually works, not generic boilerplate.
4. **Check for relevant existing source code** that the stage will touch. A breakdown that references real file paths and real existing modules is far more useful than one written purely from the plan.
5. **Write the breakdown file** at the correct path. If a file for that stage already exists, ask before overwriting — the user may have hand-edited it.

## What a good breakdown contains

The exact shape should mirror existing files in the project, but in general a stage breakdown should include:

- **Goal** — one or two sentences on what this stage achieves and why it exists.
- **Approach** — the rough strategy (bottom-up, top-down, parallel tracks, etc.) and the reasoning behind it.
- **Substages** (e.g. `Stage N.1`, `Stage N.2`, ...) — each with its own:
  - Goal
  - Concrete deliverables (file paths, schemas, functions, configs — be specific)
  - Exit criteria that are objectively checkable
- **Dependencies** on prior stages, where relevant.
- **Open questions / risks** if there are genuinely unresolved decisions. Don't manufacture these — leave the section out if there aren't any.

Why this shape: the breakdown is meant to be the working document a developer (or another agent) opens when they start the stage. It needs enough specificity that they don't have to re-derive decisions from PLAN.md, but not so much that it locks in choices that should still be made at implementation time.

## Style

- Match the existing breakdowns' voice. If they use checkmarks (✅) for completed substages, follow that. If they use horizontal rules between substages, follow that.
- Refer to real files and modules by path. Vague breakdowns are useless.
- Don't pad. If a substage is genuinely small, let it be small.
- Don't restate the entire PLAN.md — link or reference it. The breakdown's job is to *expand*, not duplicate.

## After writing

Tell the user the path you wrote, and briefly (2-3 bullets) what the substages are so they can sanity-check the decomposition without opening the file.
