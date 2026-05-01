---
name: replan-breakdown
description: Use when a stage in PLAN.md needs to be broken down into concrete substages or tasks. Reads ABOUT.md and PLAN.md, identifies the target stage, and writes a detailed breakdown file to plans/{stage-slug}.md.
---

## What This Skill Does

Takes a single stage from `PLAN.md` and produces a detailed breakdown of the work — concrete tasks, file-level steps, and clear done conditions — written to `plans/{stage-slug}.md`.

---

## Step 1: Check Prerequisites

Require both `ABOUT.md` and `PLAN.md` to exist.

If `ABOUT.md` is missing:
> "Run `/recreate` first to document the project."

If `PLAN.md` is missing:
> "Run `/replan` first to generate a plan."

---

## Step 2: Read Context

Read `ABOUT.md` and `PLAN.md` in full. List the available stages from `PLAN.md` so you know what can be broken down.

---

## Step 3: Identify Target Stage

If the user named a stage in their request, use it.

If not, ask:
> "Which stage do you want to break down?"
> _(list the stage names from PLAN.md)_

---

## Step 4: Interview for Breakdown Detail

Read the stage description from `PLAN.md`. Then ask targeted questions — only about what the stage description doesn't already clarify.

**Q1 — Approach:**
> "How are you thinking of tackling '{stage name}'? Walk me through it roughly."

**Q2 — File-level detail** _(if approach isn't clear from ABOUT.md)_:
> "Which specific files or areas of the codebase will this touch?"

**Q3 — Edge cases or risks** _(only if the stage is non-trivial)_:
> "Any known edge cases, risks, or things to be careful about in this stage?"

Skip any question where ABOUT.md or the user's approach already answers it.

---

## Step 5: Write plans/{stage-slug}.md

Derive the filename from the stage name: lowercase, hyphens for spaces, e.g. `plans/add-auth-middleware.md`.

```markdown
# {Stage Name}

_Part of: [Plan](../PLAN.md) — Stage {N}_
_Created: {date}_

## Goal

{one sentence: what this stage delivers when complete}

## Substages

### 1. {Substage Name}

**What:** {what this substage does}
**Files:** `{file}`, `{file}`
**Done when:** {concrete, verifiable condition}

---

### 2. {Substage Name}

**What:** {description}
**Files:** `{file}`
**Done when:** {condition}

---

### N. {Substage Name}

**What:** {description}
**Files:** `{file}`
**Done when:** {condition}

## Risks & Edge Cases

- {specific risk or constraint}

## Notes

- {anything that would trip up implementation}
```

**Quality rules:**
- Every file path must be real (verified against `ABOUT.md` or the actual repo)
- "Done when" must be concrete — no "when it works" or "when it's ready"
- Substages should be independently executable — no hidden dependencies within the list unless noted
- Keep each substage description to 1–3 sentences
- 3–8 substages is the right range; fewer means the stage didn't need a breakdown, more means split into multiple stages

---

## Step 6: Update PLAN.md

Add a reference to the breakdown file in the relevant stage in `PLAN.md`:

```markdown
### Stage N: {Name}

{existing description}

**Done when:** {existing condition}
**Breakdown:** [plans/{stage-slug}.md](plans/{stage-slug}.md)
```

---

## Step 7: Confirm

```
✓ plans/{stage-slug}.md — {N} substages

Stage {N} in PLAN.md updated with breakdown link.

Start with substage 1: {substage name}
```

---

## Notes

- Never break down a stage you haven't read the full context for. Both `ABOUT.md` and the stage description in `PLAN.md` must be read before writing.
- Do not create breakdown files for stages that are already granular enough — if substages would each be one line, the stage didn't need a breakdown.
- If `plans/` directory doesn't exist, create it.
