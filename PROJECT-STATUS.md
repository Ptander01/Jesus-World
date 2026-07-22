# Project Status — Jesus's World

**Last updated:** 2026-07-21, at commit `a19b9f5` (main, pushed, deployed).
**For:** picking this project back up in a fresh context — a new Claude session, a
different tool, or a human collaborator. Pairs with `CLAUDE.md` (architecture
reference, keep that as the source of truth for how the code works) and
`HANDOFF-TEMPLATE.md` (the original Paul's-World-to-Gospels bootstrap spec — historical,
not a status doc). This file is the "what happened and what's next" layer.

## What this project is

A single-page React 19 + Vite atlas of the Gospels: a D3 map of the ministry (AD
29–33), a timeline with a 4-state progressive-disclosure events system, a Play mode
that narrates the whole arc, a data-visualization page ("Charts" in the nav, route is
`/visuals`), and a scroll-driven
Passion Week reader (`/read`). Deployed on Vercel, auto-builds on every push to `main`
(`vercel.json` is `{}` — no custom config, default Vite build). No test suite; verify
changes by running `npm run dev` and looking.

## How this session's work started

The user asked for a critique of the whole app "as if seeing it for the first time,"
wearing a designer/historian/researcher/pastor hat. That critique became a roadmap; this
session worked through it top to bottom, plus one more feature added afterward (the
Jerusalem diagram) in response to direct feedback on the reader. Everything below is
merged to `main` and live.

## What shipped this session, in order

### 1. Hero landing page — parallax fixes + full rebuild
*(`fix/hero-parallax-transparency`, `feat/hero-depth-glide`, all merged)*

- The hero's background layers had a real bug: the source PNGs had the *editor's
  transparency-preview checkerboard* baked in as opaque pixels, not real alpha — so
  scrolling revealed a literal checkerboard. Rekeyed to true transparency, moved the
  assets from `public/` into `src/assets/hero/` so Vite content-hashes the filenames
  (cache-proof against future edits), converted to WebP (~90% smaller).
- Also fixed: the scroll handler was overwriting each layer's CSS `scale()` with a bare
  `translateY()`, popping every layer to scale 1.0 on the first scroll tick.
- Reworked from a plain scroll-away hero into a **pinned depth-glide parallax**: a
  sticky stage holds the scene in view while foreground/midground/sky drift at
  different rates, then the whole thing dissolves into the live atlas underneath.
  Extended the source images vertically (mirror+blur, no real DEM/extra art) so the
  full width shows at real screen aspect ratios instead of being center-cropped.
- Added ambient life: sweeping sun rays (conic gradient, seamless loop), a brighter
  breathing glow, drifting lake mist, and a small bird flock — all CSS-animated
  children of the parallax layers, no JS cost.

### 2. App-wide design critique → roadmap
No code — a structured review (nav/discoverability, charts-page polish, timeline type
scale, region-boundary quality, flag-event curation, plus a "what else" list covering
terrain, performance, scripture depth, a11y, meta). Everything below is that roadmap
being worked.

### 3. Nav shell + charts-page overhaul + timeline type scale
*(`feat/shell-visuals-type`, merged)*

- New `NavTabs` component (Atlas / Charts / Reader) in both the atlas header and the
  charts page header — the charts page (route is still `/visuals`, nav label reads
  "Charts") was previously only reachable by typing the URL.
- The charts page redesigned: editorial masthead with a stated takeaway, glass/lip cards
  matching the atlas's existing token system, and a **validated** dataviz palette (ran
  the project's color validator — the original chart hues failed the colorblind-safety
  check; refit in OKLCH until they passed). The heatmap changed from a per-row rainbow
  to one sequential gold ramp + category-identity dots, which is what it was trying to
  say all along.
- Light theme got its own parchment glass/pill/lip tokens in `tokens.css` — previously
  the dark-mode glass tokens leaked into light mode everywhere.
- Every timeline label (6.5–10.5px Cinzel) raised to a legible floor (~9–12.5px). This
  surfaced a real layout bug: the 4-state books system's "state 3" (full event names)
  was built on 2 shelves inherited from Paul's World's 13 short book abbreviations —
  15 full-length Gospel event names didn't fit, and **The Last Supper and The
  Resurrection were being clipped off the timeline entirely**. Rebuilt state 3 onto
  3 width-balanced shelves; all 15 now render.

### 4. Region boundaries v2
*(`feat/region-boundaries-v2`, merged)*

