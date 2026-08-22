# Project Status — Jesus's World

**Last updated:** 2026-08-22, at the merge of `feat/atlas-polish-pass` (main, pushed, deployed).
**For:** picking this project back up in a fresh context. Pairs with `CLAUDE.md`
(the maintained architecture reference — read that first; it is current as of this
commit). `HANDOFF-TEMPLATE.md` is the original Paul's-World-to-Gospels bootstrap
spec — historical, not a status doc.

## What this project is

A single-page React 19 + Vite atlas of the Gospels, AD 29–33, in three linked
surfaces:

- **Atlas** (`#`) — D3 map, 26 places, 7 Herodian regions, 6 periods, a 4-state
  timeline of 16 marquee events, and a Play mode that narrates the whole arc.
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

## In progress — flag-event curation (uncommitted)

The 15 marquee events on the timeline were inherited Paul's-World picks. Two
decisions from Patrick drove this: sync the roster to the app's own `major`
flag, and have the flag row **dim** rather than filter under the Gospel Lens.

**The roster is now `paulEvents` where `type === 'major'`** — 16 events, and
that identity is the definition, not a coincidence. The two had drifted: the
flag row carried the AD 30 temple cleansing and the Olivet Discourse (both
`minor`) and omitted the call of the disciples, the Great Commission and the
Ascension (all `major`). Both dropped events still appear in the drill-down
EVENTS row; only their flags are gone. *Consequence worth knowing:* the temple
cleansing's `dateNote` about whether John's cleansing and the Synoptics' are one
event or two was the only `dateDebated: true` in the data, and it is gone with
the flag. Nothing else in the app records that dispute.

**The real find was not curation, it was a live defect.** Every event carried a
whole-year `dateRange` inherited from Paul's epistles, where whole years over AD
44–68 were fine. On a 29–33.5 axis six events sat on one pixel, and hit-testing
the DOM showed **5 of the 15 were unclickable** — Feeding the 5,000, the
Triumphal Entry, the Last Supper, Lazarus and the Olivet Discourse were
pixel-identical rects buried under siblings painted later. Five events were also
dated *outside* their own period (all four Passion Week flags sat at AD 33 while
`period-5` spans 33.24–33.258). Events now carry the true fractional year, plus
a `when` string for display, since `33.256` is not a date a reader can use.

Fixing the dates was necessary but not sufficient: Passion Week is six days,
about 4px on this axis. So one shared `packRow()` collision resolver now serves
all three chip layouts. Two further problems surfaced from that:

- State 2's stagger only fired on *exact* coincidence, so true dates broke it
  completely — chips 3px apart with 34px bodies, and the exact-match test never
  saw it. Now packed properly.
- State 3 was **already overflowing the right edge before this work** (right
  edge 1159 against a 1140 limit on the old roster) because shelves were
  balanced by count, not width. Now balanced by width, and on **four** shelves
  rather than three: 16 full names total ~2900px against a 1060px axis, so a
  three-way split forces some chip ~310px from the date it marks. Four halves
  that. State 3's panel is correspondingly taller.

