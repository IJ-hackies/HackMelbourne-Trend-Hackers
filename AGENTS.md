# AGENTS.md

## What this repo is
- **Project:** Git Gud — a VS Code extension + website that gamifies Git usage with esports-style roasts and rankings.
- **Current state:** Fresh Next.js 16 scaffold at the root. Not yet a monorepo.
- **Plan:** The existing app will move into `packages/web/` as part of Stage 1 (see `Context/PLAN.md`). Always read `Context/ABOUT.md` and `Context/PLAN.md` before starting major work.

## Tech stack
- Next.js 16.2.4, React 19.2.4, TypeScript 5, Tailwind CSS 4.
- ESLint 9 with flat config (`eslint.config.mjs`). Uses `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`.
- Package manager: npm (`package-lock.json` present). Future monorepo should use npm/pnpm workspaces per plan.

## Commands
- `npm run dev` — start Next.js dev server on localhost:3000.
- `npm run build` — Next.js production build.
- `npm run lint` — runs `eslint` directly (not `next lint`). Config is flat format in `eslint.config.mjs`.
- There are **no tests** yet. Do not guess at test commands.

## Monorepo boundaries (planned)
Per `Context/PLAN.md`, the repo will split into:
- `packages/core/` — shared git analysis, scoring, roasts (internal package, not published).
- `packages/vscode/` — VS Code extension entrypoint.
- `packages/web/` — Next.js site (the current root app moves here).
Both extension and website will import `core` via workspace references.

## Tooling quirks
- **Tailwind v4:** CSS entry uses `@import "tailwindcss"` (not `@tailwind` directives). PostCSS plugin is `@tailwindcss/postcss`.
- **ESLint flat config:** `eslint.config.mjs` uses `defineConfig` and `globalIgnores`. Do not add `.eslintrc` files.
- **Path alias:** `@/*` resolves to `./src/*` via `tsconfig.json`.
- **Geist font:** Loaded via `next/font` in layout (currently the default scaffold).

## Context system
- `.claude/skills/` contains project-specific skills: `/recontext`, `/replan`, `/replan-breakdown`, `/reupdate`, `/reaudit`, `/recreate`, `/grill-me`, `/frontend-design`, `/skill-creator`.
- Use `/recontext` to load `Context/ABOUT.md` and `Context/PLAN.md` into context before major work.

## What not to do
- Do not treat this as a finished product. It is a hackathon scaffold with everything yet to be built.
- Do not add `.eslintrc.*` — the project uses flat config.
- Do not use Tailwind v3 syntax in CSS.
