---
name: reupdate
description: Use after a working session to sync ABOUT.md with any codebase changes made. Re-reads the files that ABOUT.md documents and updates only what has drifted. Does not touch PLAN.md — use /replan for that.
---

## What This Skill Does

Keeps `ABOUT.md` accurate after sessions where the codebase changed. Re-reads the files it documents, finds what has drifted, and updates only those sections — no full rewrite, no unnecessary questions.

---

## Step 1: Check for ABOUT.md

If `ABOUT.md` is missing:
> "No `ABOUT.md` found. Run `/recreate` to generate it from scratch."

Stop here.

---

## Step 2: Read ABOUT.md

Read `ABOUT.md` fully. Note which files and paths it references — these are what you'll re-read to check for drift.

Also check for a `⚠️ STALE` marker at the top. If present, note which file triggered it.

---

## Step 3: Re-Read Referenced Files

Re-read the key files that `ABOUT.md` documents:

- Build config files (package.json, Cargo.toml, etc.) — check for dependency or script changes
- The directory structure — check for new or removed directories
- Files listed in the Key Files table — check if they've moved, changed purpose, or been deleted
- Router/routing config if documented — check for route additions or removals
- Data schema files if documented — check for field changes

Compare current state against what's documented.

---

## Step 4: Identify Drift

List what has actually changed vs what `ABOUT.md` documents. Be specific:

- New dependency added to package.json
- `src/components/` now has a `shared/` subdirectory that isn't documented
- A route was added in `App.jsx`
- A data file has new fields

If nothing has changed:
> "`ABOUT.md` is current — no changes needed."

Stop here.

---

## Step 5: Ask One Question if Needed

If changes in the code suggest something you can't determine from reading alone (e.g. a new module whose purpose isn't clear from its name or contents), ask one targeted question:
> "I see `{new thing}` was added — what does it do / what's it for?"

Do not ask about changes you can determine from reading the code.

---

## Step 6: Update ABOUT.md

Edit only the sections that have drifted. Do not rewrite sections that are still accurate.

Remove the `⚠️ STALE` marker if one was present.

Before writing, tell the user what you're changing:
> "Updating: {list of changed sections}"

---

## Step 7: Confirm

```
✓ ABOUT.md updated

Changed: {bullet list of what was updated}
Unchanged: {bullet list of sections that were still accurate}
```

---

## Notes

- Do not touch `PLAN.md` — plan updates are handled by `/replan`.
- Do not ask questions the code can answer. Minimize user friction.
- If the project has changed significantly (new framework, major restructure), recommend `/recreate` instead of trying to patch a deeply stale `ABOUT.md`.
