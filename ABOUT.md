# About

## What It Is

A Pomodoro focus timer where a sarcastic AI hamster mascot roasts you with personalised brainrot slang when you fail, then forces you to post your shame to Instagram Stories to unlock the app again — creating a viral loop baked into the penalty system.

## Stack

- **Framework:** Next.js 16.2.4 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Runtime:** React 19
- **Build tool:** Next.js built-in (Turbopack)
- **Deployment:** TBD

## Structure

```
src/
  app/
    layout.tsx      # Root layout, global font/metadata
    page.tsx        # Home page (entry point)
    globals.css     # Global styles + Tailwind imports
```

## Key Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Main app page — start here for all UI work |
| `src/app/layout.tsx` | Root layout wrapping every page |
| `src/app/globals.css` | Global CSS and Tailwind base |
| `next.config.ts` | Next.js config |

## Core Flow

1. **Start** — User types a goal, takes a "Working Selfie" via camera, sets 25-min timer
2. **Cheat detection** — Leaving the app triggers FAIL STATE
3. **Roast** — AI generates a personalised roast using the goal name + 2026 brainrot slang ("Unc", "cooked", "zero aura")
4. **Post or Perish** — App is locked until user hits "Post My Shame", which exports a shame card (selfie + roast) as an Instagram Story

## Common Tasks

- **Add roast lines:** edit the roast generation logic in whatever component/API route handles it
- **Style the shame card:** touch the shame card component + Tailwind classes
- **Wire up timer logic:** work in `src/app/page.tsx` or a dedicated timer component
