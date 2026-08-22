# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server with HMR (5173, or next free port)
npm run build     # production build to dist/
npm run preview   # preview production build locally
npm run lint      # run ESLint
```

There is no test suite configured. Verify by running the app and looking.

Generators (re-run after editing their inputs, never hand-edit their output):

```bash
node scripts/build-reading-plan.mjs   # src/data/reading-plan/  (--refetch to bypass the HTTP cache)
node scripts/crop-basemap.mjs         # src/data/basemap-levant.json
node scripts/build-water.mjs          # src/data/water-levant.json   (--refetch)
node scripts/build-terrain.mjs        # src/data/terrain-levant.json (--refetch)
node scripts/build-site-plans.mjs     # src/data/site-plans.json
python3 scripts/generate_regions.py   # public/provinces.geojson
```

## Architecture

Single-page React 19 + Vite 8 app. Entry point is `src/main.jsx`, which mounts `src/App.jsx` into `#root` in `index.html`. No TypeScript — JSX only.

Key dependencies: `d3` v7, `topojson-client`, `world-atlas` (Natural Earth 50m land/borders).

### Component tree

```
Root.jsx                    — hash router + shared state above the routes:
                              lens (Gospel Lens), theme, hero-seen + tour-seen flags
├── HeroLanding.jsx         — pinned depth-glide parallax; once per session
├── Tour.jsx                — first-run walkthrough; once ever, reopenable from ?
├── App.jsx           (#)   — the Atlas
│   ├── NavTabs.jsx         — Atlas / Charts / Reader; used by App and VisualsDemo
│   │                         only — GospelReader has its own header and no tabs
│   ├── SearchBar.jsx · ThemeToggle.jsx · .tour-help (?)
│   ├── .map-container
│   │   ├── FilterPanel.jsx — Gospel Lens, period toggles, Events/Parables lists
│   │   ├── MapView.jsx     — D3 SVG map; basemap, regions, routes, city dots
│   │   ├── StoryLayer.jsx  — Jesus's Story entry button + play-mode caption card
│   │   └── BookDetailPanel.jsx
│   ├── TimelineBar.jsx     — 4-state overview; click a capsule to drill in
│   │   └── TimelineDetail.jsx — rows: STOPS · EVENTS · PLACES
│   │       ├── PaulStopTrack.jsx · PaulEventTrack.jsx
│   │       └── ChurchTrack.jsx    — one thread per place
│   └── PlayControls.jsx
├── VisualsDemo.jsx   (#/visuals) — the Charts page
│   ├── CategoryPeriodHeatmap.jsx · GospelAttestationUpSet.jsx
│   └── GospelSignatureRadar.jsx · MinistryDensityStream.jsx
└── GospelReader.jsx  (#/gospels, #/gospels/<planDay>, #/read) — the Reader
    ├── MapView.jsx         — reused; pans to the active stop
    ├── JerusalemDiagram.jsx— schematic close-up for city-scale scenes
    └── ReaderTimeline.jsx  — AD axis + evenly spaced DAYS picker

Shared:  TimelineDefs.jsx (SVG material) · ScriptureReveal.jsx (click-to-read verses)
Unused:  ReadingMode.jsx, BookTrack.jsx — out of the bundle, still on disk
```
### The first-run tour (`Tour.jsx`)

