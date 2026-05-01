---
name: recontext
description: Use at the start of any session to load project context into the conversation. Reads ABOUT.md and PLAN.md so Claude knows what the project is and where the work currently stands. If files are missing, directs to /recreate or /replan.
---

## What This Skill Does

Orients Claude at the start of a session by reading `ABOUT.md` and `PLAN.md`. No questions, no writes — read-only. One short confirmation output.

---

## Step 1: Check for Context Files

Look for `ABOUT.md` and `PLAN.md` in the project root.

| State | Action |
|-------|--------|
| Both present | Continue to Step 2 |
| Only `ABOUT.md` | Read it; note that no plan exists yet |
| Only `PLAN.md` | Read it; note that `ABOUT.md` is missing, suggest `/recreate` |
| Neither | Tell user to run `/recreate` first |

---

## Step 2: Read the Files

Read `ABOUT.md` and `PLAN.md` in full.

Also check:
- `plans/` directory — if it exists, note any active substage files
- Any `⚠️ STALE` marker at the top of either file

---

## Step 3: Output Orientation Summary

One concise block — enough to confirm orientation, not a full readout:

```
Context loaded: {project name}

What it is: {one sentence from ABOUT.md}
Stack: {framework/language}

Plan: {current focus stage from PLAN.md, or "no plan — run /replan"}
```

If a `⚠️ STALE` marker is present:
> "`ABOUT.md` is marked stale — key files were modified since it was last written. Run `/reupdate` to refresh."

If `PLAN.md` is missing:
> "No plan found. Run `/replan` to generate one from `ABOUT.md`."

If a substage file is active in `plans/`:
> "Active substage: `plans/{file}` — run `/replan-breakdown` to review or continue."

---

## Notes

- This skill is read-only. It never writes or asks questions.
- Keep the output short. The goal is orientation, not a summary of everything in the files.
- If both files are present and current, this completes in a single output block.
