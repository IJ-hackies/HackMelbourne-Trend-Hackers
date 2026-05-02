# Plan

## Stage 1 — Monorepo Setup & Core Scaffold ✅ COMPLETE

Restructure the repo into a monorepo with npm/pnpm workspaces. Move the existing Next.js app into `packages/web/`, scaffold `packages/core/` with TypeScript config and base types, scaffold `packages/vscode/` with the extension boilerplate. Everything should build and the extension should activate (even if it does nothing yet).

**Deliverables:**
- ✅ Workspace root `package.json` with workspace config
- ✅ `packages/core/` — tsconfig, package.json, entry point, base type definitions (GitEvent, Score, Rank, Achievement, Roast)
- ✅ `packages/vscode/` — extension scaffold that activates, registers commands, can import from core
- ✅ `packages/web/` — existing Next.js app moved here, imports from core work
- ✅ All three packages build successfully

## Stage 2 — Git Analysis Engine (core) ✅ COMPLETE

Build the analysis functions in `packages/core/` that evaluate raw git data and return verdicts.

**Deliverables:**
- ✅ Commit message quality analyzer (detects lazy messages, too short, no context)
- ✅ Branch name analyzer (detects bad naming, direct main work)
- ✅ Commit size analyzer (detects giant commits, single-file micro-commits)
- ✅ Risky action classifier (force push, direct push to main, rebase on shared branch)
- ✅ Session duration detector (coding for unreasonable hours)
- ✅ Unified `analyzeEvent()` function that takes a git event and returns analysis results

## Stage 3 — Roast & Scoring System (core) ✅ COMPLETE

Build the personality layer and progression systems on top of the analysis engine.

**Deliverables:**
- ✅ Roast template system — 70+ procedural roast templates per event type, with genuine advice attached (retained as fallback)
- ✅ AI roast generation — Ollama cloud API integration (`kimi-k2.6:cloud`) with toxic esports coach persona prompt, template fallback on API failure
- ✅ Brainrot slang library — 40+ gen-z/internet slang entries with meanings and git-context examples, injected into AI prompt
- ✅ `RoastConfig` type — API key, model, base URL configuration for AI roast generation
- ✅ Scoring engine — calculates git skill rating from event history, tracks score changes per event
- ✅ Rank system — rank thresholds, promotion/demotion logic, rank definitions
- ✅ Achievement system — 10 achievements with unlock conditions and progress tracking
- ✅ Teammate suffering calculator — 0–100 chaos score with escalating titles
- ✅ Developer personality classifier — 7 archetypes (Commit Goblin, Chaos Mage, README Avoider, Monolith Merchant, Branch Hoarder, The Perfectionist, Night Crawler)
- ✅ Unified async `evaluate()` pipeline — single entry point returning `Promise<EvaluationResult>`, accepts optional `RoastConfig`

## Stage 4 — VS Code Extension MVP ✅ COMPLETE

Wire core into a working VS Code extension that reacts to real git activity.

**Deliverables:**
- ✅ Git event detection via VS Code Git API (commits, branch switches, push indicators)
- ✅ File system watchers on `.git/` for events the API doesn't surface (rebase, merge conflicts via `MERGE_HEAD`)
- ✅ Notification popups — roast + advice on each detected event, severity-based routing (info/warning/error)
- ✅ Local persistence — user stats stored in VS Code globalState with schema versioning and migration support
- ✅ Commands (`gitgud.showStatus`, `gitgud.resetStats`, `gitgud.showProfile`, `gitgud.showDashboard`, `gitgud.toggleSound`) and settings (`enabled`, `notificationsEnabled`, `soundEnabled`, `roastIntensity`, Ollama API config)
- ✅ Sidebar webview dashboard — current rank, score, recent offenses, active streaks, achievements, personality, teammate suffering
- ✅ Sound effects — esports-style Web Audio API synthesis (rank up/down, achievement fanfare, critical alert, event blip) with optional toggle
- ✅ Centralized config reader (`config.ts`) with `onDidChangeConfiguration` listener

## Stage 5 — Website MVP

Build the social/viral layer.

**Deliverables:**
- Developer profile pages — rank badge, personality traits, teammate stability score, match history
- Leaderboard / rankings page
- Git Wrapped page — annual stats summary with shareable layout
- Roast card generator — auto-generated images/cards for social sharing
- Data flow from extension → website (export/import or simple API)

## Stage 6 — Polish & Demo Prep

Final pass for hackathon presentation.

**Deliverables:**
- Visual polish on extension sidebar and website
- Demo script with pre-seeded data showing the full loop (bad commit → roast → rank change → website profile)
- Optional: voice announcer with esports-style lines
- README with screenshots/GIFs