Nine steps pointing at the atlas's chrome in turn: the nav tabs, the Gospel
Lens, the filter modes, the layer list, the timeline's state nav, the timeline
itself, and the story button. Opens once ever — `localStorage['jw-tour-done']`,
unlike the hero's per-session `sessionStorage['jw-entered']` — 700 ms after the
hero is dismissed, and only on the atlas route. Reopenable from the `?` in the
header (`.tour-help`, wired through `App`'s `onShowTour` prop).

- **The scrim is the spotlight's own `box-shadow: 0 0 0 9999px`**, not four edge
  panels or an SVG mask: one element, and it tracks the target exactly. A
  box-shadow is not hit-testable, so `.tour-veil` sits underneath to swallow
  clicks.
- **The tour is read-only.** Letting the user drive the app mid-step would let a
  later step contradict what an earlier one just said.
- **Placement is imperative** (`place()` writing inline styles), not state. The
  spotlight reads the live rect of an element this component does not own, and
  re-rendering to store what was just measured buys nothing — it also keeps the
  component clear of `react-hooks/set-state-in-effect`.
- **`spotMobile`** is the stand-in for a target inside the off-canvas panel at
  ≤768px; those three steps spotlight `.fp-mobile-toggle` and reveal a "Tap ☰"
  hint via `card.dataset.fallback`. A step whose target is missing or collapsed
  falls back to a centred card, so nothing ever points at empty space.
- The card flips above its target when there is no room below, and clamps to the
  viewport horizontally.

### State flow

- `activeJourneys` — `Set<string>` of journey IDs currently shown; toggled by FilterPanel and passed to MapView + TimelineBar
- `selectedBookId` — single book ID or `null`; selecting in FilterPanel or clicking a diamond in TimelineBar both toggle it
- `selectedBook` — `useMemo` derived from `selectedBookId`; full book object passed to BookDetailPanel
- `timelineYear` — `number | null`; null means scrubber hidden; set by dragging/clicking TimelineBar or advanced by play loop
- `highlightRange` — `[start, end] | null` derived from `selectedBook.dateRange`; passed to TimelineBar for the gold overlay
- `showProvinces` — `boolean` (default `true`); toggles province fill/border layers in MapView; controlled by the "Provincial Boundaries" checkbox in FilterPanel
- `isPlaying` — `boolean`; true while the rAF animation loop is running; paused by any user interaction with journeys/books/scrubber
- `playSpeed` — `0.5 | 1 | 2`; multiplier applied to the 1.5s-per-year base rate; mirrored to `playSpeedRef` for use inside the rAF closure
- `detailJourneyId` — `string | null`; when set, TimelineBar switches to detail mode showing PaulStopTrack + church tracks for that journey; set by clicking a capsule bar, cleared by "← Overview" breadcrumb
- `activeChurchTracks` — `Set<string>` of church IDs whose tracks are currently visible in detail mode; reset to empty Set whenever `detailJourneyId` changes

### Play mode refs (App.jsx)

- `playFrameRef` — holds the current `requestAnimationFrame` id; cancelled on pause/reset
- `playStartTimeRef` — `performance.now()` timestamp when the current play segment began
- `playStartYearRef` — the `timelineYear` value at the moment play/resume started
- `playSpeedRef` — mirror of `playSpeed` state, readable inside the rAF closure without stale closure issues
- `playEndRef` — effective end year for the current play session; defaults to `PLAY_END=67` but is set to `journey.dateRange[1]` when `detailJourneyId` is set, constraining the loop to the active journey's range
- `detailJourneyIdRef` — mirror of `detailJourneyId` state, readable inside the rAF closure; read by `handlePlay` to compute `playEndRef` and the effective start year when entering detail play
- `lastActivatedRef` — `Set<string>` tracking which journeys have been auto-activated; prevents redundant `setActiveJourneys` calls on every frame

**Detail mode play constraint:** when `detailJourneyId` is set and Play is pressed, `handlePlay` reads `detailJourneyIdRef.current`, sets `playEndRef.current = journey.dateRange[1]`, and starts from `journey.dateRange[0]` unless `timelineYear` is already within the journey's range. Both the `startPlayLoop` tick and the `handleSpeedChange` tick clamp to `playEndRef.current` instead of the hardcoded global constant.

### Data

All map/period/event/city data lives in `src/data/gospels-data.json`. **This app began as an atlas of Paul's journeys and was reskinned for the Gospels**, so some field names still carry the old vocabulary — `journeys` are periods, `books` are marquee events, `churchEvents` are things that happened at a place, `paulEvents` are per-period events. The names are load-bearing in code; the meanings are not what they say.

- `journeys` — 6 **periods**: Early Ministry, Galilean Ministry, Withdrawals, Judea & Perea, Passion Week, Resurrection. `id`, `shortName`, `dateRange`, `color`, `waypoints[]` (`cityId`, `year`, `durationDays`, `note`, `ref`)
- `books` — 16 **marquee events** (Baptism → Ascension), the timeline's flag chips. `id`, `abbrev`, `name`, `dateRange`, `when`, `journeyId`, `gospels`
  - **The roster is `paulEvents` where `type === 'major'`** — that is the definition, and the two must not drift. They did: the flag row carried the AD 30 temple cleansing and the Olivet Discourse (both `minor`) and omitted the call of the disciples, the Great Commission and the Ascension (all `major`). Both dropped events still render in the drill-down EVENTS row; only their flags are gone.
  - `dateRange` is `[year, year]` at the **fractional** year of the matching `major` event (`33.256` = Friday of Passion Week). It used to be whole years inherited from Paul's epistles, where whole years over AD 44–68 were fine. On a 29–33.5 axis that put six events on one pixel and dated five of them outside their own `journeyId`'s range.
  - `when` is the display string (`"AD 33 · Palm Sunday"`). Nothing should print `dateRange` — `33.256` is not a date a reader can use.
  - There is **no `attribution` field**. It was Paul's-World authorship-dispute vocabulary reused to mean "told in fewer than four Gospels", which is derivable from `gospels` and had already gone stale (the temple cleansing carried 3 Gospels and `undisputed`). `isAllFour(b.gospels)` from `src/lib/attestation.js` is the one source; TimelineBar, FilterPanel and BookDetailPanel all read it.
- `cities` — 26 entries, `id`, `coords [lon, lat]`, `name`, `modernName`, `description`, `ref`. Several are not cities (Mount Hermon, Gethsemane, Bethany-beyond-Jordan, Judean Wilderness)
- `churchEvents` — 55 **located events**; `churchId` and `cityId` are equal for all 55. Carries both an inherited `type` (drives nothing) and a real `category`: miracle 34 / encounter 9 / teaching 7 / event 5. See `src/lib/eventCategory.js`
- `paulEvents` — 33 per-period events; only types `major` and `minor` exist
- `parables` — 34 entries with `topic`, `gospels[]`, `ref`, `lesson`, `occasion.cityId`
- `mapConfig` — advisory; MapView actually uses `d3.geoMercator().center([35.4, 32.4]).scale(12500)`

Reading-plan data is separate and generated: `src/data/reading-plan/` (see the reader section). `src/data/passion-reading.json` is no longer a reader of its own — it is the *source* of the curated scenes folded into the plan.

Region boundaries: `public/provinces.geojson`, fetched at runtime in App.jsx. 7 Herodian regions (Phoenicia, Galilee, Ituraea, Decapolis, Samaria, Judaea, Peraea) with `name`, `ruler`, `source`. Generated by `scripts/generate_regions.py` from coastline/river geometry in the same world-atlas data the basemap uses — rerun it to adjust borders; it re-validates that all 26 cities fall inside their declared region. **d3-geo gotcha documented in that script:** rings must be wound planar-clockwise or the fill floods the whole map.


### Water and terrain (`build-water.mjs`, `build-terrain.mjs`)

The basemap carries land and modern country borders only. Everything else about
the physical map comes from these two generators, both networked and both cached
(`scripts/.water-cache.json`, `scripts/.terrain-cache/`).

**Water.** The Sea of Galilee, the Dead Sea and the Jordan were absent
entirely — `d3.geoContains` answered "land" at the centre of all three — which
also meant `segModes` classified **0 of 42** journey legs as sea and drew
Capernaum→Gergesa, the Calming of the Storm, as a road. Source is OpenStreetMap
via Overpass, not Natural Earth: NE 10m draws the lake with **28 vertices**
against OSM's 2001, and carries six modern reservoirs (Atatürk 1990, Nasser
1970, Keban 1974, al-Assad 1973, Tharthar and Mingəçevir 1950s) inside the crop
box. Each feature carries its own `period`, `note` and `source`; the Dead Sea is
marked `provisional-reconstruction`.

**Terrain.** Contours from the public Terrarium elevation tiles (z10, ~150 m/px,
no API key). PNG decode is inline — terrarium tiles are 8-bit RGB
non-interlaced, so it is zlib plus the five filter types, no dependency. Two
traps are load-bearing:

- **The DEM carries bathymetry.** An unrestricted contour below sea level traces
  the Mediterranean shelf, so the first attempt at the Dead Sea's antique
  shoreline came back as one 84×189 km line running the length of the map.
  Sub-sea levels take a `region` box; land levels do not.
- **Marching-squares segments have arbitrary direction.** Indexing only their
  start points cannot follow a contour arriving at a segment's far end, which
  fragmented every long one — the −350 m level came out as 166 pieces instead
  of 9. Both endpoints are indexed and reversal is allowed.

Contours fade in with zoom (`applyZoomStyling`); at the opening view they would
read as hatching over the whole land mass.

**The script validates its own reconstructions and ships nothing that fails.**
Two are attempted and neither currently passes, and the output records why
rather than emitting a plausible wrong shape:

- *Dead Sea at −395 m* — the surface reads −415 m and the west shore is a cliff,
  so the band is a few pixels wide and stitches into scraps even at full
  resolution. Wants a finer DEM or a lake mask.
- *Lake Huleh at ~+70 m* — a pure elevation threshold cannot find it, because
  the Huleh valley floor sits at much the same height as the lake did. Asked
  over the basin it returns a 7×23 km sheet: the valley, not the lake. Wants a
  hydrological constraint or the pre-drainage survey mapping. The check is
  Josephus, *War* 3.515 — sixty furlongs by thirty, about 11×5.5 km.


### Schematic town plans (`SitePlan.jsx`, `build-site-plans.mjs`)

**These cannot live on the map, and that is arithmetic rather than taste.** A
viewBox unit is 428 m at this projection, so Capernaum's 300 m of shore is 0.7
units — 22 px wide even at the k=32 ceiling. A readable plan wants about k=430,
where the basemap (Natural Earth 10m), the hillshade (150 m/px) and the contours
are all an order of magnitude past their own resolution. So a plan is drawn at
its own scale, entered by clicking a place that has one, the way
`JerusalemDiagram` already works.

