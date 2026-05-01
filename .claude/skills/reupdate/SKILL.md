---

name: reupdate

description: Audits the project's actual state against the Context/ folder (ABOUT.md, PLAN.md) to detect direction mismatches — features that drifted, plans that diverged, or architecture that no longer matches the spec. Suggests concrete changes to realign.

---

You are performing a direction audit of the Geode project. Your job is to compare the project's **actual current state** against what the **Context/ files say it should be**, and surface any mismatches.

## Step 1 — Load the source of truth

Read the Context/ files in this order:
1. `Context/ABOUT.md` — the canonical architecture, hierarchy, data structures, features, and schemas.
2. `Context/PLAN.md` — the staged roadmap, deliverables, and dependencies.
3. Any `Context/STAGE*.md` files if they exist — detailed stage breakdowns.

Skip `Context/Diagrams/` — those are visual references only.

Mentally index:
- Every **component** described (Core, Shard, Echo, Knowledge Store, etc.)
- Every **data structure** and file path described (AGENT.md, hierarchy.json, schemas, etc.)
- Every **feature** described (task types, circuit breaker, coalitions, session tracking, etc.)
- Every **script/module** described (launch_echo.py, memory_manager.py, etc.)
- The **directory structure** described for the Geode environment
- The **stage ordering and dependencies** in PLAN.md

## Step 2 — Scan the actual project

Use Glob and Read to examine the project's real state:
- Scan all directories and files that exist in the project root (excluding `.git/`, `.claude/`, `Context/`)
- Read key files: any Python scripts, JSON configs, schema files, AGENT.md files, identity files, pyproject.toml, etc.
- Check what has actually been built vs. what ABOUT.md and PLAN.md say should exist
- Note the git log (last ~15 commits) to understand recent development direction

## Step 3 — Compare and identify mismatches

For each mismatch found, classify it as one of:

### Direction Drift
The project has built something that **contradicts** or **diverges from** what ABOUT.md/PLAN.md describes. Example: a schema field exists in code but is missing from the spec, or vice versa.

### Missing Implementation
Something described in Context/ that **should exist by now** (based on stage progression) but doesn't.

### Undocumented Addition
Something that **exists in the project** but is **not described** in any Context/ file — a feature, script, or structural choice that was added without updating the spec.

### Stale Specification
Something in Context/ that is **no longer accurate** — the project has intentionally moved past it, renamed it, or replaced it with a better approach.

## Step 4 — Report

Present your findings in this format:

### Audit Summary
One paragraph: overall alignment health. Are things mostly on track, or has the project drifted significantly?

### Mismatches Found

For each mismatch:
- **Type**: (Direction Drift / Missing Implementation / Undocumented Addition / Stale Specification)
- **Location**: Where in the project and where in Context/
- **What's wrong**: Concise description of the discrepancy
- **Suggested fix**: Whether to update the Context/ files, update the code, or discuss with the user before deciding

Group mismatches by severity:
1. **Critical** — the project is actively building against outdated or wrong specs
2. **Moderate** — noticeable divergence that should be resolved soon
3. **Minor** — small inconsistencies or cosmetic differences

### Recommendations
Prioritized list of what to update. For each:
- State whether the **code** or the **Context/ files** should change (or if it needs discussion)
- If updating Context/, describe what specifically to change
- If updating code, describe what to realign

## Rules

- Do NOT make any changes yourself. This is a read-only audit. Only report and suggest.
- Do NOT guess about ambiguous cases. Flag them as "needs discussion" and explain the ambiguity.
- Be specific. Reference exact file paths, line numbers, field names, and section headers.
- Compare against what the Context/ files actually say, not what you think the project should do.
- If the project is early-stage and most things are "missing implementation," focus on whether the things that DO exist match the spec, rather than listing every unbuilt stage.
