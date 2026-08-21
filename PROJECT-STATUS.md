# Project Status — Jesus's World

**Last updated:** 2026-08-21, at commit `d5430a1` (main, pushed, deployed).
**For:** picking this project back up in a fresh context. Pairs with `CLAUDE.md`
(the maintained architecture reference — read that first; it is current as of this
commit). `HANDOFF-TEMPLATE.md` is the original Paul's-World-to-Gospels bootstrap
spec — historical, not a status doc.

## What this project is

A single-page React 19 + Vite atlas of the Gospels, AD 29–33, in three linked
surfaces:

- **Atlas** (`#`) — D3 map, 26 places, 7 Herodian regions, 6 periods, a 4-state
  timeline, and a Play mode that narrates the whole arc.
- **Charts** (`#/visuals`) — where the 34 miracles and 34 parables cluster, and
  which Gospels attest which events.
- **Reader** (`#/gospels`) — all four Gospels as a 39-day chronological
  read-through, 3,779 verses, with the map and timeline tracking where you are.

Deployed on Vercel, auto-builds on push to `main` (`vercel.json` is `{}`). No test
suite; verify by running it and looking.

**It began as an atlas of Paul's journeys and was reskinned.** Much of the recent
work has been removing inherited assumptions. Expect more of them.

## What shipped this session

Seven merges, `571b035..d5430a1`. In order:

1. **Timeline material** (`1415162`) — the panels' glass/lip system rebuilt for SVG
   in `TimelineDefs.jsx` + `utils/timelineMaterial.js`: sheen, bevel stroke, dome,
   cast shadow, inner-shadow groove, all driven by CSS custom properties so they
   invert for the parchment theme. Also fixed year labels that were painted
   underneath the flag-dot row, and a scrubber that re-appended its DOM on every
   prop change (5 stacked copies on a cold load).
2. **The Reader** (`7a82935`) — `scripts/build-reading-plan.mjs` turns Patrick's
   39-day plan table into `src/data/reading-plan/`. Fetches all 89 Gospel chapters
   once and slices locally. Verified complete: 3,779 verse instances.
3. **Reader timeline day rail** (`1033217`) — day ticks positioned by year were
   unclickable in the last third of the plan (days 311–324 all sit at AD 33.25).
   Split into a true AD axis plus an evenly spaced picker rail.
4. **One themed tooltip** (`3c63bb6`) — SVG `<title>` draws the browser's native
   tooltip; removing it fixed both a duplicate and an unstyled one.
5. **Passion Week folded in** (`b404105`) — the curated reader is gone as a
   separate tab. Its 16 scenes attach at build time to the plan section
   containing their `ref` and render inline at the anchor verse.
6. **Drill-down vocabulary** (`4efc93d`) — dropped the LETTERS row, renamed
   CHURCHES → PLACES, and keyed markers to `category` instead of the inherited
   `type`.
7. **Basemap** (`49dec1f`, `d5430a1`) — cropped the 10m atlas to the Levant
   (3.49 MB → 290 KB) and removed the `rewindRings` helper that was inverting
   land and sea on first paint.

## Current state

- **Deployed:** `main` == `origin/main` == `d5430a1`. Everything above is live.
- **Working tree:** clean.
- **Lint:** `npx eslint src/` reports **4 errors + 2 warnings, all pre-existing**
  and unchanged since before this session:
  - `src/App.jsx:215` and `src/components/SearchBar.jsx:49` — `setState` in an
    effect (`react-hooks/set-state-in-effect`)
  - `src/components/MapView.jsx:320` — `onCityClick` defined but never used
  - `src/components/PaulEventTrack.jsx:125` — `subY` assigned but never used
  - plus 2 `exhaustive-deps` warnings on intentionally mount-only effects
- **Build:** clean.
- **Dev port:** `.claude/launch.json` pins 5199 because 5173 is occupied by
  another project on this machine. Untracked by git.

## Next steps

1. **Two dead files** — `src/components/ReadingMode.jsx` and
   `src/components/BookTrack.jsx` (plus the `.bt-*` styles in `index.css`) are
   unreferenced and out of the bundle but still on disk. Patrick was asked and
   hasn't decided; don't delete without confirming.
2. **Review the 26 declared reading locations** in `LOCATION_OVERRIDES`
   (`scripts/build-reading-plan.mjs`). They drive the reader's map and were
   assigned by Claude, not by Patrick. e.g. the Sermon on the Mount → Capernaum.
3. **No prose in the reader** — deliberate, by Patrick's choice ("ship without
   prose first"). The `gr-scene` styling already exists if day-level notes get
   written later.
4. **Machaerus is missing from the atlas.** Day 300's execution of John is
   declared `null` rather than pinned somewhere the text doesn't claim. Adding
   the city would fix it properly.
5. **Flag-event curation** — the 15 marquee events are inherited picks. No
   Gethsemane, no Ascension. Worth explicit criteria, or making the flag row
   respond to the Gospel Lens.
6. **Accessibility** — keyboard access to the D3 surfaces is unaudited.
7. **Meta basics** — favicon, OG image, per-route titles are still Vite defaults.
8. **Mobile** — spot-checked, never audited holistically.

## Working notes

- **Patrick reviews on localhost, then says "merge"/"deploy" explicitly.** He did
  authorise pushing this session; that authorisation was per-request, not standing.
- **Verification through the Claude Code browser pane has a trap.** It runs with
  `document.hidden === true`, so `requestAnimationFrame` never fires and d3
  transitions never complete. Missing animation there is *not* evidence of a bug —
  this produced one wrong bug report and a retraction this session. Inspect CSS and
  attribute state freely; to check transition-driven behaviour, assert on the
  inputs or bypass the animation.
- **Generated data is never hand-edited.** Three generators, listed in CLAUDE.md's
  Commands block. Re-run them; don't patch their output.
- **Check the data before trusting a label.** Several bugs this session were fields
  whose names lied — a "LETTERS" row rendering events, a legend keyed to a
  vestigial taxonomy. `gospels-data.json` still carries Paul's-World field names.