Four sites: Capernaum, Nazareth, Magdala, Bethsaida. Layouts are generated
procedurally in metres from a few declared parameters, with a seeded PRNG so the
same build gives the same plan and a perfect grid never appears.

**What is sourced and what is illustration is the load-bearing distinction.**
Footprint dimensions, hectares, population estimates and the named landmarks are
real and cited per site in the generator. The street grid and the individual
blocks are not — they illustrate density and arrangement, nothing more. Every
plan carries a `Schematic` tag and its basis text on its face, and a metre scale
bar, which is what earns the right to draw a 4-hectare village at panel size.
This atlas refuses to ship a Dead Sea shoreline that fails its own check; an
invented street grid must not be able to pass as a survey either.

### MapView D3 pattern

The SVG is wrapped in a `div` (with `containerRef`) so React-managed tooltip overlays can be positioned absolutely over it. The `<svg>` itself fills the div via `width/height: 100%`.

Four separate `useEffect` hooks:

1. **Mount-only** — sets up `d3.zoom()` with `scaleExtent([0.5, 8])`. Zoom transform is applied to `mapGRef` (`<g>`); zoom k is stored in `kRef`. The zoom instance is stored in `zoomRef` for use by the progressive pan effect.
2. **Render effect** — runs on prop/data changes; calls `mapG.selectAll('*').remove()` (clears children only). Gives each journey path `class="journey-line" data-journey={id}` and primes `stroke-dasharray = "total total"`. After each path is drawn, precomputes arc-length at each waypoint using ternary-search (`getArcLengthAtPoint`) and stores the result in `lineDataRef.current[journey.id]`. Also appends invisible 12px-wide per-segment hit-target paths over each waypoint pair for distance hover. City dots get `class="city-dot" data-city={id}` and `mouseover`/`mouseout` handlers that set `tooltipCity` + `tooltipPos` state. Calls `applyZoomStyling` at the end.
3. **Progressive reveal effect** `[timelineYear, activeJourneys, isPlaying, cityById, projection]` — runs every frame during play (and on manual scrub). Updates `stroke-dashoffset` on each active journey path to `total − interpolatedArcLength`, dimming unreached city dots, and (throttled every 250 ms during play) pans the map to Paul's interpolated location via `d3.select(svgRef).transition('pan').duration(600).call(zoomRef.current.transform, ...)`.
4. **`[hoveredCityId]` glow effect** — imperatively finds the `.city-dot[data-city=hoveredCityId]`, raises it, applies `filter: url(#city-glow)` and gold stroke; clears glow on all other dots. Driven by `hoveredCityId` from App state, which is set by PaulStopTrack stop hover (timeline → map link).

`applyZoomStyling` is a module-level function shared by both effects. All labels scale inversely with k so they hold a constant screen size:
- Province labels: `font-size = 15/k`, `letter-spacing 1.6/k`, ruler sublabel `11/k` at `y0 + 16/k`. They were 9px/7px at 0.3/0.24 fill-opacity, rendering ~6.8 screen px — *smaller* than the tier-1 city labels sitting inside them. Region names now sit above the city labels and are letterspaced, the usual treatment for an area label; opacity and halo went up too, since low contrast was hurting as much as the size.
- Tier-1 city labels: `font-size = 13/k` (base 13px)
- Tier-2 city labels: `font-size = 11/k`, visible at k ≥ 2
- Tier-3 city labels: `font-size = 9/k`, visible at k ≥ 3.5

**Route linework.** Three things carry it, and each replaced something that read as marker-pen rather than cartography:

- **Casings are a cast of the route's own hue**, mixed 0.55 toward the ground (dark on the dark map, pale on the parchment) at 3.4 width under a 2px line. They used to be near-black `#06110b` at 0.85/3.6 — an 0.8px black rim that made routes read as stickers laid on the map, and where two crossed, one route's black rim sliced the other's colour. Six converge on Capernaum and the rims stacked into a blob.
- **`tint(c, toward, t)`** (module-level, `d3.interpolateRgb`) is how every derived route colour is mixed. Never `d3.color().brighter()/darker()` — those scale RGB channels and clip, which produced a neon `#ffff86` light-theme casing and `#fffd73` chevrons on the gold route.
- **Reveal opacity rides `jd.segG` / `jd.caseG`, not the individual paths.** A route is one path per waypoint pair, so at any opacity below 1 the round caps where consecutive segments meet composite twice and print a brighter pip at every stop — the whole route beaded. Fading the group composites the segments first.

**Basemap line hierarchy** (base widths, before the `k^0.6` divisor): coast `1.1` → era roads `0.9` → region borders `0.9` (dashed, 0.4 opacity) → modern country borders `0.5` → graticule `0.4`. These used to sit within 0.3px of each other (0.5–0.8), leaving the coastline — the strongest line on any map — thinner than the road layer, so the base read as flat wash with the routes floating over nothing. Modern national borders are deliberately near the bottom: they are anachronistic on a 1st-century map.

**Zoom-aware strokes/dots:** `applyZoomStyling` also divides journey-line widths, city dot radii (+ their strokes, via `data-r0`/`data-sw0` attrs), graticule/border/coast/province-border/Via Egnatia widths by `k^0.6` (rendered size grows as `k^0.4` — lines stay lines under zoom, not ribbons), and keeps `.seg-hit` distance-hover targets screen-constant at `12/k`. All labels carry a `paint-order: stroke` halo (`haloColor`: dark `#0a1220`, light `#d3c9ae`) whose width scales `1/k` alongside the font.

**Basemap:** the 50m atlas ships in the bundle for first paint; `src/data/basemap-levant.json` (290 kB, 90 kB gzipped, code-split) lazy-loads via `requestIdleCallback` and swaps into the `land`/`borders` memos.

That file is generated — `node scripts/crop-basemap.mjs` — by clipping world-atlas's 10m land and country mesh to lon 22–50, lat 20–44 (Sutherland–Hodgman for rings, run-splitting for the border lines), normalising winding at build time, and rounding coordinates to 4 decimals (~0.02px at this projection, under a fifth of a pixel even at the maximum zoom of 8).

**Why it is cropped, not raw.** The full 10m land set draws as a path of ~8.1 million characters whose bounding box is 78540 × 75387 against a 1200 × 680 viewBox — about 99.99% of it outside the frame. `land`/`borders` sit in the render effect's dependency array, and that effect opens with `mapG.selectAll('*').remove()`, so the lazy swap tore down and rebuilt the entire map; rasterising that path made the rebuild visible for seconds, showing bare sea colour where the land should be, which reads as land and sea inverted. Cropped, the same path is ~218 k characters with a 6109 × 6520 bbox and the swap is imperceptible. The crop box comfortably exceeds the widest view (at the minimum zoom of 0.5 the frame spans lon 29.9–40.9, lat 29.7–35.0); panning is unbounded, so panning far enough will still reach the data's edge.

