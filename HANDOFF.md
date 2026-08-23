# Handoff prompt

Paste the block below into a fresh session. It is written to be pasted verbatim.

---

Picking up work on jesus-world (/Users/patrickanderson/jesus-world), an
interactive atlas of the Gospels — React 19 + Vite + D3, deployed on Vercel.

Read CLAUDE.md and PROJECT-STATUS.md first. Both are accurate as of the current
HEAD — CLAUDE.md is the architecture reference, PROJECT-STATUS has what shipped
and the 13 open items in priority order.

Seven things that will save you time:

1. **This app began as an atlas of Paul's journeys and was reskinned for the
   Gospels.** Field names in gospels-data.json still carry the old vocabulary —
   `journeys` are periods, `books` are the 16 marquee events, `churchEvents` are
   things that happened at a place, `paulEvents` are per-period events. Nearly
   every serious bug found so far has been an inherited assumption that was
   quietly wrong: a timeline that drew 26 of 41 route segments, a sea/land
   classifier that never once fired, a zoom that inverted on drill-down, a route
   colour that was the UI accent. **Check the data before trusting a label, and
   measure before trusting a description.**

2. **Everything below is generated and must never be hand-edited.**
   `src/data/reading-plan/`, `basemap-levant.json`, `water-levant.json`,
   `terrain-levant.json`, `site-plans.json`, `landmarks-levant.json`,
   `public/provinces.geojson`, `public/hillshade-levant.png`. Generators are in
   CLAUDE.md's Commands block. Re-run them; don't patch their output. Four hit
   the network and cache locally (`scripts/.*-cache*`, gitignored).

3. **The Claude Code browser pane runs with `document.hidden === true`.** CSS
   transitions and d3 transitions mostly do complete, but not reliably — and
   reading `getBoundingClientRect()` on a mid-transition element returns nonsense
   (it once reported a 217px button as 948px wide). Assert on inline styles and
   attributes, which are the source of truth, or bypass the animation. Also: the
   pane's screenshot canvas often disagrees with the page viewport; if a
   screenshot looks scaled into a corner, resize the window and re-shoot.

4. **Port 5199**, pinned in `.claude/launch.json` because 5173 is taken.

5. **Lint baseline is 3 errors + 2 warnings**, all pre-existing and listed in
   PROJECT-STATUS. Don't treat them as regressions; don't add to them either.

6. **The honesty rule this project runs on.** Reconstructions are marked as
   reconstructions, and generators validate their own output rather than ship a
   plausible wrong answer — `build-terrain.mjs` currently refuses to emit both
   the Dead Sea antique shoreline and Lake Huleh, and records why. Modern data
   that would be anachronistic is excluded on purpose: six 20th-century
   reservoirs, and the Ottoman Old City wall. If you add anything to the map,
   it has to declare what it is.

7. **I review on localhost and say "merge"/"deploy" explicitly before you push.**
   Commit freely; don't push unasked.

Ask me what I want to work on before starting.

---

## Where things stand

Deployed and current. Last session took it from a working atlas to one with real
physical geography, and found a lot of broken things on the way.

**Working:** three linked surfaces — Atlas (`#`), Charts (`#/visuals`), Reader
(`#/gospels`). 16 marquee events on a 4-state timeline. 26 places, 7 Herodian
regions, 6 periods. Elevation contours and hillshade, the Sea of Galilee and Dead
Sea and Jordan, the Temple Mount at true size, schematic town plans for five
places. A first-run tour. Play mode. 39-day chronological reading plan, 3,779
verses, text and map sharing the screen.

**Top of the backlog** (full list in PROJECT-STATUS):

1. `JerusalemDiagram` and the new Jerusalem town plan overlap — same city, two
   idioms, met in sequence by the same reader.
2. Machaerus is missing from `cities`, so reading-plan day 300 is pinned `null`.
3. The 26 `LOCATION_OVERRIDES` driving the reader's map were assigned by Claude
   and never reviewed.
4. The Galilee route tangle — six periods through one corridor. Data density,
   not linework; thinning it is a display decision and so Patrick's.

**Two open research problems**, both blocked on data rather than code:
the Dead Sea's −395 m antique shoreline (too thin a band to stitch at 150 m/px —
wants a finer DEM or a lake mask) and Lake Huleh (elevation alone can't separate
the lake from the valley floor — wants a hydrological constraint or the
pre-drainage survey).
