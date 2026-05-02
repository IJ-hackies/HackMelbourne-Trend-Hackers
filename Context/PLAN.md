# Plan

This is a best-effort scaffold inferred from the repo's current state. Edit freely, then run `/replan` to regenerate from ABOUT.md if you want a fuller version.

## Stage 1 — Core MVP ✅

Shared logic + VS Code extension with sidebar dashboard, scoring, roasts (template + Ollama), achievements, and per-block merge conflict tracking. Shipped.

## Stage 2 — AI provider polish

Solidify the Ollama/Gemini integration: surface clear errors when providers are unreachable, cache repeated roast prompts, and let users pick a model from the sidebar without editing JSON.

## Stage 3 — Web companion

Decide what `packages/web` is for (landing page? shareable rank cards? team leaderboard?) and build the first version. <!-- TODO: confirm direction -->

## Stage 4 — Distribution

Package the extension for the VS Code Marketplace: icons, screenshots, README polish, publisher setup, CI publish workflow.

## Stage 5 — Stretch

Multiplayer / team features: shared leaderboards, weekly rivalries, exportable "rap sheet" of Git crimes.