**Neither source is rewound at runtime, and nothing should be.** There used to be a `rewindRings` helper that reversed any ring whose single-ring `geoArea > 2π`. It was written for the raw 10m data (whose rings sum to 41 sr — d3-geo fills the sea) but was applied to the 50m fallback as well, where it was actively wrong: the 50m rings are correct overall at 3.61 sr, but two individually exceed 2π, and reversing them made the outer ring enclose the *sea* and turned the landmass into a hole. First paint therefore rendered inverted — sea filled with the land colour, land showing the bare base rect — and the 10m swap "fixed" it a few seconds later, which is what the land/sea inversion on load actually was. `d3.geoContains` pins it down: at a point in the Mediterranean the pristine 50m returns `false` (correct) and the rewound 50m returns `true`. The cropped basemap is normalised at build time instead, so both sources are now used exactly as they come. A `.map-coast` stroke (theme-aware) outlines the land edge. Journey `lineGen` uses `curveCatmullRom.alpha(1)` (chordal) to avoid overshoot loops at sharp waypoint turns.

**Journey line system (per-segment):** each journey renders an invisible `.journey-spine` (full Catmull-Rom path — geometry carrier for arc lengths, sampling, and the Paul marker) plus one sampled sub-path per waypoint pair (`samplePath`, 6px steps). `segModes` (useMemo) classifies each pair sea/land by sampling 3 points along the straight lon/lat lerp with `d3.geoContains` against pristine 50m land. Land legs: solid `.journey-line` over a `.journey-case` casing (theme bg color, 3.6 width); sea legs: dashed `[4, 3.2]`, butt caps, no casing; post-rome: dashed `[8, 5]` throughout (traditional). Progressive reveal is per-segment via `revealStateFor` (journey state machine: null-year full / pre-start len 0 / completed op 0.18 / mid interpolated) + `applyRevealState`; solid segs reveal by dashoffset, dashed segs by `dashedRevealArray` (emits the dash pattern up to `visible`, then swallows the rest in a terminal gap — dashoffset can't truncate a pattern). `.route-chevron` direction markers sit every 85 map px (skipping ±16 of waypoints), rotated to the path tangent, transforms rebuilt in `applyZoomStyling` (`translate rotate scale(1/k^0.6)`), revealed once Paul passes them. `.paul-marker` (pulsing gold halo + core, `paulHalo` keyframes in index.css) rides `getPointAtLength(revealLen)` on the spine of the journey containing the current year; positioned by the progressive effect and replayed in the render effect via `timelineYearRef`.

**Journey line opacity:** two-mode system. Normal view: active journeys `stroke-opacity: 0.85`, inactive `0` (invisible). Book focus mode: the book's journey `0.3` full line + `0.9` highlighted segment; all other journeys `0` regardless of toggle state.

**City dot and label visibility:** only cities visited by at least one currently-active journey (or the selected book's journey) render with full dots and labels. All other journey cities render as ghost outlines only (`fill: none`, `stroke-opacity: 0.15`) with no label.

**`ScaleBar` component** (defined above `MapView`): a separate SVG overlay (`position: absolute, inset: 0, pointerEvents: none`) showing a 500 km reference bar at bottom-right. Pixel width computed from Haversine: `dLon` for 500 km at 37°N center latitude, projected to screen pixels. Styled in Cinzel 9px `#7a8ab0`.

**Haversine helper** `haversineKm([lon1,lat1], [lon2,lat2])` — module-level, returns integer km using Earth radius 6371 km. Used by segment hit targets to populate the distance tooltip.

Province name normalization: Italian admin regions named `"I"`–`"XI"` in GeoJSON all map to `"italia"`. `"Galatia et Cappadocia"` → `"galatia"`, `"Creta et Cyrene"` → `"creta-cyrenaica"`.

Via Egnatia road layer: rendered between the province group and the journey lines group. Three hardcoded waypoints `[19.47,41.32] → [24.29,41.01] → [26.67,41.67]` (Dyrrachium → Philippi → Byzantium). Dashed gold stroke at 25% opacity, 0.8px width. Label 'VIA EGNATIA' in Cinzel 9px letter-spacing 3 placed above the midpoint (Philippi). Always rendered; not affected by `showProvinces`.

**Tooltip overlays (React state, not D3):**
- `tooltipCity` / `tooltipPos` — set by city dot `mouseover`; renders `.city-tooltip` card with `name`, `modernName`, `description`, `ref`
- `segmentTip` — set by journey segment hit-target `mouseover`; renders a compact `.city-tooltip` card showing `From → To · ~N km`; suppressed when `tooltipCity` is active (city hover takes priority)

### TimelineBar D3 pattern

Six `useEffect` hooks:

1. **Mount-only** — builds scrubber DOM inside `scrubGRef`: the dashed line, the tooltip pill (base rect + sheen/bevel overlay), and `.s-handle`, now a `<g>` holding the gold core, a domed highlight and a bevelled rim — so it is positioned by `transform: translate(x,0)`, not `cx`. Attaches `d3.drag()` to the SVG. Drag filter: `!event.target.closest('[data-book]')` so chip clicks don't start a drag. Click-without-drag (dx < 4px) toggles the scrubber on/off.
   This effect re-runs whenever `onYearChange`'s identity changes, so it **clears `scrubG` first** (it used to stack a fresh line/pill/handle on every run — 5 copies on a cold load) and then calls the shared `placeScrubber(node, year)` helper, which effect 2 also uses; without that re-place a rebuild would leave a live scrubber blank at x=0 until the next year change.
2. **`[timelineYear]`** — fast imperative update: moves the scrubber line/handle/tooltip without re-rendering everything.
3. **`[timelineYear]` clipPath effect** — updates each `<rect data-bar-clip={id}>` width inside the `<defs>` to `fullWidth × progress`, making capsule bars expand in real-time in sync with timelineYear.
4. **`[timelineYear, isPlaying]` book reveal effect** — hides/shows `<g data-book-group={id}>` wrappers. When a book's `dateRange[0]` is first crossed, triggers a D3 `transition('reveal')` (420 ms, easeCubicOut) animating `opacity 0→1` and `transform translate(0,-10)→translate(0,0)`. Uses `revealedBooks` ref to only animate newly-revealed books.
5. **Main render** `[activeJourneys, selectedBookId, highlightRange, onBookClick, isPlaying, detailJourneyId]` — clears and redraws everything at the *current* `bookStateRef` geometry (no animation). Creates `<defs>` with one `<clipPath id="pbw-bar-clip-{id}">` per journey plus the `#pbw-pole-mask` mask. Capsule bars live in `<g class="tl-bars">` (ghosted to 0.07 opacity in state 3). Each book's elements (pole, anchor dot, stem, chip rect, abbrev/name/date texts) are grouped under `<g data-book-group={id}>` with initial opacity/transform set based on current year. Also attaches `mousemove.dock`/`mouseleave.dock` handlers on the SVG for state-1 dock magnification.
6. **`[bookState]` transition effect** — mirrors `bookState` into `bookStateRef`, then runs a named `'bookState'` transition (650 ms, easeCubicInOut) morphing the SVG `viewBox`, `.tl-bars` / `.tl-anchor-line` opacity, and every book's chip rect / stem / pole / texts to the `getP`-derived geometry for the new state. First run (mount) sets the viewBox instantly and returns. The viewBox is **not** set via JSX — it is owned imperatively by this effect.

**4-state books system** (from `src/data/TIMELINE-BOOKS-4STATE-PROTOTYPE.md`): local `bookState` (0–3, default 1) replaces the old lollipop diamonds. State 0 = journey bars only; 1 = bars + flag dots (with stems, Apple-dock hover magnification); 2 = both rows, compact abbrev chips; 3 = events only — full-name chips with date sublabels, bars ghosted, L-shaped flag poles (`polePath`) connecting each chip to its date anchor on the `SEP` line, passing behind chip bodies via `#pbw-pole-mask`. One rounded `<rect data-chip>` per book morphs across all states via `getP(b, s)`. Nav UI (`.tl-state-nav`: state label + 4 dots + Next button) renders as a sibling strip *above* the `.timeline-bar` card, hidden in detail mode. Card height is aspect-locked to the state's viewBox: `height = cardWidth × vbH/1200` (ResizeObserver feeds `tlWidth`), clamped to `H_MIN=[72,72,112,188]` / `H_MAX=[126,126,206,306]` so the overview scales uniformly (no stretch distortion; mild stretch only at clamped extremes), +68 when the story row is open; manual resize (`tlHeight`) overrides.

**Every state packs its chips with `packRow(items, gap, lo, hi)`** — one shared 1-D collision resolver: push right to clear left neighbours, clamp to the right boundary, push back left, clamp left, push right once more. (The boundary clamps are interleaved with the passes deliberately; clamping only after both passes reintroduces overlap at the right edge.) It is called three times, and all three callers need it for the same reason — **the Gospels cluster at the end**. Six of the sixteen events fall inside the last two weeks of a 4.5-year axis, ~4px apart:

- `FLAG_X` — states 0/1, per row (`b.row = i % 2`), gap `2×2.4+3`. Without it the Passion Week and Resurrection flags render as *pixel-identical* 8×8 rects and only the last one painted is clickable; that was live, with 5 of 15 events unreachable in the default state.
- `S2_CHIPS` — state 2, per row, gap 6. This replaced a stagger that only fired on *exact* coincidence (same row, same rounded date). Fine while every event sat on a whole year; useless the moment they carry true dates, when the chips are 3px apart with 34px bodies.
- `S3_CHIPS` — state 3, per shelf, gap 6.

`data-stem` (states 0/1) and `data-pole` (state 3) are both L-routes from the displaced chip back to its true date, so displacement never costs accuracy. `stemPath` mirrors `polePath` one band up.

ViewBox per state (`VIEWBOXES`): `[0,0,1200,78]` for states 0/1, `[0,0,1200,150]` for state 2, `[0,75,1200,211]` for state 3. `preserveAspectRatio="none"`. xScale: `d3.scaleLinear().domain([29, 33.5]).range([80, 1140])`. Key layout constants: `TH=290` (the canvas the scrub line, the highlight rect and the pole mask span — it must reach `S3_BOTTOM`), `BY=24`, `BH=16` (bars `y=24–40`), `FAY=8`/`FBY=48` (flag dot rows), `AXIS_Y=62`, `SEP=78`, `ROUTE_Y=82`, `FDR=4` (7 on coarse pointers), state-2 chip rows `CR0_S2=88`/`CR1_S2=113` (`CH_S2=20`), state-3 shelves `CR0_S3=100`/`CR1_S3=152`/`CR2_S3=204`/`CR3_S3=256` (`CH_S3=30`, `S3_BOTTOM=286`). Even-index books (`row=0`) use the upper row, odd-index the lower. The left "EVENTS" label is state-aware (`.tl-lbl-books`, y `110`/`180` in states ≤2/3).

`S3_CHIPS` (module-level IIFE): assigns each event to one of **four** shelves, then `packRow`s each. Chip width is `max(dateRange px, name.length×7.8+28)`; measured against the real font that estimate runs ~1.6% high, close enough.

Two things about it are load-bearing and were both wrong before:

- **Four shelves, not three.** Sixteen full names total ~2900px against a 1060px axis. Split three ways every shelf sits over 90% full, and the packing is then forced to put some chip ~310px from the date it marks (brute-forcing the assignment only gets that to 295px — it is arithmetic, not a bad heuristic). Four shelves land at ~70% full and halve the drift to ~190px.
- **Shelves are balanced by total width, not by count.** The old running-edge greedy put the six longest names on one shelf, whose content needed 1181px of the 1060px axis and ran off the right edge. That was already happening on the previous 15-event roster (right edge 1159 against a 1140 limit) — the wider roster only made it obvious. Assignment walks the events in date order and drops each on the least-loaded shelf, so every shelf still reads left-to-right in time.

**Gospel Lens.** `TimelineBar` takes a `lens` prop and fades any flag the selected Gospel doesn't record to `LENS_DIM` (0.25) — dimmed, never removed or re-packed, because the row is a fixed chronological spine and the gaps are the point (under `John`, 7 of 16 go dark). The opacity rides an inner `<g data-book-lens>` so it never contends with the play-mode reveal, which owns `opacity` on the outer `<g data-book-group>`. The fade is a CSS transition on `[data-book-lens]`, not a d3 one, so the attribute lands immediately and the state is inspectable where `requestAnimationFrame` is throttled. `FilterPanel`'s EVENTS pills dim to match via `.fp-pill--out`.

Left-side section labels "TIMELINE" (centered over the bars/axis band) and "EVENTS" (centered in the books band) at `x=40` in Cinzel, `var(--muted)`, separated by a `1px` rule at `y=SEP`.

Year labels sit **below** the axis (`y = AXIS_Y + 12`), not above it: the state-0/1 lower flag-dot row occupies `y=44–52` and completely covered them at the old `y=54`. The scrub tooltip pill (`AXIS_Y+2 … +16`) does overlap them while scrubbing, which is fine — it shows the same year more precisely.

Chip hover shows `name · date` in a pill tooltip (flips below the chip when the state's viewBox would clip it above). Chips are click targets for `onBookClick`; selection styling = gold stroke `#e9c86c` + boosted fill/stroke opacity.

**Crispness:** the overview SVG stretches (`preserveAspectRatio="none"`), so all stroked elements (chips, stems, poles, rings, axis/ticks/separators, scrubber, story-row markers) carry `vector-effect: non-scaling-stroke` — stroke widths are true screen px. Axis-aligned lines (axis, ticks, SEP, anchor line, stems, poles) add `shape-rendering: crispEdges`. State-1 flag dots have a `data-ring` circle (r `FDR+2.4`, journey color at 0.45) echoing the `.tl-state-dot` sequencer look; rings track dock magnification and fade out in other states.

### Timeline detail mode

Activated by clicking any capsule bar in the overview (`data-bar-hit` hit area). TimelineBar hides the overview SVG and renders `.tl-detail` in its place. `.timeline-bar--detail` expands the panel height to 320px.

`.tl-detail` (flex column):
- `.tl-mini-header` (30px) — "← Overview" breadcrumb + compressed mini overview strip (5 colored capsule rects) + journey name badge
- `TimelineDetail` (flex: 1) — contains all scrollable track content

`TimelineDetail` renders three labelled rows — **STOPS**, **EVENTS**, **PLACES**:
1. `PaulStopTrack` + `PaulEventTrack` — duration-proportional stops, then the period's events
2. `.ct-pills` (32px) — toggle pills for each place that has `churchEvents` in the active period; pill color uses `--pill-color` set to `journey.color`
3. one `ChurchTrack` per active place id

A fourth row, **LETTERS**, was removed: it rendered `journeyData.books`, which in the Gospels data are the 15 marquee *events* (Baptism, Cana, the Temple…), not epistles — 8 of the 15 duplicated entries already in the EVENTS row by name, and their click-to-open behaviour is already on the overview timeline's flag chips. `BookTrack.jsx` and the `.bt-*` styles are the leftovers of that row and are now unreferenced.

The row was called **CHURCHES**; all 16 ids are city ids, and several (Mount Hermon, Gethsemane, Bethany-beyond-Jordan) are not cities at all, so **PLACES** is the honest label. The EVENTS legend also advertised "Letter written by Paul" and "Arrest or imprisonment" — `paulEvents` only carries `major` and `minor`, so neither marker could ever render.

Receives `timelineYear`, `onCityHover` and `hoveredCityId` from `TimelineBar` and passes all three to `PaulStopTrack`, `PaulEventTrack` and `ChurchTrack`, driving the stop highlight, the event pulse animations, and the place-track highlight. Hovering a stop, an event, a place pill or a place track sets `hoveredCityId` in App; a `hoveredCityId` arriving from anywhere else lights the matching place track (`.ct-track-scroll--on`) and pill (`.ct-pill--hot`) back. All 55 `churchEvents` have `cityId === churchId`, so a place track hovers as one row rather than per marker.

**Scroll sync:** `TimelineDetail` holds `bodyRef` on `.tl-detail-body` and a `syncingRef` flag. A `useEffect` (dependency: `activeChurchTracks`) queries `body.querySelectorAll('.pst-scroll, .ct-track-scroll')` after each render, attaches `scroll` listeners to all matched containers, and syncs `scrollLeft` across the rest on each event. `requestAnimationFrame` resets `syncingRef` after each sync batch to prevent feedback loops without blocking natural scroll events.

### PaulStopTrack

Stop width = `max(24px, durationDays/totalDays × 1100)`. City name above in Cinzel (`--pst-label-size`, default 10px, 8px at <900px viewport), duration below in Cormorant Garamond italic same size (gold if `durationDays > 90`). Short stops (< 3 days) hide labels until hover. Uses `buildStopLayout` from `src/utils/stopLayout.js`.

**Label collision:** `stops` useMemo runs a two-pass build — first pass computes widths, second pass marks each stop `colliding = true` when `stop.w === MIN_W` and at least one immediate neighbor also equals `MIN_W`. Colliding stops show a centered vertical tick mark instead of inline labels; labels appear normally on hover.

Accepts `timelineYear` and `onCityHover` props. Computes `currentStopIdx` (via `useMemo`) as the index of the stop whose dwell window brackets the current year: `wp.year ≤ timelineYear ≤ wp.year + durationDays/365`. The matching stop rect gets `fillOpacity=0.4 / strokeOpacity=0.85` (same as hover) — no match returns `-1` so no stop is highlighted (e.g. during transit or outside the journey range). Stop `onMouseEnter` calls `onCityHover(wp.cityId)`; `onMouseLeave` calls `onCityHover(null)` — this sets `hoveredCityId` in App, which MapView uses to glow the corresponding city dot.

### ChurchTrack

One SVG track (56px tall) per active place. Track line at y=28; place name in Cinzel above the track.

**Markers are coloured by `category`, not `type`.** `churchEvents` carry both: an inherited Paul's-World `type` (`founding` / `letter-received` / `support` / `leadership`) and a purpose-built Gospels `category` (`miracle` 34 / `encounter` 9 / `teaching` 7 / `event` 5). The types are leftovers whose names describe planting churches and receiving epistles — the legend used to render "Letter received by church" against *"Living water · The Samaritan woman"*. `src/lib/eventCategory.js` owns the mapping (`categoryOf`, `CATEGORY_LEGEND`) and is shared by ChurchTrack, TimelineDetail's legend and TimelineBar's story row so a marker means the same thing everywhere. `type` still sits in the data and drives nothing.

Labels alternate above/below by event index. Sublabel shown on hover. X positions derived from `buildStopLayout(journey).xFromYear(event.year)` — same function used by PaulStopTrack, so markers align temporally with Paul's stops above.

Accepts `timelineYear` prop. When the scrubber crosses a church event's year (forward only), that marker pulses once: the `<polygon>` or `<circle>` element gets class `ct-marker-pulse` which triggers a 600ms CSS `scale(1 → 1.8 → 1)` animation (`transform-box: fill-box; transform-origin: center`). Implementation uses three refs — `prevYearRef` (last year seen), `pulsedRef` (Set of event IDs already fired this forward pass, cleared per-event when scrubbing backward past them) — and a `pulsing` state Set that holds IDs of currently-animating markers; each ID is removed via `setTimeout` at 700ms. Scrubbing backward resets `pulsedRef` entries for events whose year is now in the future so they can re-pulse.

### stopLayout utility (`src/utils/stopLayout.js`)

Shared by PaulStopTrack and ChurchTrack. `buildStopLayout(journey)` returns:
- `stops` — array of `{wp, x, w}` with accumulated x positions
- `totalWidth` — total SVG pixel width (same value used for both `<svg width>` attributes, ensuring identical coordinate space)
- `xFromYear(year)` — converts a fractional AD year to an x pixel position by interpolating within the waypoint that contains the year, or within the gap between waypoints for transit periods

Constants: `STOP_MIN_W=24`, `STOP_GAP=2`, `STOP_MARGIN_X=8`, scale factor `1100`.

### Timeline material system (`TimelineDefs.jsx` + `utils/timelineMaterial.js`)

The panels get their tactility from CSS (`--glass-bg`, `--lip-out`), but SVG can't take a `box-shadow`, so the timeline's SVG surfaces rebuild the same ideas as paint servers and filters. `<TimelineDefs id="…" />` emits five, all keyed off the `id` prefix:

- `{id}-sheen` — vertical face gradient, lit at the top falling to a base shadow (the glass)
- `{id}-bevel` — vertical *stroke* gradient: bright top lip, dark bottom lip, two transparent stops at the midpoint (44%/56%) so the fade doesn't interpolate through a grey band
- `{id}-dome` — radial sheen with an off-centre highlight, for round marks
- `{id}-cast` — `feDropShadow`, lifts a mark off its track
- `{id}-groove` — inner shadow (offset alpha → blur → `out` composite → flood), for tracks a raised mark sits in

`mat(id)` returns the matching `url(#…)` ref strings; `bevelRect(rect)` shrinks a rect by `BEVEL_INSET` (0.6) so a bevel stroke sits *inside* the shape's own outline instead of doubling it. Both live in `src/utils/timelineMaterial.js` — keeping them out of the component file is what satisfies `react-refresh/only-export-components`.

All light values come from CSS custom properties (`--sheen-hi/-mid/-lo`, `--bevel-hi/-hi-0/-lo-0/-lo`, `--groove-shadow`, `--cast-shadow`) read through `var()` inside gradient stops and `style={{ floodColor }}`, so the bevels invert for the parchment theme rather than staying dark. **Ids are document-scoped**: each SVG needs its own prefix (`pbw` overview, `tls` story row, `tlm` mini strip, `pst`, `pet`, `bt`), and ChurchTrack — which renders several instances at once — uses a per-instance `ct-${churchId}`.

Where it's applied: capsule-bar tracks get `groove` (empty track reads as a cut groove, the clipped fill as a raised inlay); the overview's `[data-sheen]` rect carries *both* the sheen fill and the bevel stroke on `bevelRect(p)` geometry, so the dock magnification and the 4-state transition only morph one extra element; stop dots, event markers, church markers, letter bars, the mini strip, and the scrub knob all get sheen/dome + bevel + cast.

**Raised vs recessed (CSS side):** `--rail-bg` + `inset 0 1px 0 var(--glass-shine)` marks raised chrome (`.timeline-bar`, `.tl-state-nav`, `.tl-mini-header`, `.tld-label-col`, `.ct-pills`, `.jstat-bar`); `--well-bg` + `--well-lip` marks recessed track wells (`.pst-scroll`, `.pet-scroll`, `.ct-track-scroll`, `.bt-scroll`, `.tl-story-wrap`). `.timeline-bar::after` lays a tiled `feTurbulence` grain (`--grain`, 140px, opacity 0.05) over the console — straight alpha, no blend mode, since `overlay`/`soft-light` cancel out against a surface this dark.

### The reader (`/gospels`) + `scripts/build-reading-plan.mjs`

The whole four Gospels as a 39-day chronological read-through, a day at a time, with the curated Passion Week prose folded into the days it belongs to. One reader, not two — the curated material briefly had its own `/read` tab, which read as two competing surfaces.

**The data is generated, never hand-edited.** `scripts/build-reading-plan.mjs` holds the plan table verbatim and emits `src/data/reading-plan/`: `index.json` (39 days — citations, year, city ids; imported eagerly) plus `day-NNN.json` per day (verse text + scenes; lazy). Re-run it after any change to the table, the location spine, or `passion-reading.json`; `--refetch` bypasses the HTTP cache in `scripts/.chapter-cache.json`.

Plan-table conventions, all load-bearing:
- `|` separates readings within a day — this is the section unit the reader scrolls and the map tracks
- `;` **continues the same book** when the next segment has no book name (day 292's `Luke 5:1-11; 4:31-37` is still Luke)
- `,` separates disjoint loci sharing a chapter (`Matthew 8:18, 23-27`; `John 12:1, 9-50`; `Luke 22:7-16, 21-30`)
- `[additional reading: …]` marks a disputed passage; kept and flagged, never dropped
- half-verse markers (`3:23b`) are stripped for fetching but kept in the displayed citation

**Why chapter-at-a-time fetching:** bible-api.com caps a request at two chapters, and every open-ended form (`Matthew 5:1-6:999`, `Matthew 5:3-`, `Matthew 5-6`) 404s or errors. The only reliable primitive is a whole chapter (`Matthew 5`), so the script fetches each of the 89 Gospel chapters once and slices passages locally — exact, and it needs no table of chapter lengths.

**Integrity check** (worth re-running after edits): the plan covers all 89 chapters and 3,779 verse instances = 3,778 unique + Luke 3:23 twice, which is the plan's own `23a`/`23b` split. **Mark 11:26 is absent** — day 311 ends at 11:25 and day 312 resumes at 11:27. That is a third disputed passage (omitted in critical texts), silent in the source table where the other two are bracketed. Left faithful to the plan rather than silently "corrected".

**Location + year spine.** Every section needs a place (drives the map) and a year (drives the timeline). 36 of 62 derive automatically by overlapping the passage range against refs already carried by `gospels-data.json`'s `churchEvents` and `parables`; the other 26 are declared in `LOCATION_OVERRIDES` keyed `"day:readingIndex"`. A declared `null` means "no atlas pin for this scene" and is honoured rather than auto-filled — day 300's Machaerus execution is the one such case. Years are then clamped non-decreasing and gaps interpolated, so the timeline marker never jumps backwards where a parallel account carries an earlier atlas year.

**Curated scenes.** The 16 hand-written sections of `passion-reading.json` are attached at build time to the plan section whose passages contain their `ref`, each carrying an `anchor` (book/chapter/verse). All 16 land cleanly in 8 sections; four sections receive several. `GospelReader` renders each scene inline immediately before its anchor verse, styled as commentary (`.gr-scene`) rather than scripture.

**Stops.** The reader tracks "where am I" over a flat list of *stops* — every section, plus every scene, in **document order**. Scene order has to come from walking the passages, not from the scenes array: on day 324 the scenes read narratively (Emmaus, Thomas, shore, commission, ascension) while the text runs Matthew, then Luke, then John. `measure()` compares against each stop's **top** edge, not its centre, because a section is a long block and a scene a short one — centre-distance would let the section always win and no scene would ever activate. The active stop's `site`/`cityId` drives the Jerusalem close-up and the map pan; `stop.si` lights the parent section, so reading a scene doesn't dim the block it sits in.

This is what the merge bought beyond tidier navigation: day 324 runs 103 verses through Emmaus, Thomas, the shore, the commission and the ascension, and the map now moves through all five instead of holding one "Jerusalem" pin.

`GospelReader.jsx` lazy-loads days via `import.meta.glob` (39 chunks, 2–4 kB gzipped each) and prefetches the next day. Routes: `/gospels`, `/gospels/<planDay>` (deep-linkable; the reader mirrors the current day into the hash with `replaceState`, which doesn't fire `hashchange`), and `/read`, which is the retired curated route and lands on day 311. `src/components/ReadingMode.jsx` is the old curated reader — now unreferenced and out of the bundle; `passion-reading.json` lives on as the *source* of the scene prose.

**Reader layout — a real 50/50 split, above 820px.** `.rd-map` takes `inset: 0 0
0 50%`, `.rd-scroll` takes `inset: 0 50% 0 0`. It used to be a full-bleed map
with the column floating over it, and the *scrim* made the split: a 90° gradient
running near-opaque to 38% and still 45% at 62%. That meant the western half of
the map was rendered and then buried, the map was never at full strength
anywhere, and a dead band sat between the column's right edge and the point the
map became legible. Three things had to move together:

- **`MapView` needs `fitMode="slice"` here.** The viewBox is 1200×680 landscape;
  the reader's pane is half-width and portrait. The default `xMidYMid meet`
  letterboxed it into a 680×386 strip with a **237px dead band above and below**.
  `slice` fills and crops instead. The Atlas keeps `meet` (its container is
  landscape), so `fitMode` defaults to it. `ScaleBar` must take the same value or
  it detaches from the map.
- **`panToCity` was mixing coordinate spaces** — `getBoundingClientRect()` CSS
  pixels against projection output in viewBox units. It now centres on `W/2, H/2`,
  the space the zoom transform actually lives in (`initialFocus` above always did
  this correctly). The old code left a located city **78px right of centre on the
  Atlas** and a quarter-frame off once the map was half width.
- **`JerusalemDiagram`'s composition sits in x 643–1200** because the old scrim
  hid everything left of ~700 — a workaround, not a design. Its viewBox now crops
  to the drawing (`VB = {x:620, y:-45, w:600, h:740}`), padded vertically so
  `slice` eats headroom rather than labels. The old full-1200 frame cropped ~47
  units a side, which is why Olivet, Bethphage and Bethany lost their sublabels
  entirely; it is ~6 now.

Below 820px the split collapses back to the overlay — half a phone is neither a
map nor a column.

`ReaderTimeline.jsx` is the bottom orientation strip, two rows doing two jobs. **AD** is the true chronological axis — period bands plus a marker for where the reading falls in time. **DAYS** is an evenly spaced rail, one segment per day. They must be separate: positioned by year, over half the adjacent days sit within 12px of each other and days 311–324 collapse onto a single point at AD 33.25, which made the last third of the plan unclickable. There are **no `<title>` elements** in that SVG — `<title>` draws the browser's own unstyled tooltip, which duplicated the themed pill; accessible names come from `aria-label` instead.

### PlayControls

Collapsible panel rendered below `TimelineBar` as a sibling of `.app-body`. Default state is **collapsed** — only a small `.pc-toggle` tab is visible (18px pill with `border-radius: 0 0 8px 8px`, hanging below the timeline border). Clicking the tab expands the full card via a `max-height` CSS transition (`0 → 80px`, 0.28s cubic-bezier).

Local state only: `isOpen` (`useState(false)`) lives entirely in `PlayControls.jsx` — no changes to App.jsx required for open/close.

**Toggle tab** (`.pc-toggle`): shows "PLAY" label in Cinzel 8px + a caret chevron that flips direction when open. While `isPlaying`, gains `.pc-toggle--active` (gold tint, `border-color: rgba(201,168,76,0.4)`) and a pulsing `.pc-dot` (4px gold circle, `pcDotPulse` keyframe animation).

**Expanded card** (`.pc-card`): dark pill `rgba(19,24,42,0.95)`, `border: 1px solid rgba(201,168,76,0.35)`, `border-radius: 6px`. Contains:
- `.pc-rewind` — icon button (back-arrow + vertical bar SVG), calls `onReset`
- `.pc-playbtn` — 42px gold circle (`background: var(--accent)`); triangle SVG when paused, dual-rect pause bars when playing; `.pc-playbtn--playing` adds `box-shadow: 0 0 14px rgba(201,168,76,0.45)` glow
- `.pc-speeds` — row of three `.pc-speed` pills (`½×`, `1×`, `2×`); active pill gets `.pc-speed--active` (gold background)

Props: `isPlaying`, `playSpeed`, `onPlay`, `onPause`, `onReset`, `onSpeedChange`.

### BookDetailPanel

Absolutely positioned over the right edge of `.map-container`. Always in the DOM; CSS `transform: translateX(100%)` hides it when no book is selected; `.bdp--open` (`translateX(0)`) slides it in with a 0.25s ease transition. Width 320px, full map height. Receives `book` (full object or null) and `onClose`. Looks up writing city and recipient cities from `journeyData.cities` internally.

Sections rendered when open: close button → event name (Cinzel 28px gold) → `when` badge → setting city + province → region chip (teal) → theme (italic) → key verse block (green left border) → attestation line → scripture refs. The attestation line names the Gospels outright ("Told in Matthew, Mark and Luke.") via the local `tellsIt()`; it used to say only "attested in fewer than all four Gospels", off a `attribution` field that no longer exists.

### FilterPanel layout

Positioned `absolute` inside `.map-container` (top-left, `12px` inset). Width 240px, auto height, `max-height: calc(100% - 24px)`, `overflow-y: auto`. Background `rgba(19,24,42,0.92)` with `border: 1px solid var(--border-lt)` and `border-radius: 4px`. `z-index: 20` (above map SVG and BookDetailPanel). Does not affect map layout — map SVG always fills the full container.

Below both view-mode sections, always visible: a thin `fp-layer-divider` border followed by an `fp-layer-row` checkbox labeled "Provincial Boundaries" with a gold square swatch (`fp-province-swatch`). Toggles `showProvinces` in App.jsx.

### Styles

- `src/styles/tokens.css` — CSS custom properties for colors, fonts, journey colors (`--j1`–`--j-pst`), city colors, the glass/lip system (`--glass-*`, `--pill-bg*`, `--lip-*`), and the timeline material tokens (`--well-bg`, `--well-lip`, `--rail-bg`, `--tip-bg`, `--sheen-*`, `--bevel-*`, `--groove-shadow`, `--cast-shadow`, `--grain`). Every one has a parchment counterpart under `[data-theme="light"]`
- `src/utils/timelineMaterial.js` — `mat(id)` / `bevelRect(rect)` for the SVG material (see the Timeline material system section)
- `src/index.css` — imports tokens, base reset, layout (`.app`, `.app-header`, `.app-body`, `.map-container`, `.timeline-bar`), all `fp-*` FilterPanel styles, all `bdp-*` BookDetailPanel styles, all `pc-*` PlayControls styles, all `tl-*` timeline detail styles, all `ct-*` church track styles including `@keyframes ctMarkerPulse` and `.ct-marker-pulse` (scale 1→1.8→1 over 600ms, `transform-box: fill-box`), `.city-tooltip` and child classes (`.city-tooltip__name`, `__modern`, `__desc`, `__ref`) for city and segment distance tooltips. `.map-container > div` and `.map-container > div > svg` replace the old `> svg` selectors since MapView now wraps its SVG in a container div.
- `src/utils/stopLayout.js` — `buildStopLayout(journey)` shared utility for duration-proportional x layout
- Google Fonts: Cinzel (display/headings), Cormorant Garamond (serif), Lora (body) — linked in `index.html`
- `public/icons.svg` — SVG sprite sheet (referenced via `<use href="/icons.svg#...">` if needed)
