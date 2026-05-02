---
name: reupdate
description: Updates the project's Context/ files (ABOUT.md, PLAN.md, and stage breakdowns if present) so they reflect the project's actual current state. Use when the user says "reupdate", "update the context", "sync the docs", "refresh the plan", or otherwise wants Context/ realigned to what the code now is. This skill WRITES changes — it is not a read-only audit. For a read-only audit, use `reaudit`.
---

You are updating the project's Context/ files so they match the project's actual current state. This skill **writes** changes; it is not an audit.

## Step 1 — Load the current spec

Read in this order:
1. `Context/ABOUT.md` — canonical architecture, components, data shapes, features, configuration keys, decisions log.
2. `Context/PLAN.md` — staged roadmap and what's shipped vs. deferred.
3. Any `Context/Plans/STAGE*.md` files that exist — detailed stage breakdowns. Only read the ones that look stale or relevant; do not read every stage breakdown if there are many.

Skip `Context/Diagrams/` and `Context/FUTURE.md`.

Mentally index everything Context/ currently claims: components, modules, file paths, features, configuration keys, commands, decisions, stage status (✅ vs. pending), explicit out-of-scope decisions.

## Step 2 — Scan the actual project

Examine the project's real state. Prefer broad-but-shallow over deep-but-narrow:
- Top-level layout and each package/workspace's `src/` (or equivalent) tree.
- Each package's `package.json` / `pyproject.toml` / equivalent — names, scripts, dependencies, and any contributed configuration (e.g. a VS Code extension's `contributes.configuration`, `contributes.commands`).
- Entry points and command registrations.
- `git log --oneline -15` to learn recent direction (recent feature names, removals, renames).
- Any obvious top-level architectural artifacts (extension manifests, schema files, build configs).

You do not need to read every source file. The goal is "what does the project look like and claim now," not a code review.

## Step 3 — Compute the diff

For every claim in Context/, decide:
- **Still true** → leave alone.
- **Stale** → Context/ describes something that no longer exists, was renamed, or was removed. Update or delete the line.
- **Incomplete** → the project has shipped something Context/ doesn't mention. Add it.
- **Wrong shape** → the description exists but the details (file paths, type names, config keys, stage status, decisions) are out of date. Fix the details.

Pay special attention to:
- **Configuration keys** — every contributed config key should appear in ABOUT.md's configuration section, and vice versa.
- **Commands / entry points** — every registered command should be listed.
- **UI surface order** if Context/ documents it (e.g. sidebar card order) — a reorder must be reflected.
- **Removed features** — if something was deleted (file, type, feature, capability), Context/ should not still claim it. Add a Decisions-log entry explaining the removal if one isn't already there.
- **Stage status flags** in PLAN.md — items that are now shipped should be in the "shipped" stage; items that drifted out of scope should be moved or marked deferred.

## Step 4 — Write the updates

Edit `Context/ABOUT.md`, `Context/PLAN.md`, and any stage breakdown files that need it.

Style rules for the writes:
- Match the existing voice and structure of each file. Do not restructure sections unless the existing structure is actively wrong.
- Be concise. One line per fact where possible.
- For removed features, prefer **adding a one-line entry to the Decisions log** in ABOUT.md ("X was removed because Y") over silently scrubbing all traces.
- For new features, mirror the level of detail of neighboring features. Don't dump implementation notes into ABOUT.md — that file is the user-facing spec, not a changelog.
- Stage breakdowns (`Context/Plans/STAGE*.md`) only need updating if substages have shifted. Don't rewrite a stage breakdown just because one bullet went stale — edit that bullet.
- Never invent rationale. If you don't know *why* something changed, describe *what* changed and stop there.

## Step 5 — Report what changed

After writing, give the user a short summary, structured as:

- **`Context/ABOUT.md`** — bullet list of edits (component renames, features added, config keys added/removed, decisions logged, etc.)
- **`Context/PLAN.md`** — bullet list of edits (stage status changes, scope moves, etc.)
- **Stage breakdowns** — only if any were touched.
- **Left alone** — one sentence on anything you considered changing but decided was still accurate, so the user knows what was intentionally preserved.
- **Needs your call** — only if applicable. Ambiguous cases where you didn't write a change because the right answer requires user input. Phrase as a direct question.

## Rules

- This skill **writes** changes. It is not an audit.
- For a read-only audit that only reports drift without editing, the user wants `reaudit` (code-quality focused) or to ask explicitly for an audit. Do **not** run an audit-only flow under this skill.
- Do not change `Context/FUTURE.md` or `Context/Diagrams/`.
- Do not introduce new top-level Context/ files.
- Do not commit. The user reviews the diff.
- If you are unsure whether something is an intentional choice or a drift, ask in the "Needs your call" section instead of guessing.
