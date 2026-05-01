# AGENTS.md

## What this repo is
- **Project:** Git Gud — a VS Code extension + website that gamifies Git usage with esports-style roasts and rankings.
- **Current state:** Fully functional monorepo with three packages: `core/`, `vscode/`, and `web/`. All six stages from PLAN.md are built.
- **Context:** Always read `Context/ABOUT.md` and `Context/PLAN.md` before major work.

## Tech stack
- Next.js 16.2.4, React 19.2.4, TypeScript 5, Tailwind CSS 4.
- ESLint 9 with flat config (`eslint.config.mjs`). Uses `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`.
- Package manager: npm (`package-lock.json` present). Uses npm workspaces.

## Commands
- `npm run dev` — start Next.js dev server on localhost:3000 (via workspace=packages/web).
- `npm run build` — builds all three packages via `npm run build --workspaces`.
- `npm run lint` — runs `eslint` directly (not `next lint`). Config is flat format in `packages/web/eslint.config.mjs`.
- There are **no tests** yet. Do not guess at test commands.

## Monorepo boundaries
- `packages/core/` — shared git analysis, scoring, roasts, ranks, achievements (internal package, not published).
- `packages/vscode/` — VS Code extension entrypoint. Imports `@git-gud/core` via `*`.
- `packages/web/` — Next.js site. Imports `@git-gud/core` via `*`.

## Tooling quirks
- **Tailwind v4:** CSS entry uses `@import "tailwindcss"` (not `@tailwind` directives). PostCSS plugin is `@tailwindcss/postcss`.
- **ESLint flat config:** `eslint.config.mjs` uses `defineConfig` and `globalIgnores`. Do not add `.eslintrc` files.
- **Path alias:** `@/*` resolves to `./src/*` via `tsconfig.json` in packages/web.
- **Geist font:** Not currently loaded (layout.tsx has minimal styling).

## Context system
- `.claude/skills/` contains project-specific skills: `/recontext`, `/replan`, `/replan-breakdown`, `/reupdate`, `/reaudit`, `/recreate`, `/grill-me`, `/frontend-design`, `/skill-creator`.
- Use `/recontext` to load `Context/ABOUT.md` and `Context/PLAN.md` into context before major work.

## What not to do
- Do not add `.eslintrc.*` — the project uses flat config.
- Do not use Tailwind v3 syntax in CSS.
- Do not treat core as a published npm package — it is a local workspace dependency.