Also folded in, because the roster change forced them: `attribution` is gone
from the data (Paul's authorship vocabulary reused to mean "fewer than four
Gospels", derivable from `gospels`, and already wrong for the temple cleansing);
`BOOK_CHURCH` is derived rather than hand-maintained; BookDetailPanel names the
Gospels outright instead of hedging.

**Verified:** all 16 flags individually hit-testable (was 10 of 15); zero chip
overlaps in states 2 and 3 with nothing outside `[80, 1140]`; the lens lights
exactly the 9 events John records and dims the other 7. Lint at the 4+2
baseline, build clean.

**Not done, deliberately:** `MapView.jsx:866` still widens a selected event's
map segment by `±0.5` years, a fudge for the old whole-year dates. It was
already swallowing whole periods, so this is not a regression — but true dates
now make a real segment highlight possible.

## Also in this batch — the two items Patrick raised mid-session

**The "Read the Last Week · Scripture" pill is gone** (`StoryLayer.jsx`, plus
its `.story-read` styles). It dated from before the Reader had a home of its
own; with a top-level Reader tab it was a second door to a room that already
has one. `.story-entry` now wraps the tour button alone.

**A first-run tour** (`src/components/Tour.jsx` + `.tour-*` styles). Nine steps
over the atlas chrome — nav tabs, Gospel Lens, filter modes, layer list,
timeline state nav, the timeline, the story button — spotlighting each in turn.
Opens once ever (`localStorage['jw-tour-done']`, 700 ms after the hero clears,
atlas route only) and is reopenable from a new `?` beside the theme switch.

Notes worth keeping:

- The scrim is the spotlight's own `box-shadow: 0 0 0 9999px`, so it tracks the
  target exactly with one element. A box-shadow isn't hit-testable, hence the
  separate `.tour-veil` to swallow clicks.
- The tour is deliberately read-only. Driving the app mid-step would let a later
  step contradict what an earlier one just said.
- Placement is imperative rather than state — it reads the live rect of elements
  it does not own, and that also keeps it off the `set-state-in-effect` rule
  that already accounts for two of the four baseline lint errors.
- At ≤768px the three layers-panel steps spotlight the hamburger instead (the
  panel is off-canvas) and show a "Tap ☰" hint.

**Verified:** all 9 steps spotlight their target to within 0.6px at 1360×860 and
at 375×812; cards stay fully in the viewport and never cover the spotlight; the
card flips above its target at the bottom of the screen; light theme checked.
Measured against the inline styles rather than the animated rect — the hole has
a 280ms CSS transition and reading `getBoundingClientRect()` mid-flight gives
nonsense.

## Reader: a real 50/50 split (uncommitted)

Patrick asked whether shifting the map right and giving the text more room would
help. It does, and the investigation turned up why: the Reader was never a split
at all. The map was full-bleed and a 90° gradient scrim did a layout's job with
paint — near-opaque to 38%, still 45% at 62%. So the western half of the map was
rendered and then buried, the map was never seen at full strength anywhere, the
text sat at a cramped 46ch, and a dead band ran between the column and the point
the map became legible.

`.rd-map` now takes the right half, `.rd-scroll` the left, the column goes to
64ch, and the scrim is reduced to feathering the seam. Below 820px it collapses
back to the overlay.

Three things had to move with it, and two were latent bugs:

1. **`preserveAspectRatio`.** A 1200×680 landscape viewBox in a half-width
   portrait pane letterboxed to 680×386 — a **237px dead band top and bottom**.
   `MapView` takes a `fitMode` prop now; the Reader passes `slice`, the Atlas
   keeps the `meet` default. `ScaleBar` takes the same value or it detaches.
2. **`panToCity` mixed coordinate spaces** — `getBoundingClientRect()` CSS pixels
   against projection output in viewBox units. Verified against a stashed tree:
   on `HEAD`, locating a city leaves it **78px right of the map's centre**; with
   the fix it lands at exactly `[0, 0]`. This was already wrong on the Atlas —
   halving the map's width just made it impossible to ignore.
3. **`JerusalemDiagram` was compressed into x 643–1200** purely to clear the old
   scrim, which hid everything left of ~700. Its viewBox now crops to the
   drawing, padded vertically so `slice` eats headroom instead of labels. The old
   frame cropped ~47 units a side; Olivet, Bethphage and Bethany were losing
   their sublabels outright. Measured: 0 of 26 labels clipped now.

**Verified** at 1360×856 and 375×812: no letterbox (map fills 0→860 in its pane),
column at 64ch/43%, close-up fully legible, mobile falls back to full-bleed
overlay, Atlas `preserveAspectRatio` untouched.

## Map linework (uncommitted)

Patrick: the map lines looked "simplistic / childish" next to the rest of the UI.
Three measurable causes, all now fixed:

1. **Route casings were near-black** — `#06110b` at 0.85 opacity, 3.6px under a
   2px line, i.e. an 0.8px black rim each side. Routes read as stickers cut out
   and laid on the map, and where two crossed, one route's black rim sliced
   through the other's colour; six converge on Capernaum and the rims stacked
   into a blob. Casings are now a cast of the route's own hue mixed toward the
   ground.
2. **The basemap had no line hierarchy** — coast 0.6, country borders 0.7,
   region borders 0.7, graticule 0.5, roads 0.8. A 0.3px spread across five
   layers of totally different importance, with the coastline thinner than the
   roads. Now 1.1 / 0.9 / 0.9 / 0.5 / 0.4, strongest natural feature first.
3. **Chevrons were the same hue and near the same weight as the line** they sat
   on, so they read as bumps in the route rather than direction markers. Now a
   lighter tint at 1.05.

Two things found on the way:

- **Per-segment routes were beading.** Each route is one path per waypoint pair
  and opacity was set per path, so at any opacity below 1 the round caps where
  segments meet composited twice and printed a brighter pip at every stop.
  Opacity now rides the segment/casing groups instead — also 26 DOM writes down
  to 2 per journey.
- **`d3.color().brighter()/darker()` clip.** They scale RGB channels, so the
  gold route's light-theme casing came out neon `#ffff86` and its chevrons
  `#fffd73`. All derived route colours now go through a `tint()` helper using
  `d3.interpolateRgb` toward the theme's ground or ink.

**Verified** in both themes at k=1 and k=3, and the Reader's map inherits all of
it (same component).

**Not addressed:** the routes still tangle through Galilee — six periods crossing
the same corridor. That is data density rather than linework, and thinning it
means a display decision (fade inactive periods further, or offset parallel
runs), so it is worth deciding rather than guessing.

## Two small vocabulary fixes

- **The search placeholder said "Search cities or letters…"** — inherited from
  Paul's World, where `books` were epistles. It now reads "Search places or
  events…", and the result badges say PLACE / EVENT rather than CITY / LETTER
  (several of the 26 "cities" are a mountain, a garden or a stretch of
  wilderness). Search also matches an event's full `name` now, not just its
  abbreviation and id.
- **The search results were printing raw fractional dates** — "AD 33.256–33.256"
  — a live regression from giving events true dates. They read `when` now. Worth
  remembering: `dateRange` is for the axis, `when` is for display, and anything
  that prints a date needs the latter.

**The timeline opens on state 0 ("Periods") rather than state 1.** Patrick's
call: the flags should be the first step a reader takes, not the state they walk
in on. Note this means the state-1 dock magnification and flag tooltips are not
reachable until Next is pressed once.

## Current state

- **Deployed:** everything above is merged to `main` and pushed.
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
5. **The `.tl-resize-handle` overlaps the upper flag row.** An 8px drag strip
   sits across the top of the timeline card, and the state-0/1 upper dots are
   centred ~1px inside it, so the top half of each is not clickable. Found
   while hit-testing the flag row; confirmed **pre-existing** by re-probing a
   stashed tree, so it is not fallout from the curation work. Only the upper
   row is affected — the lower row is clear.
6. **The Reader has no `NavTabs`.** `App` and `VisualsDemo` both render the
   Atlas/Charts/Reader strip; `GospelReader` builds its own header and omits it,
   so the Reader is the one surface you cannot tab out of — only its own exit
   back to the Atlas. Noticed while route-testing the tour; pre-existing.
7. **Accessibility** — keyboard access to the D3 surfaces is unaudited.
8. **Meta basics** — favicon, OG image, per-route titles are still Vite defaults.
9. **Mobile** — spot-checked, never audited holistically.

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
