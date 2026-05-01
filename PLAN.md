# Plan

_Last updated: 2026-05-01_

## Goal

Ship a working Pomodoro shame-timer with AI roasts, selfie capture, app-lock, and Instagram Story export within 3 days.

## Stages

### Stage 1: Core Timer + Goal Input

Build the main UI: goal text input, 25-minute countdown timer, and start/pause/reset controls. No AI or camera yet — just the Pomodoro loop working end-to-end in `src/app/page.tsx`.

**Done when:** User can type a goal, start a 25-min timer, and see it count down to zero with a "success" state.

---

### Stage 2: Cheat Detection + Fail State

Wire up tab visibility detection (`visibilitychange` / `blur` events) to trigger FAIL STATE when the user leaves the app mid-session. Show a locked UI that blocks all interaction until the shame flow is completed.

**Done when:** Switching tabs during an active session locks the app and displays the FAIL STATE screen.

---

### Stage 3: Selfie Capture

Use the browser `getUserMedia` API to capture a photo at session start ("Working Selfie"). Store it in component state for use in the shame card later.

**Done when:** App prompts for camera permission on start, captures a still frame, and holds it in memory for the shame card.

---

### Stage 4: AI Roast Generation

Add a Next.js API route (`/api/roast`) that calls an LLM with the user's goal and a system prompt heavy on 2026 brainrot slang ("Unc", "cooked", "zero aura", etc.). Return a short personalised roast string.

**Done when:** Failing triggers a fetch to `/api/roast` and a unique roast line renders on the FAIL STATE screen.

---

### Stage 5: Shame Card + Export

Design the 9:16 shame card UI (selfie + roast text + hamster mascot + branding). Use `html-to-image` or canvas to export it as a downloadable PNG formatted for Instagram Stories. "Post My Shame" button triggers the download and unlocks the app.

**Done when:** Clicking "Post My Shame" downloads a properly formatted 9:16 PNG and the app returns to the start screen.

---

### Stage 6: Polish + Hamster Mascot

Add the hamster mascot illustrations/animations (idle, judging, roasting), sound effects on fail, and any remaining visual polish. Tighten copy, spacing, and mobile layout.

**Done when:** App looks demo-ready on mobile Chrome with mascot present in all states.

## Current Focus

Stage 1 — Core Timer + Goal Input

## Notes

- Cut Stage 6 first if time runs short — the core viral loop is Stages 1–5.
- Stage 3 (camera) requires HTTPS in production; use `next dev` locally which allows camera on localhost.
- Keep all session state in React component state for now — no persistence needed for the hackathon.
