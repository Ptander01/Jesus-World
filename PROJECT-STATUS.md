# Project Status — Jesus's World

**Last updated:** 2026-08-26, at `HEAD` (main, rebased onto origin, not pushed).
**For:** picking this project back up in a fresh context. Pairs with `CLAUDE.md`
(the maintained architecture reference — read that first; it is current as of this
commit). `HANDOFF.md` carries a
paste-ready prompt for starting a fresh session. `HANDOFF-TEMPLATE.md` is the
original Paul's-World-to-Gospels bootstrap spec — historical, not a status doc.

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

## What shipped in the session before that

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

## This session — five small fixes, plus analytics

Former next-steps 7, 8 and 9, plus two mobile defects on the Charts page. All
verified on localhost:

- **The selected-event map highlight now marks one leg**, not most of a period.
  The ±0.5-year pad was a leftover from whole-year dates; all 16 events went from
  4–7 waypoints to exactly 2 (the crucifixion had been highlighting the whole of
  Passion Week). Caveat worth a look: the Passion Week legs are sub-kilometre, so
  at the opening zoom those highlights are a dot — nothing zooms on selection.
- **`.tl-resize-handle` was worse than recorded.** Not a 1px graze: the full-width
  8px strip sat over the *entire* upper flag row, and `elementFromPoint` at each
  dot's centre returned the handle for **all 8 upper-row events** in states 1
  and 2. It is now 48px, centred on its own grip.
- **The Reader has `NavTabs`**, replacing the one-way "← The Atlas" button, so all
  three surfaces switch the same way. `onExit` is gone from `GospelReader` and
  `Root`.

- **The Charts page had no width media query at all** — it had never been laid
  out for a phone. At 375px the heatmap rendered 783px of grid into a 277px card
  and lost four of its six periods with no way to reach them, because `.jw-card`
  is `overflow: hidden`. Wide charts now scroll inside their own card
  (`.jw-scrollx`, bleeding out to the card's padding edges so a part-cut column
  reads as "more this way"), and a `max-width: 760px` block claws back the side
  padding and retunes the heatmap's fixed tracks. 783px unreachable → 615px
  reachable in a 349px viewport. Desktop layout is byte-identical.
- **The theme toggle was off-screen below ~484px.** The shared `.app-header` laid
  out at a fixed content width, so `.tt-wrap` (`margin-left: auto`,
  `flex-shrink: 0`) was pushed past the right edge — at 375px it began 1px
  outside the viewport. The nav tabs now shrink at ≤520px and again at ≤340px;
  the Charts header fits down to 320px. **The Atlas header still overflows** —
  see next-steps 10.

- **Vercel Web Analytics, wired to the hash router.** Vercel's automated install
  PR was closed: it was mechanically correct (and its three `<Analytics>` copies
  were harmless), but its script only sees History-API navigation — it patches
  `pushState`, listens for `popstate`, and has no `hashchange` handler. On this
  app that meant one view per page load and nothing after, with the atlas, charts
  and reader all collapsing into `/`. Verified by reading the shipped script and
  by driving the running app: five hash navigations, zero events. Now one
  `<Analytics route path>` in `Root.jsx`, auto-track off, `/gospels/286` grouped
  as `/gospels/:day`. See CLAUDE.md's Analytics section for the two traps.

Also corrected in CLAUDE.md: `bookState` defaults to **0** ("Periods"), not 1.

## Current state

- **Deployed:** Vercel is still on `1a1e9e8`. The work above is committed to local
  `main`, rebased onto `origin/main`, but **not pushed** — Patrick reviews on
  localhost first.
- **Web Analytics still needs enabling in the Vercel dashboard.** The package
  does not turn it on, and `/_vercel/insights/script.js` only exists once it is.
- **Lint:** 3 errors + 2 warnings. Down one from the long-standing four —
  wiring the town plans gave `MapView`'s `onCityClick` a use at last. The rest
  are pre-existing: `setState` in an effect (`App.jsx`, `SearchBar.jsx`), an
  unused `subY` in `PaulEventTrack.jsx`, and two intentional `exhaustive-deps`.
- **Build:** clean.
- **Weight:** main chunk 1.23 MB / **391 kB gzipped** — that is what blocks first
  paint. Geography is code-split and idle-loaded, so it does not: basemap 90 kB
  gz, water 54 kB, terrain 73 kB, hillshade 223 kB (posterised to 32 greys, down
  from 524). d3 tree-shakes correctly — every unused package is shaken out, so
  submodule imports would buy nothing. `@vercel/analytics` costs +1.1 kB gz.
- **Dev port:** `.claude/launch.json` pins 5199. Untracked.

## Next steps

Content gaps first — these are what the atlas is still missing rather than what
is broken.

1. **`JerusalemDiagram` and the Jerusalem town plan now overlap.** The plan
   (clicking Jerusalem on the atlas) is the city with its attested features; the
   diagram is the Passion-Week close-up in the Reader. Both are useful and they
   disagree about nothing, but a reader meeting them in sequence sees the same
   city drawn twice in two idioms. Worth resolving.
2. **Machaerus is missing from `cities`**, so day 300's execution of John is
   pinned to `null` rather than to where the text puts it.
3. **The 26 `LOCATION_OVERRIDES`** driving the reader's map were assigned by
   Claude, never reviewed by Patrick. e.g. Sermon on the Mount → Capernaum.
4. **The Galilee route tangle** — six periods crossing one corridor. Data
   density, not linework; thinning it is a display decision (fade inactive
   periods harder, offset parallel runs, show fewer at once) and so Patrick's.

Debt and unfinished business:

5. **The Paul's-World cluster still on disk.** `src/data/pauline-journeys-data.json`
   (73 kB, imported by nothing), `PAULS-WORLD-APP-SPEC.md`, `TIMELINE-DRILLDOWN-SPEC.md`
   and `scripts/enrich-data.cjs`, which operates on that data. The two
   `philippians-*.html` pages were removed from `public/` — they were being
   served publicly — but this group was left alone, since `HANDOFF-TEMPLATE.md`
   is deliberately kept as history and these may be the same.
6. **Two dead components** — `ReadingMode.jsx` and `BookTrack.jsx` (plus the
   `.bt-*` styles). Zero references, still on disk. Patrick has been asked twice
   and not decided.
7. **No prose in the reader** — deliberate, by Patrick's choice. The `gr-scene`
    styling exists if day-level notes get written.
8. **Accessibility** — keyboard access to the D3 surfaces is unaudited.
9. **Meta basics** — favicon, OG image, per-route titles are still Vite defaults.
10. **Mobile — the atlas header overflows.** At 375px the Atlas header lays out
    five children in 553px: the search box, the `?` tour button and the theme
    toggle are all off the right edge and unreachable. The Charts header (three
    children) now fits down to 320px, but the Atlas has too many controls for the
    row, and the fix is a layout decision — wrap to a second row, collapse search
    to an icon, or move some into the filter drawer. Patrick's call.
    The tour and the reader split were checked at 375×812; the atlas has still
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
