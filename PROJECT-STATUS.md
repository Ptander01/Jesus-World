# Project Status — Jesus's World

**Last updated:** 2026-08-22, at `2a184ea` (main, pushed, deployed).
**For:** picking this project back up in a fresh context. Pairs with `CLAUDE.md`
(the maintained architecture reference — read that first; it is current as of this
commit). `HANDOFF-TEMPLATE.md` is the original Paul's-World-to-Gospels bootstrap
spec — historical, not a status doc.

## What this project is

A single-page React 19 + Vite atlas of the Gospels, AD 29–33, in three linked
surfaces:

- **Atlas** (`#`) — D3 map with real physical geography, 26 places, 7 Herodian
  regions, 6 periods, 16 marquee events on a 4-state timeline, schematic town
  plans, and a Play mode that narrates the whole arc.
- **Charts** (`#/visuals`) — where the 34 miracles and 34 parables cluster, and
  which Gospels attest which events.
- **Reader** (`#/gospels`) — all four Gospels as a 39-day chronological
  read-through, 3,779 verses, text and map sharing the screen.

Deployed on Vercel, auto-builds on push to `main`. No test suite; verify by
running it and looking.

**It began as an atlas of Paul's journeys and was reskinned.** Most of the recent
work has been finding inherited assumptions that were quietly wrong. Expect more.

## What shipped in the last session

Fourteen commits, `e0e1408..2a184ea`. Grouped:

**Timeline and events.** The 16 marquee events are now defined as
`paulEvents.type === 'major'` — the two had drifted. They carry true fractional
dates; the old whole-year values put six on one pixel and left **5 of 15
unclickable**. One `packRow()` resolver serves all three chip layouts, state 3
went to four shelves, and the flag row takes the Gospel Lens.

**A first-run tour** (`Tour.jsx`), nine steps, once ever, reopenable from `?`.
The "Read the Last Week" pill is gone — the Reader is a tab now.

**The Reader is a real 50/50 split.** It was a full-bleed map with a gradient
scrim doing a layout's job in paint. That exposed `fitMode` (a landscape viewBox
letterboxed into a portrait pane with a 237px dead band) and a `panToCity` that
mixed CSS pixels with viewBox units — verified against a stashed tree, it left a
located city 78px off-centre on the Atlas too.

**The map's opening view had never worked.** A detail-zoom reset fired on mount
and wiped the curated `initialFocus` every load. Zoom ceiling went 8 → 32
(k=8 could not separate Mount of Olives from Gethsemane, 0.49 km apart), and
drill-down was not merely under-zoomed but *inverted* — a flat ±2° pad meant
clicking a period zoomed further out than the opening view.

**Physical geography.** The Sea of Galilee, Dead Sea and Jordan were absent
entirely, which had also disabled the sea-leg styling — **0 of 42** crossings
classified. Now from OpenStreetMap. Elevation contours and a hillshade from
keyless Terrarium tiles, with an inline PNG codec. And the map was drawing **26
of 41** route segments: waypoint arc lengths came from a nearest-point search, so
every revisit to a city collapsed onto the first.

**Colour and depth.** The period palette was rebuilt in OKLCH — `--j1` had been
the accent gold exactly, three periods sat in a 37° warm band, and three fell
under the 3:1 contrast floor. A second pass moved them off the *ground's* hue
after Patrick spotted green-on-green. Routes gained a cast shadow and a lit top
edge; the timeline's sheen and bevel cannot transfer, because SVG has no way to
gradient across a stroke's thickness.

**Town plans** for Capernaum, Nazareth, Magdala and Bethsaida. They cannot live
on the map — a viewBox unit is 428 m, so Capernaum is 22px wide at maximum zoom.

## Two reconstructions attempted, neither shipped

`build-terrain.mjs` validates its own output and records why it failed rather
than emitting a plausible wrong shape. Both still open:

- **Dead Sea at −395 m** (the antique single-basin shoreline). The surface reads
  −415 m and the west shore is a cliff, so the band is a few pixels wide and
  stitches into scraps even at full resolution. Wants a finer DEM or a lake mask.
