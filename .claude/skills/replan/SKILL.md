---
name: replan
description: Use when generating or regenerating PLAN.md for a project. Reads ABOUT.md and FUTURE.md to understand the project and its goals, then interviews the user about immediate priorities to produce a structured plan. Use /replan-breakdown to drill into a specific stage.
---

## What This Skill Does

Generates `PLAN.md` — the structured plan for the current phase of work. Reads `ABOUT.md` for project context and `FUTURE.md` for stated goals, then asks the user about immediate priorities to produce a plan with clearly defined stages.

---

## Step 1: Check for ABOUT.md

If `ABOUT.md` is missing:
> "No `ABOUT.md` found. Run `/recreate` first — it produces `ABOUT.md` and `FUTURE.md`, which `/replan` uses as context."

Stop here.

---

## Step 2: Read Context Files

Read `ABOUT.md` fully. Read `FUTURE.md` if it exists — its Goals and Backlog sections tell you what the user has already said they want to work toward, so you don't ask them to repeat themselves. Also read `PLAN.md` if it exists — note what was previously planned.

---

## Step 3: Determine Mode

**If `PLAN.md` exists:**
> "A plan already exists. Do you want to replace it with a new plan, or update the current one?"

- **Replace** → treat as fresh; go to Step 4
- **Update** → go to [Update Mode](#update-mode)

**If `PLAN.md` does not exist:** Go to Step 4.

---

## Step 4: Interview for the Plan

If `FUTURE.md` exists and has clear goals, use them as a starting point — reference them rather than asking the user to re-state what they already documented. Ask only about what you still need to know.

Ask one question at a time. Wait for each answer before asking the next.

**Q1 — Current focus** _(skip if FUTURE.md makes the immediate priority obvious)_:
> "Which of your goals are you working toward in this phase — or is there something more immediate that isn't in FUTURE.md?"

**Q2 — Scope:**
> "What are the major pieces of work involved? List them roughly — we'll structure them into stages."

**Q3 — Priority and order:**
> "Is there a natural order these need to happen in, or any dependencies between them?"

**Q4 — Constraints** _(only if not obvious from ABOUT.md or FUTURE.md)_:
> "Any constraints I should know about — deadlines, blockers, things to avoid touching?"

---

## Step 5: Write PLAN.md

Structure the plan into clearly named stages based on the user's answers. Each stage is a coherent chunk of work — not too granular, not too vague.

```markdown
# Plan

_Last updated: {date}_

## Goal

{one sentence: what this plan delivers}

## Stages

### Stage 1: {Name}

{2-3 sentences describing what this stage achieves and what files/areas it touches}

**Done when:** {concrete completion condition}

---

### Stage 2: {Name}

{description}

**Done when:** {concrete completion condition}

---

### Stage N: {Name}

{description}

**Done when:** {concrete completion condition}

## Current Focus

Stage {N} — {name}

## Notes

- {constraint, dependency, or gotcha relevant to this plan}
```

**Quality rules:**
- Stage names should be meaningful, not generic ("Set up auth" not "Stage 1")
- "Done when" must be concrete and verifiable — no vague language like "when it works"
- Stages should be ordered by dependency, not arbitrary sequence
- Keep under 80 lines; if a stage is complex enough to need substages, note it and let `/replan-breakdown` handle it

---

## Update Mode

Read the current `PLAN.md`. Ask one question:
> "What's changed — what's been completed, what's new, what's shifted in priority?"

Update only the affected stages. Add `_Last updated: {date}_`. Do not rewrite stages that haven't changed.

Mark completed stages clearly:

```markdown
### ~~Stage N: {Name}~~ ✓ Completed {date}
```

---

## Step 6: Confirm

```
✓ PLAN.md written — {N} stages

Current focus: Stage {N} — {name}

Run /replan-breakdown on any stage to break it into detailed substages.
```

---

## Notes

- Ground every stage in what you know from `ABOUT.md` — don't suggest stages that don't fit the actual project structure.
- Don't invent stages the user didn't describe. Keep the plan true to their intent.
- Do not create `plans/` subdirectory files — that is handled by `/replan-breakdown`.
