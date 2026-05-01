---
name: replan
description: Generate or regenerate a comprehensive staged development plan (PLAN.md) from the project's ABOUT.md. Use this skill whenever the user says "replan", "create a plan", "generate the plan", "write PLAN.md", "make a roadmap", "plan the project", or otherwise wants to produce or overhaul a staged development roadmap based on what the project is. Trigger this even if the user just says "/replan" or "I need a plan for this project". Also trigger when the user says something like "the plan is out of date" or "rewrite the plan from scratch".
---

# Replan

Read the project's ABOUT.md and produce a comprehensive staged development plan in PLAN.md. The plan should be a concrete, sequential roadmap that takes the project from its current state to its vision — not a wishlist, not a backlog, but an ordered sequence of stages where each one builds on the last.

## Why this exists

ABOUT.md describes *what* the project is. PLAN.md describes *how to get there*. Writing a good plan requires understanding the architecture, the tech stack, the dependencies between components, and the order in which things must be built. This skill does that translation — it reads the project's identity and produces a buildable roadmap.

## Process

1. **Find and read ABOUT.md.** Check `Context/ABOUT.md`, `.context/ABOUT.md`, `context/ABOUT.md`, then root-level `ABOUT.md`. If none exists, check for a `README.md` and use it instead. If neither exists, tell the user you need a project description first — suggest they run `/recreate` to set up the context system.

2. **Read any existing PLAN.md.** If a plan already exists, read it. The user might want a full rewrite or just a refresh. Ask before overwriting if the existing plan has substantial content — it may contain hand-written decisions or completed-stage records the user wants to preserve.

3. **Scan the codebase for current state.** Don't plan in a vacuum. Use Glob and Grep to understand:
   - What's already built (directories, entry points, key modules)
   - What the tech stack actually is (package.json, go.mod, pyproject.toml, etc.)
   - How far along the project is (are there tests? a working CLI? a deployed service?)
   
   This grounds the plan in reality. Stages that describe building things that already exist are useless.

4. **Read other context files** if they exist (PROGRESS.md, SCHEMA.md, etc.) — they may contain decisions or constraints that affect the plan.

5. **Interview the user if needed.** If the ABOUT.md is thin or the project direction is ambiguous, ask focused questions:
   - What's the end-state vision? (What does "done" look like?)
   - Are there hard constraints? (Deadline, team size, must-use tech, budget)
   - What's the highest priority — getting something working, or building it right?
   - Any stages they already have in mind?
   
   Keep this short. If ABOUT.md is rich enough, skip the interview and draft directly — the user can course-correct on the draft.

6. **Write the plan.** Structure it as sequential stages. See the format section below.

7. **Write PLAN.md** at the same location as ABOUT.md (sibling file in the same directory). Use `Write` for new plans, `Edit` for updates to existing ones.

8. **Report back.** List the stages with one-line summaries. Ask the user to review — the plan is a living document and they should own it.

## Plan format

The plan should follow this structure:

```markdown
# <Project Name>: Development Roadmap

<1-2 sentence summary of the project and what this plan covers. Reference ABOUT.md for full architecture.>

---

## Stage 1 — <Name>

**Goal:** <What this stage achieves and why it comes first.>

**Deliverables:**
- <Specific, concrete outputs — file paths, modules, schemas, commands>
- <Each deliverable should be verifiable: you can check whether it exists>

---

## Stage 2 — <Name>

**Goal:** <What this stage achieves. Note dependencies on Stage 1.>

**Deliverables:**
- ...

**Deps:** Stage 1.

---
```

### What makes a good plan

- **Stages are sequential and dependency-ordered.** Stage N should only depend on stages before it. If two things can be built independently, they can be in the same stage or adjacent stages — but don't create artificial dependencies.

- **Each stage is a shippable increment.** After completing Stage N, the project should be in a working state — not a half-built skeleton waiting for Stage N+1 to become usable. This is the difference between a plan and a pile of tasks.

- **Deliverables are specific.** "Build the API" is not a deliverable. "Hono server at `src/api/server.ts` with `GET /health`, `POST /tasks`, `GET /tasks/:id`" is. Reference real file paths where possible.

- **Stage count scales with project complexity.** A weekend project might have 3 stages. A multi-month system might have 10+. Don't pad with trivial stages or cram everything into 3 just for neatness.

- **Completed stages get marked.** If the codebase shows that work described in a stage is already done, mark it with a checkmark (✅) and briefly note what shipped. This makes the plan useful as a progress tracker, not just a forward-looking document.

- **The first stage is always the smallest buildable unit.** Whatever the minimum viable piece is — build that first. Validate the core assumption before building the rest.

- **Later stages can be less detailed.** It's fine (and honest) for Stage 8 to be a paragraph while Stage 2 is a page. Plans get more detailed as you get closer to execution.

## Handling existing plans

- **No existing plan:** Write from scratch based on ABOUT.md + codebase scan.
- **Existing plan, user wants refresh:** Preserve completed stages (✅ marks), update in-progress stages based on current codebase state, and refine future stages based on any new information in ABOUT.md.
- **Existing plan, user wants full rewrite:** Confirm first ("This will replace the current plan — want me to preserve the completed-stage records?"). Then rewrite, but carry forward the ✅ history if the user wants it.

## What NOT to do

- Don't create the `Plans/` folder or stage breakdown files — that's `/replan-breakdown`'s job.
- Don't add stages for things that are clearly out of scope for the project as described in ABOUT.md.
- Don't write vague "refactor" or "polish" stages unless the user specifically wants them — they tend to become dumping grounds.
- Don't duplicate ABOUT.md content. Reference it (`See ABOUT.md for architecture details`) rather than restating it.
- Don't commit anything. Leave that to the user.

## Edge cases

- **ABOUT.md is very short.** Do your best with what's there + the codebase scan. Flag what you're uncertain about and ask the user to fill gaps in ABOUT.md first if the plan would be too speculative.
- **Project is already mostly built.** Mark completed stages, focus the plan on what's left. A plan that's 80% checkmarks and 20% forward-looking is a valid and useful document.
- **User wants a plan for a specific feature, not the whole project.** Scope the plan accordingly. Use the same format but make the stages about that feature's development arc.
- **Multiple possible architectures.** Don't pick one silently. Present the fork point to the user and ask which direction to plan for.