- The Herodian tetrarchy polygons (Galilee, Judea, Samaria, Perea, Decapolis, Ituraea,
  Phoenicia) were ~50%-confidence hand contours (Perea was 6 vertices). Rebuilt all 7
  from real geography: coastline, Jordan River, Yarmuk, and Dead Sea lines extracted
  from the same `world-atlas` 10m data the basemap already renders, inland borders
  hand-anchored and Chaikin-smoothed. Every border is defined once and shared by both
  neighboring regions, so adjacency is exact.
- Committed as a **reproducible generator**, `scripts/generate_regions.py` — rerun it
  any time the borders need adjusting; it re-validates that all 26 cities still fall
  inside their declared region before writing.
- Hit and fixed a real d3-geo gotcha: rings must be wound planar-clockwise or the
  fill floods the entire map (the sphere's complement). First run did this; documented
  in the script's own comments so it doesn't get relitigated.
- Styling: dashed hairline borders (was solid fill), added per-region ruler sublabels
  ("Herod Antipas," "Roman prefect," "League of ten cities"), quieter default fills.

### 5. Scripture everywhere + map beauty pass
*(`feat/scripture-everywhere`, `feat/map-beauty-pass`, merged together)*

- `src/lib/scripture.js` + `ScriptureReveal` component: click-to-expand verse text
  fetched from `bible-api.com` (World English Bible, public domain — same source as the
  existing Passion Week reader's verses), cached in-memory + sessionStorage. Wired into
  FilterPanel's Events and Parables lists, BookDetailPanel's key verse and full
  account, and the Play-mode story caption. Multi-Gospel refs
  (`"Matt 3:13-17; Mark 1:9-11; ..."`) render every attesting passage, not just the
  first.
- Map contrast: **measured** the land/sea fill contrast (WCAG formula) at 1.27:1 —
  nearly invisible, which was most of why the map read as a flat dark void. Bumped to
  1.7:1, brightened the coastline stroke.
- Added an impressionistic terrain relief layer (soft radial gradients, clipped to the
  land silhouette): warm highland glows over Judea, Galilee, and the
  Golan/Transjordan plateaus; a cool shadow deepening south along the Jordan rift to
  the Dead Sea. Explicitly not a claim of surveyed elevation — said so in the code
  comment — but it makes "going up to Jerusalem" visually true.
- Curated first load: the map used to open fully dark with nothing active. Now seeds
  `Early Ministry` as active and settles the initial zoom on the Galilee cluster
  (Nazareth/Capernaum/the lake) instead of the full 200km strip.

### 6. Jerusalem city diagram
*(`feat/jerusalem-city-diagram`, merged — done in response to direct user feedback
after seeing a reference screenshot from a sibling project)*

- The Passion Week reader (`/read`) had a real problem: **7 of its 16 scroll sections
  shared one `cityId`** ("jerusalem" — temple, fig-tree, lament, supper, cross, tomb,
  Thomas), so the map pin sat frozen through the story's most dramatic stretch.
- Built `JerusalemDiagram.jsx`: a hand-placed *schematic* reconstruction (not a
  geographic projection like `MapView`) — city wall with corner posts, the Temple
  Mount, Antonia Fortress, the Upper Room, Gethsemane and Golgotha as dashed
  "dramatic-site" markers, the Garden Tomb, Olivet, the Kidron Valley, with Bethphage
  and Bethany flagged at the frame's edge. 13 of 16 reader sections now resolve to a
  distinct site (`passion-reading.json`'s new `site` field) and glow-pulse when active.
  The remaining 3 (Emmaus, the Galilee shore, the mountain of the Commission) keep the
  regional `MapView` — those really are far away, and showing them zoomed out is the
  right choice, not a gap.
- Real bug caught mid-build: the reading pane's scrim (`.rd-map-scrim`) is *fully
  opaque* for roughly the first third of its width, by design, so prose stays legible.
  The first layout pass put Golgotha and the Garden Tomb inside that dead zone —
  literally unrenderable regardless of active/glow state, not just dim. Rebuilt the
  whole composition to live inside the readable band; gave close-up mode its own
  slightly gentler scrim variant.
- `ReadingMode` crossfades between the regional map and the close-up diagram; both stay
  mounted so neither cold-starts mid-scroll.

## Current state

- **Deployed:** `main` is pushed to `origin/main` and matches it exactly; Vercel
  auto-builds on push. Everything above is live.
- **Working tree:** clean.
- **Branches:** every `feat/*` and `fix/*` branch used this session (`feat/hero-depth-glide`,
  `feat/map-beauty-pass`, `feat/region-boundaries-v2`, `feat/scripture-everywhere`,
  `feat/shell-visuals-type`, `fix/hero-parallax-transparency`,
  `feat/jerusalem-city-diagram`) is **fully merged (0 commits ahead of main)** — safe to
  delete. Two other local branches, `backup/hero-golden-hour` and
  `visuals-integration`, also show 0 ahead of main; confirm their purpose before
  deleting in case they're intentional snapshots from before this session.
- **Lint:** `npx eslint src/` reports **4 pre-existing errors + 2 warnings**, all
  present before this session started (verified against `main`'s prior state) and
  untouched by any of the above work:
  - `src/App.jsx:215` — `setState` called synchronously in an effect
    (`react-hooks/set-state-in-effect`)
  - `src/components/SearchBar.jsx:49` — same pattern
  - `src/components/MapView.jsx:320` — `onCityClick` prop defined but never used
  - `src/components/PaulEventTrack.jsx:120` — `subY` assigned but never used
  - Plus 2 `exhaustive-deps` warnings in `MapView.jsx` on intentionally mount-only
    effects (`initialFocus`, `cityById`, `onMapReady`, `projection` — pattern already
    established elsewhere in that file, safe to leave, but worth a comment if it
    starts causing confusion).
  A cleanup task for the 4 errors was spawned mid-session but never landed — still
  open.
- **Build:** `npm run build` passes clean.

## Next steps (not yet started — pick from here)

Roughly in the order they'd matter most, but nothing here is blocking:

1. **Lint cleanup** — the 4 pre-existing errors above. Small, isolated, good first
   task for a fresh session to warm up on.
2. **Flag-event curation** — the timeline's 15 flag events (Baptism → Resurrection)
   are inherited picks from Paul's World's 13-epistle structure, not chosen against
   explicit criteria for the Gospels. Notable gaps: no Gethsemane flag, no Ascension
   flag (both are now visible as *sites* in the new Jerusalem diagram, but neither is
   a timeline flag event). Worth either writing explicit selection criteria and
   re-picking, or making the flag row respond to the Gospel Lens (Matthew's landmarks
   vs. John's genuinely differ — could be a feature, not just a fix).
3. **Content gap in the reader** — the Passion Week reader jumps from `arrest` straight
   to `cross`; there's no section for the Sanhedrin/Caiaphas or Pilate trial scenes.
   The new Jerusalem diagram already has an `antonia` (Antonia Fortress / Praetorium)
   pin sitting unused as scenery — a `trial` section would slot in naturally.
4. **Bundle size** — `countries-10m.json` is a ~3.5MB lazy-loaded chunk for an app
   whose entire theater of action is a ~200km strip of the Levant. Cropping it to the
   relevant bounding box would be a large, cheap win. (Noted in the original critique,
   not yet touched.)
5. **Accessibility pass** — contrast on the dark map (partially addressed via the
   land/sea contrast fix, but not audited end-to-end), keyboard access to the D3
   surfaces (map, timeline, charts).
6. **Meta basics** — favicon, an OG image (the hero art would work well), per-route
   page titles. Still default Vite scaffold values.
7. **Mobile pass** — spot-checked during this session (hero at phone widths, the
   reader's close-up diagram correctly recedes to ambient texture under the existing
   mobile scrim rule) but not audited holistically. Worth a dedicated look at panel
   overlap and touch targets across all three surfaces.
8. **Possible extension** — if the Jerusalem diagram lands well with the user, the same
   schematic-city approach could extend to other single-location clusters if any
   future content warrants it (none currently do — the other 15 journeys/events are
   already well spread across the regional map).

## Quick orientation for a fresh session

- Read `CLAUDE.md` first — it's the maintained architecture reference and describes
  patterns (D3 render-effect conventions, the 4-state timeline system, the glass/lip
  design tokens, MapView's zoom/reveal machinery) that this file intentionally doesn't
  repeat.
- Data lives in `src/data/gospels-data.json` (15 flag events, 55 church/site events,
  34 parables, 26 cities) and `src/data/passion-reading.json` (the reader's 16
  sections, 13 of which now carry a `site` field into `JerusalemDiagram`).
- `npm run dev` for HMR, `npm run build` to verify, `npx eslint src/` before
  committing anything new.
- This user reviews on localhost before merging, then says "merge" / "deploy"
  explicitly — don't push to `main` unprompted.
