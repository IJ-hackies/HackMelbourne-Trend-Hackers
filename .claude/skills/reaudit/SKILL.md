---
name: reaudit
description: "Deep-audit the entire codebase against the project's core concepts and plan, deploying parallel agents to find inaccuracies, inefficiencies, missing edge cases, and small refinements. Use this skill whenever the user says 'reaudit', 'audit the code', 'find issues', 'check for problems', 'deep review', 'quality sweep', or otherwise wants a comprehensive code-quality pass that goes beyond linting — finding logic bugs, missing imports, TOCTOU races, unsafe ID generation, prompt drift, and other subtle issues that automated tools miss."
---

# Reaudit

You are performing a deep, multi-agent audit of the codebase. The goal is to find every small detail that could be refined or fixed — the kind of issues that automated linters and type checkers miss but that degrade reliability, security, or correctness at runtime.

This is not a surface-level review. You are looking for things like:
- Missing imports that only fail at runtime (not caught by type-checking if the function is conditionally reached)
- TOCTOU (time-of-check-to-time-of-use) races in file operations
- Unsafe ID generation (`Math.random()` where `crypto.randomBytes` is needed)
- Unhandled JSON parse failures in data loaded from disk
- Fire-and-forget async patterns with no error handling (swallowed promise rejections)
- Prompt/SOP drift where agent instructions reference tools, fields, or patterns that no longer exist in the code
- Schema mismatches between what's defined in types and what's actually validated at runtime
- Resource leaks (streams not closed, readers not cancelled)
- Dead code paths or unreachable branches
- Inconsistencies between parallel implementations (e.g., the same helper duplicated across files with slight differences where one copy has a bug fix the others lack)

## Process

### Phase 1 — Load context (you do this directly)

1. Read `Context/ABOUT.md` to understand the project's core concepts, architecture, and hierarchy.
2. Read `Context/PLAN.md` to understand the current state and what stages are complete vs. in-progress.
3. Skim the source tree structure (`src/` directory listing) to understand the module layout.

This gives you the mental model needed to write targeted audit prompts for the parallel agents.

### Phase 2 — Deploy parallel audit agents

Spawn **5-8 agents** (using the Agent tool), each covering a distinct subsystem. The exact split depends on the project's module structure — partition by package, module, or feature boundary. Each agent should cover a cohesive set of files that makes sense to audit together.

Each agent prompt should include:
- The specific directories/files to audit
- The project's core architecture (summarized from ABOUT.md)
- What categories of issues to look for (from the list above)
- Instructions to report findings in a structured format

**Agent prompt template** (adapt per subsystem):

```
You are auditing the [SUBSYSTEM] layer of this project.

Architecture: [INSERT BRIEF ARCHITECTURE SUMMARY FROM ABOUT.md]

Your audit scope: [LIST OF FILES/DIRECTORIES]

Read every file in scope. For each file, check for:
1. Missing or incorrect imports
2. Unsafe file I/O (TOCTOU races: existsSync followed by read/write/unlink)
3. Unsafe ID generation (Math.random() instead of crypto.randomBytes)
4. Unhandled JSON.parse without try-catch on user/disk data
5. Fire-and-forget async with no .catch() (swallowed rejections)
6. Stream/reader resource leaks (ReadableStream readers not cancelled in finally blocks)
7. Schema drift (type definitions vs actual runtime usage)
8. Dead code or unreachable branches
9. Inconsistencies with parallel implementations in other files
10. Any other correctness, security, or reliability issue you spot

Report each finding as:
- **File**: path
- **Line(s)**: approximate line range
- **Severity**: CRITICAL / IMPORTANT / MINOR / NITPICK
- **Category**: (e.g., "missing import", "TOCTOU", "unsafe ID", "unhandled parse", "resource leak", etc.)
- **Description**: what's wrong and why it matters
- **Suggested fix**: concrete code change (1-3 lines showing before → after)

Be thorough. Read every line. False negatives are worse than false positives — report anything suspicious and let the aggregation phase filter.
```

Launch all agents in a **single message** so they run concurrently.

### Phase 3 — Aggregate and prioritize

Once all agents report back:

1. **Deduplicate** — the same pattern (e.g., `Math.random()` for IDs) may appear in multiple agents' reports. Consolidate into one finding with all affected files listed.
2. **Categorize** by severity:
   - **CRITICAL**: Will cause runtime failures, data corruption, or security vulnerabilities (missing imports, TOCTOU on write paths, unsanitized input in SQL)
   - **IMPORTANT**: Degrades reliability or correctness under edge conditions (unhandled parse, swallowed async errors, resource leaks)
   - **MINOR**: Code quality issues that don't affect correctness today but increase maintenance burden (dead code, inconsistent patterns)
   - **NITPICK**: Style or convention issues
3. **Count** totals per severity level.

### Phase 4 — Report to the user

Present findings in this format:

```
## Audit Results

**Summary**: X findings across Y files
- CRITICAL: N
- IMPORTANT: N
- MINOR: N
- NITPICK: N

### CRITICAL

#### C1: [Short title]
**Files**: `path/to/file.ts` (lines X-Y), `path/to/other.ts` (lines A-B)
**Category**: [category]
**Issue**: [description]
**Fix**: [concrete suggestion]

[... repeat for each finding ...]

### IMPORTANT
[... same format ...]
```

After presenting, ask the user which severity levels they want fixed. Then proceed to fix them — start with CRITICAL, verify with `tsc --noEmit` after each batch, and run `bun test` at the end to confirm nothing regressed.

## Important guidelines

- **Do not fix anything during the audit phase.** The audit is read-only. Fixes come after the user reviews and approves.
- **Verify before reporting.** If you think something is a bug, confirm by reading the actual code — don't report based on assumptions about what a file contains.
- **Cross-reference parallel implementations.** When the same helper exists in multiple files (e.g., `loadHierarchy` in echo.ts, shard.ts, core.ts), check whether all copies have the same fixes applied. A fix in one copy but not others is itself a finding.
- **Check the test suite.** If a finding should be covered by tests but isn't, note that as part of the finding.
- **Be concrete.** "This could be improved" is not a finding. "Line 47: `existsSync(path)` followed by `unlinkSync(path)` on line 49 is a TOCTOU race — another process could delete the file between check and unlink. Wrap in try-catch instead." is a finding.
