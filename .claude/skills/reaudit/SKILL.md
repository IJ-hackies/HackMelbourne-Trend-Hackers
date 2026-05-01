---
name: reaudit
description: Use when you want a deep, multi-angle audit of the codebase. Spawns parallel agents to audit different dimensions (architecture, code quality, security, conventions) then synthesizes findings into a single prioritised report.
---

## What This Skill Does

Runs a structured multi-agent audit of the codebase across four dimensions — architecture, code quality, security, and conventions — then synthesises findings into a single prioritised report written to `AUDIT.md`.

---

## Step 1: Check for ABOUT.md

Read `ABOUT.md` if it exists. This gives agents the project context they need to make grounded judgements rather than generic observations.

If `ABOUT.md` is missing, proceed without it but note that findings may be less precise.

---

## Step 2: Confirm Scope

Ask one question:
> "Any areas to focus on or exclude? For example: 'focus on the auth module', 'skip generated files', 'only look at the API layer'."

If the user says "everything" or gives no restrictions, proceed with a full audit.

---

## Step 3: Launch Parallel Audit Agents

Spawn four agents in parallel, each focused on one dimension. Give each agent:
- The project root path
- The contents of `ABOUT.md` (if it exists)
- Their specific audit focus and questions to answer
- Instruction to return findings as a structured list: issue, location, severity (High / Medium / Low), and a one-line fix recommendation

**Agent 1 — Architecture**
Audit focus:
- Is the directory and module structure coherent with the project's stated purpose?
- Are there modules doing too much (god files, bloated entry points)?
- Is there clear separation of concerns, or are data, logic, and UI entangled?
- Are there circular dependencies or unexpected coupling?
- Are there dead or orphaned files (imported nowhere, never called)?

**Agent 2 — Code Quality**
Audit focus:
- Are there functions or modules that are too long or too complex to reason about?
- Is there duplicated logic that should be extracted?
- Are there magic numbers, hardcoded strings, or values that should be constants?
- Are error handling patterns consistent and complete?
- Are there obvious performance issues (unnecessary re-renders, N+1 queries, unbounded loops)?

**Agent 3 — Security**
Audit focus:
- Are there inputs that reach file system, shell, database, or network calls without validation?
- Are secrets, tokens, or credentials hardcoded or committed?
- Are there XSS, CSRF, or injection risks in user-facing code?
- Are dependencies known-vulnerable (check package.json versions against known CVEs if possible)?
- Are auth checks applied consistently across protected routes or endpoints?

**Agent 4 — Conventions & Consistency**
Audit focus:
- Are naming conventions (files, variables, components) consistent throughout the codebase?
- Do patterns established in `ABOUT.md` (if present) hold throughout the code, or are there deviations?
- Is import style consistent (relative vs absolute, grouped vs scattered)?
- Are there mixed paradigms (class components alongside functional, callbacks alongside promises)?
- Is there documentation or comment style inconsistency?

---

## Step 4: Collect and Synthesise Findings

Wait for all four agents to return. Merge their findings, deduplicate any overlaps, and prioritise:

- **Critical** — security vulnerabilities or architectural issues that will cause real problems
- **High** — significant quality or consistency issues that compound over time
- **Medium** — meaningful improvements that aren't urgent
- **Low** — minor polish, style, or nitpick-level issues

---

## Step 5: Write AUDIT.md

```markdown
# Audit

_Generated: {date}_
_Scope: {full codebase / specific scope if restricted}_

## Summary

{3-5 sentences: overall health, biggest concerns, and areas of strength}

## Critical

- **{issue title}** — `{file or module}`: {description}. Fix: {one-line recommendation}.

## High

- **{issue title}** — `{file or module}`: {description}. Fix: {one-line recommendation}.

## Medium

- **{issue title}** — `{file or module}`: {description}. Fix: {one-line recommendation}.

## Low

- **{issue title}** — `{file or module}`: {description}. Fix: {one-line recommendation}.

## Strengths

- {something done well that is worth preserving}

## Recommended Next Steps

1. {highest-impact action}
2. {second action}
3. {third action}
```

---

## Step 6: Confirm

```
✓ AUDIT.md written

{N} findings: {C} critical, {H} high, {M} medium, {L} low

Top priority: {title of most critical finding}

Run /replan to build a plan that addresses the critical and high findings.
```

---

## Notes

- Agents must return structured findings, not prose essays. Enforce this in the agent prompt.
- If an agent returns a finding without a specific file location, do not include it — vague findings are not actionable.
- Do not write a finding that says "consider adding tests" or other generic advice not specific to this codebase.
- If the user restricted scope, agents must stay within that scope — do not include findings from excluded areas.
- `AUDIT.md` is a snapshot. It does not auto-update. Re-run `/reaudit` after significant changes.
