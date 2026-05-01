---
name: recreate
description: Use when setting up project context for the first time. Reads the repo and interviews the user to produce ABOUT.md (what the project is) and FUTURE.md (longer-term goals). To refresh existing files, use /reupdate. To create a plan from this context, use /replan.
---

## What This Skill Does

Produces two files:
- `ABOUT.md` — what the project is: stack, structure, key files, conventions
- `FUTURE.md` — longer-term goals, backlog, and intentions

These are the foundation that `/replan` reads to generate `PLAN.md`. All other re- skills read `ABOUT.md` to orient themselves.

If `ABOUT.md` already exists, stop and direct the user to `/reupdate` instead.

---

## Step 1: Check for Existing Context Files

If `ABOUT.md` exists in the project root:
> "`ABOUT.md` already exists. Run `/reupdate` to refresh it, or confirm you want to overwrite everything from scratch."

Only proceed if the user explicitly confirms overwrite.

---

## Step 2: Explore the Repo

Read the project to build a factual foundation before asking anything.

**Identity & build:**
- `package.json` / `Cargo.toml` / `go.mod` / `pyproject.toml` — framework, dependencies, scripts
- `vite.config.*` / `next.config.*` / `webpack.config.*` — build config
- `README.md` — stated purpose or architecture
- `git remote get-url origin` — repo name and host

**Structure:**
- Top-level directory listing
- `src/` or equivalent — subdirectory layout
- Where does data live? Where do pages/routes live? Where do components/modules live?

**Key patterns:**
- Main entry point
- Router or routing config
- Data files or schemas (read 2–3 representative ones)
- State management approach if visible
- File naming conventions

Do not ask the user anything yet.

---

## Step 3: Interview for Gaps

Ask only what the code cannot answer. One question at a time, wait for each answer.

**Q1 — Purpose:**
> "In one sentence: what does this project do, and who uses it?"

**Q2 — Common tasks:**
> "What are the most common tasks someone would do in a new Claude session here — e.g. 'add a new page', 'modify the data schema', 'add an API endpoint'?"

**Q3 — Gotchas** _(only if the code suggests non-obvious constraints)_:
> "Any non-obvious conventions or constraints I should document? E.g. 'always register routes manually in X', 'image keys must match exactly'."

Skip any question you already have the answer to from reading the code.

---

## Step 4: Write ABOUT.md

```markdown
# About

## What It Is

{one sentence: what the project does and who uses it}

## Stack

- **Framework:** {name and version}
- **Language:** {language}
- **Build tool:** {tool}
- **Deployment:** {how/where, if determinable}

## Structure

{annotated directory tree — only directories that matter, one-line explanations each}

## Key Files

| File | Purpose |
|------|---------|
| {path} | {what it is} |

## Common Tasks

- **{task name}:** touch `{file A}`, then `{file B}` — {one-line recipe}

## Conventions & Gotchas

- {non-obvious rule or constraint}
```

**Quality rules:**
- Every file path must be real and verified from what you read
- Every schema field must reflect actual current data — read the real files
- No generic advice — only project-specific facts
- Keep under 100 lines; move exhaustive field lists to a supporting file if needed

---

## Step 5: Interview for FUTURE.md

Ask about longer-term intentions. One question at a time, wait for each answer.

**Q1 — Longer-term goals:**
> "What are your longer-term goals for this project — things you're not working on yet but want to get to?"

**Q2 — Backlog / ideas:**
> "Any ideas or nice-to-haves you want to park without committing to them?"

**Q3 — Deprioritised** _(only ask if the project seems mature enough to have these)_:
> "Anything you've decided not to do, or that's on hold? Useful to capture so it doesn't keep coming up."

---

## Step 6: Write FUTURE.md

```markdown
# Future

_Last updated: {date}_

## Goals

- {longer-term goal} — {brief rationale if given}

## Backlog & Ideas

- {idea or nice-to-have}

## On Hold / Deprioritised

- {item} — {reason}

## Discarded

- {item} — {why, in one line}
```

---

## Step 7: Optional — Stale Marker Hook

Ask:
> "Do you want a hook that marks `ABOUT.md` as stale when Claude edits key architectural files?"

If yes, identify the key file patterns from your exploration (router config, data schemas, entry point, build config). Write or merge into `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'ABOUT=\"ABOUT.md\"; CHANGED=\"$CLAUDE_TOOL_INPUT_FILE_PATH\"; PATTERNS=\"{pipe-separated key file patterns}\"; if [ -f \"$ABOUT\" ] && echo \"$CHANGED\" | grep -qE \"$PATTERNS\"; then grep -q \"STALE\" \"$ABOUT\" || sed -i \"\" \"1s|^|> ⚠️ STALE — Claude edited an architectural file (${CHANGED}). Re-run /reupdate to refresh.\\n\\n|\" \"$ABOUT\"; fi'"
          }
        ]
      }
    ]
  }
}
```

Replace `{pipe-separated key file patterns}` with actual patterns, e.g. `src/App\\.jsx|src/data/|package\\.json`.

If `.claude/settings.json` already exists, read it first and merge — do not overwrite existing hooks.

**macOS:** use `sed -i ""`. Linux: use `sed -i`.

---

## Step 8: Confirm

```
✓ ABOUT.md — project overview, stack, structure, conventions
✓ FUTURE.md — {N} goals, {N} backlog items

Next steps:
  /replan  — generate PLAN.md from this context
  /reaudit — run a deep codebase audit
```

---

## Notes

- Never document things you haven't verified by reading actual files.
- Ask questions one at a time. Do not batch them.
- If the project has no `.claude/` directory yet, create it before writing the hook.
