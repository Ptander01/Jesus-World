# Handoff prompt

Paste the block below into a fresh session. It is written to be pasted verbatim.

---

Picking up work on jesus-world (/Users/patrickanderson/jesus-world), an
interactive atlas of the Gospels — React 19 + Vite + D3, deployed on Vercel at
jesus-world.vercel.app.

Read CLAUDE.md and PROJECT-STATUS.md first. Both are accurate as of the current
HEAD (`aa1b40f`) — CLAUDE.md is the architecture reference, PROJECT-STATUS has
what shipped and the 10 open items in priority order.

Eight things that will save you time:

1. **This app began as an atlas of Paul's journeys and was reskinned for the
   Gospels.** Field names in gospels-data.json still carry the old vocabulary —
   `journeys` are periods, `books` are the 16 marquee events, `churchEvents` are
   things that happened at a place, `paulEvents` are per-period events. Nearly
   every serious bug found so far has been an inherited assumption that was
   quietly wrong: a timeline that drew 26 of 41 route segments, a sea/land
   classifier that never once fired, a zoom that inverted on drill-down, a route
   colour that was the UI accent, a date bracket padded ±0.5 years for whole-year
   dates the data no longer carries. **Check the data before trusting a label,
   and measure before trusting a description — including descriptions in these
   docs.** Two bugs last session were worse than PROJECT-STATUS recorded, and one
   line of CLAUDE.md was simply wrong.

2. **Everything below is generated and must never be hand-edited.**
   `src/data/reading-plan/`, `basemap-levant.json`, `water-levant.json`,
   `terrain-levant.json`, `site-plans.json`, `landmarks-levant.json`,
   `public/provinces.geojson`, `public/hillshade-levant.png`. Generators are in
   CLAUDE.md's Commands block. Re-run them; don't patch their output. Four hit
   the network and cache locally (`scripts/.*-cache*`, gitignored).

3. **The Claude Code browser pane runs with `document.hidden === true`.** CSS and
   d3 transitions mostly complete, but not reliably, and mid-transition
   `getBoundingClientRect()` returns nonsense. The pane also opens at a 0×0
   viewport — call `resize_window` before measuring anything, or every rect comes
   back zero. And its screenshots can fail to paint elements that are provably
   present: last session a heatmap looked empty while every cell measured
   `opacity: 1` at 74×46px. **Assert on computed styles and attributes, not on
   screenshots.**

4. **Port 5199**, pinned in `.claude/launch.json` because 5173 is taken.

5. **Lint baseline is 3 errors + 2 warnings**, all pre-existing and listed in
   PROJECT-STATUS. Don't treat them as regressions; don't add to them either.

6. **The honesty rule this project runs on.** Reconstructions are marked as
   reconstructions, and generators validate their own output rather than ship a
   plausible wrong answer — `build-terrain.mjs` currently refuses to emit both
   the Dead Sea antique shoreline and Lake Huleh, and records why. Modern data
   that would be anachronistic is excluded on purpose: six 20th-century
   reservoirs, and the Ottoman Old City wall. If you add anything to the map, it
   has to declare what it is.

7. **Analytics is wired to the hash router and must stay that way.** Vercel's
   tracker only sees History-API navigation — it patches `pushState`, listens for
   `popstate`, and has no `hashchange` handler. This app routes entirely on the
   hash, so `Root.jsx` passes `route`/`path` to a single `<Analytics>` to turn
   auto-tracking off and report explicitly. Two traps are documented in
   CLAUDE.md's Analytics section; the empty-hash one silently zeroes the atlas.
   Don't "simplify" it back to a bare `<Analytics />`.

8. **I review on localhost and say "merge"/"deploy" explicitly before you push.**
   Commit freely; don't push unasked.

Ask me what I want to work on before starting.

---

## Where things stand

Deployed, current, and verified live. `main` == `aa1b40f` == what Vercel is
serving.

**Working:** three linked surfaces — Atlas (`#`), Charts (`#/visuals`), Reader
(`#/gospels`), each reachable from the others. 16 marquee events on a 4-state
timeline. 26 places, 7 Herodian regions, 6 periods. Elevation contours and
hillshade, the Sea of Galilee and Dead Sea and Jordan, the Temple Mount at true
size, schematic town plans for five places. A first-run tour. Play mode. 39-day
chronological reading plan, 3,779 verses, text and map sharing the screen. Web
Analytics reporting per surface.

**Top of the backlog** (full list in PROJECT-STATUS):

1. `JerusalemDiagram` and the Jerusalem town plan overlap — same city, two
   idioms, met in sequence by the same reader.
2. Machaerus is missing from `cities`, so reading-plan day 300 is pinned `null`.
3. The 26 `LOCATION_OVERRIDES` driving the reader's map were assigned by Claude
   and never reviewed.
4. The Galilee route tangle — six periods through one corridor. Data density,
   not linework; thinning it is a display decision and so Patrick's.
5. **Mobile: the Atlas header overflows.** At 375px it lays out five children in
   553px — search, the `?` tour button and the theme toggle are all off the right
   edge. Charts was fixed to 320px last session; the Atlas needs a layout
   decision (wrap, collapse search to an icon, or move controls into the drawer).

**Two open research problems**, both blocked on data rather than code: the Dead
Sea's −395 m antique shoreline (too thin a band to stitch at 150 m/px — wants a
finer DEM or a lake mask) and Lake Huleh (elevation alone can't separate the lake
from the valley floor — wants a hydrological constraint or the pre-drainage
survey).

**One known-good caveat, not a bug.** Selecting a marquee event highlights the
single route leg it falls on. For the Passion Week events those legs are
genuinely sub-kilometre (Gethsemane→Jerusalem is ~430 m), and nothing zooms on
selection, so at the opening view they read as a dot. Correct, but Patrick may
want selection to zoom.
