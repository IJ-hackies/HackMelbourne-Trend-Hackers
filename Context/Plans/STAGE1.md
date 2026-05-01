# Stage 1 — Monorepo Setup & Core Scaffold

## Goal

Restructure the flat Next.js app into a three-package monorepo (`core`, `vscode`, `web`) with working workspace references, so that every subsequent stage has a clean place to land code. At the end of this stage, all three packages build, the extension activates in VS Code, and the website still works — even though core and vscode are essentially empty shells.

## Approach

Bottom-up: start with the workspace root, then scaffold `packages/core/` (the dependency everything else imports), then `packages/vscode/`, and finally relocate the existing Next.js app into `packages/web/`. Each substage is independently verifiable before moving on.

---

## Stage 1.1 — Workspace Root

**Goal:** Establish the monorepo root so that `npm install` (or `pnpm install`) resolves cross-package dependencies.

**Deliverables:**
- Convert the root `package.json` into a workspace root:
  - Set `"private": true`
  - Add `"workspaces": ["packages/*"]`
  - Remove app-level dependencies (they move to `packages/web/` in 1.4)
  - Add root-level scripts: `build` (runs all package builds), `dev` (runs web dev server)
- Root `tsconfig.json` becomes a base config with shared compiler options; each package extends it via `"extends": "../../tsconfig.json"`.
- Add a root `.gitignore` entry for `packages/*/node_modules` and `packages/*/dist` if not already covered.

**Exit criteria:**
- `npm install` at the root completes without errors.
- The `packages/` directory exists (empty is fine at this point).

---

## Stage 1.2 — `packages/core/` Scaffold

**Goal:** Create the shared core package with TypeScript compilation and the base type definitions that the rest of the system will build on.

**Deliverables:**
- `packages/core/package.json` — name `@git-gud/core`, `"main": "dist/index.js"`, `"types": "dist/index.d.ts"`, build script using `tsc`.
- `packages/core/tsconfig.json` — extends root, outputs to `dist/`, `"declaration": true`, targets ES2020+.
- `packages/core/src/index.ts` — barrel export for all types.
- `packages/core/src/types.ts` — base type definitions:
  - `GitEventType` — enum/union: `commit`, `branch-switch`, `push`, `force-push`, `rebase`, `merge`, `merge-conflict`
  - `GitEvent` — `{ type: GitEventType; timestamp: number; metadata: Record<string, unknown> }`
  - `Score` — `{ total: number; delta: number; breakdown: Record<string, number> }`
  - `Rank` — `{ id: string; name: string; tier: number; threshold: number }`
  - `Achievement` — `{ id: string; name: string; description: string; unlocked: boolean; progress: number }`
  - `Roast` — `{ message: string; severity: 'mild' | 'medium' | 'savage'; advice: string }`

**Exit criteria:**
- `npm run build` in `packages/core/` produces `dist/index.js` and `dist/index.d.ts`.
- Types are importable: `import { GitEvent, Roast } from '@git-gud/core'` resolves in other packages.

---

## Stage 1.3 — `packages/vscode/` Scaffold

**Goal:** Create a minimal VS Code extension that activates, registers a placeholder command, and can import types from `@git-gud/core`.

**Deliverables:**
- `packages/vscode/package.json` — name `git-gud-vscode`, `"main": "dist/extension.js"`, VS Code `"engines"` field, `"activationEvents": ["onStartupFinished"]`, `"contributes.commands"` with a placeholder `gitGud.showStatus` command. Depends on `@git-gud/core` via `"workspace:*"`.
- `packages/vscode/tsconfig.json` — extends root, targets ES2020, `"module": "commonjs"` (VS Code requirement), outputs to `dist/`.
- `packages/vscode/src/extension.ts` — `activate()` logs a message, registers the `gitGud.showStatus` command (shows an info message), imports at least one type from `@git-gud/core` to prove the link works. `deactivate()` is a no-op.
- `packages/vscode/.vscodeignore` — exclude `src/`, `node_modules/`, `tsconfig.json`.

**Exit criteria:**
- `npm run build` in `packages/vscode/` produces `dist/extension.js`.
- Running the extension in the VS Code Extension Development Host shows the activation log message.
- The `Git Gud: Show Status` command appears in the command palette and shows an info notification.

---

## Stage 1.4 — Relocate Next.js App to `packages/web/`

**Goal:** Move the existing Next.js app into the monorepo without breaking it.

**Deliverables:**
- Move these files/dirs into `packages/web/`:
  - `src/` (contains `app/globals.css`, `app/layout.tsx`, `app/page.tsx`)
  - `next.config.ts`
  - `postcss.config.mjs`
  - `eslint.config.mjs`
  - `next-env.d.ts` (if present)
- `packages/web/package.json` — name `@git-gud/web`, keeps all current dependencies (`next`, `react`, `react-dom`, `tailwindcss`, etc.), adds `@git-gud/core` as `"workspace:*"` dependency.
- `packages/web/tsconfig.json` — extends root, keeps the Next.js plugin config, updates `"paths"` alias to `"@/*": ["./src/*"]`.
- Verify the `@/*` path alias still works after the move.
- Add a smoke-test import of a core type in `page.tsx` (e.g., display the `Rank` type name) to prove cross-package imports work at runtime with Next.js.

**Exit criteria:**
- `npm run dev` from root (or `packages/web/`) starts the Next.js dev server without errors.
- `npm run build` from root builds all three packages successfully.
- The website renders the same page it did before the move.
- Importing from `@git-gud/core` works in a web page component.

---

## Stage 1.5 — Verify Full Build & Clean Up

**Goal:** One final pass to make sure everything works end-to-end and the root is clean.

**Deliverables:**
- Root `npm run build` script builds core → vscode → web in the correct order (core first, since the others depend on it).
- Remove any leftover files from the root that were moved to `packages/web/` (old `src/`, old config files).
- Delete `package-lock.json` at root and regenerate it so it reflects the new workspace structure.
- Verify `.gitignore` covers `dist/` in all packages and `node_modules` at every level.

**Exit criteria:**
- Clean clone → `npm install` → `npm run build` succeeds with no errors or warnings (besides expected Next.js info).
- No source files remain at the repo root (only config, context, and `packages/`).
- `git status` is clean after build (no untracked `dist/` artifacts committed).
