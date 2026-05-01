---

name: recontext

description: "Reads core context files (ABOUT.md, PLAN.md) and optionally a specific stage plan to build understanding of the project. Usage: /recontext [stage_number] — e.g. /recontext 3 to include Stage 3's plan."

---

You are loading context for this project. The user may pass an optional argument specifying a stage number (e.g. `3`, `5`). This is available as `$ARGUMENTS`.

Follow these steps exactly:

1. **Read core context files**: Use the Read tool to read these files in order:
   - `Context/ABOUT.md` (project overview and core concepts)
   - `Context/PLAN.md` (goals and roadmap)

   **Do NOT read** `Context/FUTURE.md`, `Context/Diagrams/`, or `Context/Plans/` unless a stage number was provided.

2. **If a stage number was provided** (e.g. `$ARGUMENTS` is `3`): also read `Context/Plans/STAGE<number>.md` (e.g. `Context/Plans/STAGE3.md`). Only read the single requested stage file — not all stage files.

3. **Synthesize and report** the following sections based on what you read:

   ### What is this project?
   One-paragraph summary of the project's purpose, core concepts, and what problem it solves.

   ### System Flow
   Describe how the system works end-to-end. Trace how a request or action moves through the system — from entry point through each layer/component to the final result.

   ### Component Map
   List each major component, what it does, and what it talks to. Show the relationships and hierarchy.

   ### Current State
   What has been built vs. what is still planned. Be specific — name concrete artifacts that exist.

   ### Next Steps
   What work comes next, based on the plan (and the specific stage document if one was loaded). List in priority order if possible.

4. **Flag gaps**: If any area is undocumented or ambiguous in the context files, say so explicitly rather than guessing.

Be concise but thorough. Use bullet points and headers. Every sentence should add information — no filler.