- **Lake Huleh** (Josephus's Semechonitis, *War* 3.515 — sixty furlongs by
  thirty). Elevation alone cannot find it: the Huleh valley floor sits at much
  the same height the lake did, so the contour returns the valley, not the lake.
  Wants a hydrological constraint or the pre-drainage survey mapping.

## Current state

- **Deployed:** `main` == `2a184ea`, pushed.
- **Lint:** 3 errors + 2 warnings. Down one from the long-standing four —
  wiring the town plans gave `MapView`'s `onCityClick` a use at last. The rest
  are pre-existing: `setState` in an effect (`App.jsx`, `SearchBar.jsx`), an
  unused `subY` in `PaulEventTrack.jsx`, and two intentional `exhaustive-deps`.
- **Build:** clean.
- **Weight:** main chunk 1.22 MB / **388 kB gzipped** — that is what blocks first
  paint. Geography is code-split and idle-loaded, so it does not: basemap 90 kB
  gz, water 54 kB, terrain 73 kB, hillshade 223 kB (posterised to 32 greys, down
  from 524). d3 tree-shakes correctly — every unused package is shaken out, so
  submodule imports would buy nothing.
- **Dev port:** `.claude/launch.json` pins 5199. Untracked.

## Next steps

Content gaps first — these are what the atlas is still missing rather than what
is broken.

1. **The Temple Mount platform.** 488 × 315 m, retaining walls extant and
   precisely surveyed. The only piece of urban fabric in this atlas that needs no
   schematic caveat at all, and the most recognisable thing in Jerusalem.
   Currently absent entirely.
2. **Jerusalem has no town plan.** It has `JerusalemDiagram`, which is
   Passion-Week-scoped rather than a plan of the city. The two should probably
   merge, and Jerusalem is the site where scale matters most — ~40,000 people
   against Nazareth's ~400.
3. **Machaerus is missing from `cities`**, so day 300's execution of John is
   pinned to `null` rather than to where the text puts it.
4. **The 26 `LOCATION_OVERRIDES`** driving the reader's map were assigned by
   Claude, never reviewed by Patrick. e.g. Sermon on the Mount → Capernaum.
5. **The Galilee route tangle** — six periods crossing one corridor. Data
   density, not linework; thinning it is a display decision (fade inactive
   periods harder, offset parallel runs, show fewer at once) and so Patrick's.

Debt and unfinished business:

6. **The Paul's-World cluster still on disk.** `src/data/pauline-journeys-data.json`
   (73 kB, imported by nothing), `PAULS-WORLD-APP-SPEC.md`, `TIMELINE-DRILLDOWN-SPEC.md`
   and `scripts/enrich-data.cjs`, which operates on that data. The two
   `philippians-*.html` pages were removed from `public/` — they were being
   served publicly — but this group was left alone, since `HANDOFF-TEMPLATE.md`
   is deliberately kept as history and these may be the same.
7. **Two dead components** — `ReadingMode.jsx` and `BookTrack.jsx` (plus the
   `.bt-*` styles). Zero references, still on disk. Patrick has been asked twice
   and not decided.
8. **`MapView.jsx:1116` still widens a selected event's map segment by ±0.5
   years** — a fudge for whole-year dates. Now that events carry true fractional
   dates it swallows whole periods where it could highlight a real segment.
9. **`.tl-resize-handle` overlaps the upper flag row.** An 8px drag strip across
   the top of the timeline card; the state-0/1 upper dots are centred ~1px inside
   it. Pre-existing, confirmed against a stashed tree.
10. **The Reader has no `NavTabs`.** `App` and `VisualsDemo` both render the
    Atlas/Charts/Reader strip; `GospelReader` builds its own header and omits it,
    so the Reader is the one surface you cannot tab out of.
11. **No prose in the reader** — deliberate, by Patrick's choice. The `gr-scene`
    styling exists if day-level notes get written.
12. **Accessibility** — keyboard access to the D3 surfaces is unaudited.
13. **Meta basics** — favicon, OG image, per-route titles are still Vite defaults.
14. **Mobile** — the tour and reader split were checked at 375×812; the atlas has
    never been audited holistically.

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
