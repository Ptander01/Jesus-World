import { useRef, useEffect, useMemo, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import countries50m from 'world-atlas/countries-50m.json'
import journeyData from '../data/gospels-data.json'
import { inLens } from '../lib/attestation.js'

const W = 1200
const H = 680

// Zoom limits. The ceiling used to be 8, which could not resolve Passion Week:
// Mount of Olives and Gethsemane are 0.49km apart — 1.1 viewBox units — and five
// pairs of the week's sites sat closer together than a single label. 32 gives
// ~16km across the frame, enough to separate every pair in the data.
const K_MIN = 0.5
const K_MAX = 32
// Above this, point marks stop growing. Lines keep thickening with zoom (that is
// what makes room for their casing and highlight), but a city dot that kept
// growing as k^0.4 would reach a 20px radius at the new ceiling.
// The drill-down gets a lower ceiling than the user does. Fitting Passion Week's
// own extent wants k=85 — three kilometres of Jerusalem filling the frame — and
// at that range the atlas has nothing left to draw: no coastline, no borders,
// just green with two dots on it. 16 keeps the week's sites separable while
// leaving the city in context. Manual zoom can still go to K_MAX.
const K_AUTO_MAX = 16
const K_MARK_CAP = 8
const MARK_CAP_S = Math.pow(K_MARK_CAP, 0.4)

function haversineKm([lon1, lat1], [lon2, lat2]) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.asin(Math.sqrt(a)))
}

const JOURNEY_MAP = {
  'period-1': journeyData.colorSystem.period1,
  'period-2': journeyData.colorSystem.period2,
  'period-3': journeyData.colorSystem.period3,
  'period-4': journeyData.colorSystem.period4,
  'period-5': journeyData.colorSystem.period5,
  'period-6': journeyData.colorSystem.period6,
}


// ── Journey segment helpers (sea/land split rendering + progressive reveal) ──

// Sample a sub-range of a path into a polyline that matches the curve shape
function samplePath(node, l0, l1, step = 6) {
  const pts = []
  const n = Math.max(2, Math.ceil((l1 - l0) / step))
  for (let i = 0; i <= n; i++) {
    const p = node.getPointAtLength(l0 + ((l1 - l0) * i) / n)
    pts.push(`${p.x.toFixed(2)},${p.y.toFixed(2)}`)
  }
  return 'M' + pts.join('L')
}

// Progressive reveal for a dashed segment: emit the dash pattern up to
// `visible`, then extend/append a gap large enough to swallow the rest.
// (stroke-dashoffset only shifts a pattern — it can't truncate one.)
function dashedRevealArray(visible, segLen, dash, gap) {
  if (visible <= 0.1) return `0 ${Math.ceil(segLen) + 12}`
  if (visible >= segLen - 0.5) return `${dash} ${gap}`
  const parts = []
  let acc = 0
  while (acc < visible) {
    const d = Math.min(dash, visible - acc)
    parts.push(d.toFixed(1))
    acc += d
    if (acc >= visible) break
    const g = Math.min(gap, visible - acc)
    parts.push(g.toFixed(1))
    acc += g
  }
  const rest = Math.ceil(segLen - acc) + 12
  if (parts.length % 2 === 1) parts.push(rest)
  else parts[parts.length - 1] = (parseFloat(parts[parts.length - 1]) + rest).toFixed(1)
  return parts.join(' ')
}

// Reveal state for a journey at a year (null year = no scrub → full route).
// Returns { len, op }, or null when the journey should keep its current state.
function revealStateFor(journey, jd, year, isActive) {
  if (year === null) return { len: jd.total, op: jd.baseOpacity }
  if (!isActive) return null
  if (year < journey.dateRange[0]) return { len: 0, op: jd.baseOpacity }
  if (journey.dateRange[1] <= year) return { len: jd.total, op: 0.18 }
  const wps = jd.wps
  const nextIdx = wps.findIndex(wp => wp.year > year)
  let len
  if (nextIdx === -1) len = jd.total
  else if (nextIdx === 0) len = 0
  else {
    const prevIdx = nextIdx - 1
    const denom   = wps[nextIdx].year - wps[prevIdx].year
    const t       = denom > 0 ? Math.max(0, Math.min(1, (year - wps[prevIdx].year) / denom)) : 1
    len = jd.wpLengths[prevIdx] + t * (jd.wpLengths[nextIdx] - jd.wpLengths[prevIdx])
  }
  return { len, op: jd.baseOpacity }
}

// Mix a route colour toward the map's ground (for casings) or its ink (for
// chevrons). Always this rather than d3's brighter()/darker(), which scale RGB
// channels and clip: brighter() turned the gold route's light-theme casing into
// a neon #ffff86 and its chevrons into #fffd73.
const tint = (c, toward, t) => d3.interpolateRgb(c, toward)(t)

// Apply a reveal state to every segment, casing, and chevron of a journey
function applyRevealState(jd, revealLen, opacity) {
  // Opacity rides the two groups rather than the individual paths. A route is
  // drawn one path per waypoint pair, so at any opacity below 1 the round caps
  // where consecutive segments meet composite twice and print a brighter pip at
  // every stop — the whole route beaded. Fading the group composites the
  // segments against each other first, then fades the result once.
  d3.select(jd.segG).attr('opacity', opacity)
  if (jd.caseG) d3.select(jd.caseG).attr('opacity', opacity)
  // The lit edge is a highlight, not a line — it carries less than the body so a
  // route never reads as two strokes.
  if (jd.hiG) d3.select(jd.hiG).attr('opacity', opacity * 0.75)
  jd.segs.forEach(seg => {
    const segLen = seg.l1 - seg.l0
    const vis = Math.max(0, Math.min(segLen, revealLen - seg.l0))
    const el = d3.select(seg.el)
    if (seg.dash) el.attr('stroke-dasharray', dashedRevealArray(vis, segLen, seg.dash[0], seg.dash[1]))
    else el.attr('stroke-dashoffset', segLen - vis)
    if (seg.caseEl) d3.select(seg.caseEl).attr('stroke-dashoffset', segLen - vis)
    if (seg.hiEl) d3.select(seg.hiEl).attr('stroke-dashoffset', segLen - vis)
  })
  jd.chevrons.forEach(c => {
    d3.select(c.el).attr('opacity',
      opacity > 0.1 && c.len <= revealLen ? Math.min(0.6, opacity * 0.7) : 0)
  })
}

// Maps the Herodian-era region dataset's feature names to the region ids used
// in gospels-data.json. Extend as the chosen provinces.geojson dictates.
function normalizeProvinceName(rawName) {
  const map = {
    'Galilee':                'galilee',
    'Judaea':                 'judea',
    'Judea':                  'judea',
    'Iudaea':                 'judea',
    'Samaria':                'samaria',
    'Peraea':                 'perea',
    'Perea':                  'perea',
    'Ituraea':                'iturea',
    'Iturea et Trachonitis':  'iturea',
    'Gaulanitis':             'iturea',
    'Trachonitis':            'iturea',
    'Decapolis':              'decapolis',
    'Phoenice':               'phoenicia',
    'Phoenicia':              'phoenicia',
    'Syria':                  'phoenicia',
  }
  return map[rawName] ?? rawName.toLowerCase().replace(/\s+/g, '-')
}

function applyZoomStyling(mapGEl, k) {
  const g = d3.select(mapGEl)
  // Labels hold constant screen size (1/k); halo width tracks the font
  g.selectAll('.province-label').attr('font-size', 15 / k).attr('stroke-width', 3.4 / k)
    .attr('letter-spacing', 1.6 / k)
  g.selectAll('.province-sub').attr('font-size', 11 / k).attr('stroke-width', 2.8 / k)
    .attr('y', function () { return +this.dataset.y0 + 16 / k })
  g.selectAll('.label-t1').attr('font-size', 13 / k).attr('stroke-width', 3 / k)
  g.selectAll('.label-t2').attr('font-size', 11 / k).attr('stroke-width', 2.6 / k).attr('opacity', k >= 2   ? 0.85 : 0)
  g.selectAll('.label-t3').attr('font-size',  9 / k).attr('stroke-width', 2.2 / k).attr('opacity', k >= 3.5 ? 0.75 : 0)
  g.selectAll('.road-label').attr('font-size', 9 / k).attr('stroke-width', 2.4 / k).attr('letter-spacing', 3 / k)

  // Strokes and dots thin gently under zoom: rendered size grows as k^0.4
  // instead of k, so zoomed-in lines stay lines rather than ribbons.
  const s = Math.pow(k, 0.6)
  // Point marks follow that only to K_MARK_CAP, then hold the rendered size they
  // had there. Continuous at the cap, since K_MARK_CAP / MARK_CAP_S === k^0.6.
  const sp = k <= K_MARK_CAP ? s : k / MARK_CAP_S
  g.selectAll('.journey-line').attr('stroke-width', 2 / s)
  g.selectAll('.journey-case').attr('stroke-width', 3.4 / s)
  // Both the highlight's width and its offset track the body, so the lit edge
  // stays a fixed fraction of the stroke at every zoom instead of sliding off it.
  g.selectAll('.journey-hi')
    .attr('stroke-width', 0.85 / s)
    .attr('transform', `translate(0,${-0.45 / s})`)
  g.selectAll('.paul-marker-halo').attr('r', 7 / sp)
  g.selectAll('.paul-marker-core').attr('r', 2.8 / sp).attr('stroke-width', 0.9 / sp)
  g.selectAll('.route-chevron').each(function () {
    const d = this.dataset
    d3.select(this).attr('transform', `translate(${d.x},${d.y}) rotate(${d.a}) scale(${1 / sp})`)
  })
  // Natural-feature hierarchy, strongest to faintest: coastline, era roads,
  // region borders, modern country borders, graticule. These used to sit within
  // 0.3px of each other (0.5–0.8), which left the coastline — the strongest line
  // on any map — thinner than the road layer, so the base read as flat wash with
  // the routes floating over nothing.
  // Contours fade in with zoom. At the opening view they would read as hatching
  // over the whole land mass; by k=3 there is room for them to be terrain.
  const contourOp = Math.max(0, Math.min(0.5, (k - 1.4) * 0.34))
  g.selectAll('.map-contour')
    .attr('stroke-opacity', contourOp)
    .attr('stroke-width', function () {
      return (this.dataset.level === '0' ? 0.5 : 0.35) / s
    })
  g.selectAll('.map-coast').attr('stroke-width', 1.1 / s)
  g.selectAll('.map-lake').attr('stroke-width', 1.1 / s)
  g.selectAll('.map-river').attr('stroke-width', 0.8 / s)
  g.selectAll('.era-road').attr('stroke-width', 0.9 / s)
  g.selectAll('.province-border').attr('stroke-width', 0.9 / s)
  g.selectAll('.map-borders').attr('stroke-width', 0.5 / s)
  g.selectAll('.map-graticule').attr('stroke-width', 0.4 / s)
  g.selectAll('.seg-hit').attr('stroke-width', 12 / k) // hit zone stays screen-constant

  g.selectAll('.city-dot').each(function () {
    const el  = d3.select(this)
    const r0  = parseFloat(this.dataset.r0 ?? this.getAttribute('r'))
    const sw0 = parseFloat(this.dataset.sw0 ?? this.getAttribute('stroke-width'))
    el.attr('r', r0 / sp).attr('stroke-width', sw0 / sp)
  })
}

function labelBox(lx, ly, text, fontSize, ta) {
  const w = text.length * fontSize * 0.62
  const h = fontSize
  let x1 = lx
  if (ta === 'end')    x1 = lx - w
  else if (ta === 'middle') x1 = lx - w / 2
  return { x1, y1: ly - h * 0.85, x2: x1 + w, y2: ly + h * 0.2 }
}

function boxesOverlap(a, b) {
  return a.x1 < b.x2 + 2 && a.x2 > b.x1 - 2 && a.y1 < b.y2 + 2 && a.y2 > b.y1 - 2
}

const LABEL_TRIES = [
  { dx:  5, dy:  3, ta: 'start'  },
  { dx: -5, dy:  3, ta: 'end'    },
  { dx:  5, dy: -7, ta: 'start'  },
  { dx: -5, dy: -7, ta: 'end'    },
  { dx:  5, dy: 13, ta: 'start'  },
  { dx: -5, dy: 13, ta: 'end'    },
  { dx:  0, dy: -9, ta: 'middle' },
  { dx:  0, dy: 14, ta: 'middle' },
]

function greedyLabelPos(cx, cy, text, fontSize, placed) {
  for (const { dx, dy, ta } of LABEL_TRIES) {
    const box = labelBox(cx + dx, cy + dy, text, fontSize, ta)
    if (!placed.some(b => boxesOverlap(box, b))) {
      placed.push(box)
      return { lx: cx + dx, ly: cy + dy, ta }
    }
  }
  return { lx: cx + LABEL_TRIES[0].dx, ly: cy + LABEL_TRIES[0].dy, ta: LABEL_TRIES[0].ta }
}

const ANCHOR_OFFSETS = {
  'right':        { dx:  7, dy:  4, ta: 'start'  },
  'left':         { dx: -7, dy:  4, ta: 'end'    },
  'top':          { dx:  0, dy: -9, ta: 'middle' },
  'bottom':       { dx:  0, dy: 16, ta: 'middle' },
  'top-right':    { dx:  6, dy: -6, ta: 'start'  },
  'top-left':     { dx: -6, dy: -6, ta: 'end'    },
  'bottom-right': { dx:  6, dy: 16, ta: 'start'  },
  'bottom-left':  { dx: -6, dy: 16, ta: 'end'    },
}

// ── Ternary search: arc length at closest point to (tx, ty) on pathNode
// Arc length along the spine at each waypoint, in order.
//
// The spine is a Catmull-Rom through the waypoints, so it passes exactly through
// every one of them — but a route that revisits a city gives the distance-to-
// that-city function several minima, and the previous implementation ternary-
// searched the whole path for the single closest point. Every visit after the
// first therefore resolved to the first visit's arc length, the segment measured
// zero, and the `l1 - l0 < 0.5` guard dropped it. The map drew 26 of the 41
// segments the data implies: the Galilean ministry (Capernaum ×5) lost most of
// its shuttle legs, and every return crossing of the Sea of Galilee vanished.
//
// Walking a dense sample forward without backtracking is monotone by
// construction, which is the actual invariant — waypoint i cannot sit earlier
// along the spine than waypoint i-1.
function waypointArcLengths(pathNode, pts, total) {
  if (total === 0) return pts.map(() => 0)
  // Sample count, not sample spacing: Passion Week's entire route spans about
  // six viewBox units, so a fixed 3-unit step put consecutive waypoints on the
  // same sample and dropped two of its six segments.
  const n = Math.max(200, Math.ceil(total / 3))
  const step = total / n
  const sx = new Float64Array(n + 1), sy = new Float64Array(n + 1)
  for (let i = 0; i <= n; i++) {
    const p = pathNode.getPointAtLength((i / n) * total)
    sx[i] = p.x; sy[i] = p.y
  }
  // Within ~1.5 samples of the waypoint counts as "the curve passes here".
  const TOL2 = (step * 1.5) ** 2
  const out = []
  let cursor = 0
  for (let k = 0; k < pts.length; k++) {
    const [tx, ty] = pts[k]
    let best = cursor, bestD = Infinity
    for (let i = cursor; i <= n; i++) {
      const d = (sx[i] - tx) ** 2 + (sy[i] - ty) ** 2
      if (d < bestD) { bestD = d; best = i }
      // Once we are within a sample step of the waypoint and moving away again,
      // this is the approach that belongs to it — later ones belong to later
      // waypoints.
      else if (bestD <= TOL2) break
    }
    out.push((best / n) * total)
    cursor = Math.min(best + 1, n)
  }
  out[0] = 0
  out[out.length - 1] = total
  return out
}

function getPaulLocationAtYear(year, cityById) {
  if (year < 29) return cityById['nazareth']?.coords ?? null
  const candidates = [...journeyData.journeys].reverse()
  for (const journey of candidates) {
    if (year < journey.dateRange[0] || year > journey.dateRange[1]) continue
    const wps = journey.waypoints.filter(wp => cityById[wp.cityId])
    if (!wps.length) continue
    const before = [...wps].reverse().find(wp => wp.year <= year)
    const after   = wps.find(wp => wp.year > year)
    if (!before && !after) continue
    if (!before) return cityById[after.cityId].coords
    if (!after)  return cityById[before.cityId].coords
    const t = (year - before.year) / (after.year - before.year)
    const [blon, blat] = cityById[before.cityId].coords
    const [alon, alat] = cityById[after.cityId].coords
    return [blon + (alon - blon) * t, blat + (alat - blat) * t]
  }
  return null
}

function getPlayZoom(location) {
  if (!location) return 1.4
  const [lon, lat] = location
  // The whole ministry fits in ~200 km, so zoom stays gentle. Tighten a little
  // around Jerusalem/Judea for the Passion Week beats.
  if (lat < 32.2 && lon >= 34.9 && lon <= 35.6) return 2.2
  return 1.5
}

// Scale bar showing a fixed 50 km reference in the bottom-right corner
function ScaleBar({ projection, theme, fitMode }) {
  const barColor = theme === 'light' ? '#4a5a6a' : '#7a8ab0'
  const TARGET_KM = 50
  const R = 6371
  // Compute pixel width for TARGET_KM at the map's center latitude (~32°N)
  const centerLat = 32 * Math.PI / 180
  const dLon = (TARGET_KM / R) / Math.cos(centerLat) * (180 / Math.PI)
  const [x0] = projection([35.3, 32])
  const [x1] = projection([35.3 + dLon, 32])
  const barW = Math.round(x1 - x0)

  // Position in SVG units, bottom-right
  const bx = W - barW - 40
  const by = H - 28

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio={`xMidYMid ${fitMode}`}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      <line x1={bx} y1={by} x2={bx + barW} y2={by} stroke={barColor} strokeWidth={1.5} />
      <line x1={bx} y1={by - 5} x2={bx} y2={by + 5} stroke={barColor} strokeWidth={1.5} />
      <line x1={bx + barW} y1={by - 5} x2={bx + barW} y2={by + 5} stroke={barColor} strokeWidth={1.5} />
      <text x={bx + barW / 2} y={by - 8} textAnchor="middle"
        fontFamily="Cinzel, serif" fontSize={9} letterSpacing={2} fill={barColor}>
        {TARGET_KM} KM
      </text>
    </svg>
  )
}

export default function MapView({
  activeJourneys,
  selectedBookId,
  timelineYear,
  hoveredCityId,
  onCityHover,
  onCityClick,
  provincesGeo,
  showProvinces,
  isPlaying,
  detailJourneyId,
  onMapReady,
  theme,
  lens = 'All',
  initialFocus,
  // How the 1200×680 viewBox fits its container. 'meet' letterboxes so the whole
  // frame shows — right for the Atlas, whose container is landscape. The reader
  // gives the map a tall half-width column, where 'meet' would letterbox a
  // landscape viewBox into a portrait box and leave a 237px dead band above and
  // below; 'slice' fills and crops instead.
  fitMode = 'meet',
}) {
  const isLight = theme === 'light'
  const svgRef      = useRef(null)
  const mapGRef     = useRef(null)
  const containerRef = useRef(null)
  const kRef        = useRef(1)
  const zoomRef     = useRef(null)
  const lineDataRef = useRef({})   // journey.id → { node, total, wps, wpLengths }
  const lastPanRef  = useRef(0)

  const [tooltipCity,   setTooltipCity]   = useState(null)
  const [tooltipPos,    setTooltipPos]    = useState({ x: 0, y: 0 })
  const [segmentTip,    setSegmentTip]    = useState(null)  // { from, to, km, x, y }


  // 50m atlas ships in the bundle for first paint; a Levant-cropped 10m basemap
  // lazy-loads during idle and swaps in for crisper coastlines.
  //
  // The crop matters for more than filesize. The full 10m land set draws as a
  // path of ~8.1 million characters whose bbox is 78540 × 75387 against a
  // 1200 × 680 viewBox — ~99.99% of it off-frame. Because `land`/`borders` are
  // in the render effect's deps and that effect opens with selectAll('*').remove(),
  // the swap tore down and rebuilt the entire map, and rasterising that path made
  // the rebuild visible for seconds: bare sea colour where the land should be,
  // which read as land and sea inverted. Cropped, the swap is imperceptible.
  // See scripts/crop-basemap.mjs; regenerate with `node scripts/crop-basemap.mjs`.
  const [hiBasemap, setHiBasemap] = useState(null)
  const [water, setWater] = useState(null)
  const [terrain, setTerrain] = useState(null)
  useEffect(() => {
    let cancelled = false
    const load = () => {
      import('../data/basemap-levant.json')
        .then(m => { if (!cancelled) setHiBasemap(m.default ?? m) })
        .catch(() => {}) // 50m stays if the fetch fails
      // Inland water — see scripts/build-water.mjs. Also code-split: nothing
      // about the land map depends on it, and it is the larger of the two.
      import('../data/water-levant.json')
        .then(m => { if (!cancelled) setWater(m.default ?? m) })
        .catch(() => {})
      // Contours — see scripts/build-terrain.mjs.
      import('../data/terrain-levant.json')
        .then(m => { if (!cancelled) setTerrain(m.default ?? m) })
        .catch(() => {})
    }
    const ric = window.requestIdleCallback
    const id = ric ? ric(load, { timeout: 8000 }) : setTimeout(load, 3000)
    return () => {
      cancelled = true
      ;(ric ? window.cancelIdleCallback : clearTimeout)(id)
    }
  }, [])

  // The cropped basemap ships as plain GeoJSON, already rewound at build time —
  // no topojson.feature/mesh and no runtime rewind on that path.
  const land = useMemo(
    () => hiBasemap?.land
      ?? topojson.feature(countries50m, countries50m.objects.land),
    [hiBasemap]
  )
  const borders = useMemo(
    () => hiBasemap?.borders
      ?? topojson.mesh(countries50m, countries50m.objects.countries, (a, b) => a !== b),
    [hiBasemap]
  )
  // Gospels theatre: from Sidon down to Bethlehem, Emmaus across to Mt Hermon —
  // a tall, narrow ~200 km strip, so the scale is far higher than Paul's basin.
  const projection = useMemo(
    () => d3.geoMercator().center([35.4, 32.4]).scale(12500).translate([W / 2, H / 2]),
    []
  )
  const pathGen = useMemo(() => d3.geoPath(projection), [projection])

  const cityById = useMemo(() => {
    const map = {}
    journeyData.cities.forEach(c => { map[c.id] = c })
    return map
  }, [])

  // Mirror of timelineYear for the render effect (which must not re-run per frame)
  const timelineYearRef = useRef(timelineYear)
  useEffect(() => { timelineYearRef.current = timelineYear }, [timelineYear])
  const paulMarkerRef = useRef(null)

  // Sea vs land per journey segment — sampled with spherical point-in-polygon
  // against the 50m land (always bundled; independent of the lazy basemap swap),
  // so the classification never shifts when the crisper basemap arrives.
  // A leg is a sea crossing if it leaves the land mass *or* crosses inland
  // water. Only the first half of that existed before, and the Levant's coast
  // never falls between two waypoints — so 0 of 42 legs classified as sea, and
  // Capernaum→Gergesa, the Calming of the Storm, drew as a road.
  const segModes = useMemo(() => {
    const landTest = topojson.feature(countries50m, countries50m.objects.land)
    const lakePolys = (water?.lakes ?? []).map(l => ({
      type: 'Feature', properties: {},
      geometry: { type: 'Polygon', coordinates: l.rings },
    }))
    const inLake = pt => lakePolys.some(f => d3.geoContains(f, pt))
    const onLand = pt => landTest.features.some(f => d3.geoContains(f, pt)) && !inLake(pt)
    const modes = {}
    journeyData.journeys.forEach(j => {
      const wps = j.waypoints
        .filter((wp, i) => i === 0 || wp.cityId !== j.waypoints[i - 1].cityId)
        .filter(wp => cityById[wp.cityId])
      for (let i = 0; i < wps.length - 1; i++) {
        const a = cityById[wps[i].cityId].coords
        const b = cityById[wps[i + 1].cityId].coords
        let sea = 0
        ;[0.25, 0.5, 0.75].forEach(t => {
          if (!onLand([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])) sea++
        })
        modes[`${j.id}:${i}`] = sea >= 2 ? 'sea' : 'land'
      }
    })
    return modes
  }, [cityById, water])

  // Regions the ministry actually reaches — derived from the provinces of every
  // city visited by any period, used to gold-tint those tetrarchies.
  const visitedIds = useMemo(() => {
    const visited = new Set()
    journeyData.journeys.forEach(j => j.waypoints.forEach(wp => {
      const city = cityById[wp.cityId]
      if (city?.province) visited.add(city.province)
    }))
    return visited
  }, [cityById])

  // Cities the Gospel Lens keeps lit: those with at least one event the chosen
  // Gospel(s) actually record. `null` under "All" means "no lens constraint" —
  // distinct from an empty set, which would mean "nothing survives".
  //
  // The Lens deliberately does NOT touch the journey lines. Attestation is a property
  // of the events we hold `gospels[]` for; the itinerary between them isn't attested
  // per-Gospel in this data, so dimming the route would assert more than we know.
  const lensCityIds = useMemo(() => {
    if (lens === 'All') return null
    const lit = new Set()
    for (const e of journeyData.churchEvents) {
      if (inLens(e.gospels, lens)) lit.add(e.cityId)
    }
    // Route cities we hold no event for (Nazareth, Emmaus, Mount of Olives, ...) are
    // exempt: a dark dot claims "this Gospel records nothing here", and for these the
    // silence is our corpus's, not the Gospel's — Nazareth would otherwise go dark
    // under Matthew, who names it repeatedly. The Lens only speaks where we have
    // evidence to speak with.
    const withEvents = new Set(journeyData.churchEvents.map(e => e.cityId))
    for (const j of journeyData.journeys) {
      for (const w of j.waypoints) {
        if (!withEvents.has(w.cityId)) lit.add(w.cityId)
      }
    }
    return lit
  }, [lens])

  const lineGen = useMemo(() =>
    d3.line()
      .x(d => projection(cityById[d.cityId].coords)[0])
      .y(d => projection(cityById[d.cityId].coords)[1])
      .curve(d3.curveCatmullRom.alpha(1)), // chordal — less overshoot at sharp turns than 0.5
  [projection, cityById])

  // ── Zoom — runs once on mount ──────────────────────────────────────────
  useEffect(() => {
    const svg  = d3.select(svgRef.current)
    const mapG = d3.select(mapGRef.current)

    const zoom = d3.zoom()
      .scaleExtent([K_MIN, K_MAX])
      .on('zoom', event => {
        const t = event.transform
        kRef.current = t.k
        mapG.attr('transform', t)
        applyZoomStyling(mapGRef.current, t.k)
      })

    zoomRef.current = zoom
    svg.call(zoom)
    svg.on('dblclick.zoom', null)

    // Curated first load: settle on the Galilee cluster instead of the full dark
    // strip with nothing lit. Applied synchronously (no transition) — the app is
    // mounted behind the hero from the very first paint (see Root.jsx), so by the
    // time a visitor actually sees the map it should already be sitting still here,
    // not mid-animation from an intro no one watched.
    if (initialFocus) {
      const [ix, iy] = projection([initialFocus.lon, initialFocus.lat])
      const ik = initialFocus.scale ?? 2
      // anchorX defaults right-of-center: FilterPanel overlays the left ~18% of the
      // map, so a true W/2 center reads as off-balance in the space actually visible.
      const ax = (initialFocus.anchorX ?? 0.58) * W
      const it = d3.zoomIdentity.translate(ax - ik * ix, H / 2 - ik * iy).scale(ik)
      homeTransformRef.current = it
      kRef.current = ik
      svg.call(zoom.transform, it)
    }

    // Expose panToCity so App can call it from search
    onMapReady?.((cityId) => {
      const city = cityById[cityId]
      if (!city || !zoomRef.current || !svgRef.current) return
      const [px, py] = projection(city.coords)
      const svgEl = svgRef.current
      // Centre in viewBox units, not screen pixels. The transform is applied to a
      // <g> inside the SVG, so it lives in the viewBox's coordinate space, while
      // getBoundingClientRect() reports CSS pixels — mixing them put the target
      // 80 units right of centre on a 1360px-wide atlas, and a quarter of the
      // frame off once the reader narrowed the map to half width. `initialFocus`
      // above already anchors against W, which is the correct space.
      const scale = Math.max(kRef.current, 3)
      const t = d3.zoomIdentity.translate(W / 2 - scale * px, H / 2 - scale * py).scale(scale)
      d3.select(svgEl).transition('search-pan').duration(700).call(zoomRef.current.transform, t)
    })

    return () => svg.on('.zoom', null)
  }, [])

  // ── Map render — re-runs when data or props change ─────────────────────
  useEffect(() => {
    const mapG = d3.select(mapGRef.current)
    mapG.selectAll('*').remove()
    lineDataRef.current = {}

    // Halo behind labels — sits between the theme's land and sea tones
    const haloColor = isLight ? '#d3c9ae' : '#0a1710'

    // ── Graticule
    mapG.append('path')
      .datum(d3.geoGraticule().step([5, 5])())
      .attr('d', pathGen)
      .attr('class', 'map-graticule')
      .attr('fill', 'none')
      .attr('stroke', isLight ? '#8a9eb0' : '#0d2016')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.4)

    // ── Land
    const landPathD = pathGen(land)
    mapG.append('path')
      .attr('d', landPathD)
      .attr('fill', isLight ? '#cbbfa0' : '#21402b')
      .attr('stroke', 'none')

    // ── Terrain relief — impressionistic elevation shading, clipped to the land
    // silhouette. The Jordan Rift is a real, dramatic feature (the Sea of Galilee
    // sits ~210m below sea level, the Dead Sea ~430m — the lowest point on Earth)
    // with Judea's hill country and the Golan/Transjordan plateaus rising around
    // it; "going up to Jerusalem" is literal. Soft radial gradients stand in for a
    // proper hillshade — no elevation dataset is bundled — so this is deliberately
    // impressionistic (a few named highlands + the rift corridor), not a claim of
    // surveyed contours.
    mapG.append('clipPath').attr('id', 'map-relief-clip')
      .append('path').attr('d', landPathD)
    const reliefG = mapG.append('g')
      .attr('clip-path', 'url(#map-relief-clip)')
      .style('pointer-events', 'none')

    const HIGHLAND_COLOR = isLight ? '#fff6df' : '#e9d9a0'
    // A near-black rift shadow reads as depth on the dark theme's already-dark land,
    // but the same treatment on parchment reads as a dirty stain — light mode gets a
    // cooler, lighter slate instead, at a fraction of the dark theme's weight.
    const RIFT_COLOR = isLight ? '#5b6b74' : '#020608'
    const RIFT_MULT = isLight ? 0.45 : 1
    const RELIEF_HIGHLANDS = [
      // [lon, lat, radiusPx, weight] — named highland masses ringing the rift
      [35.22, 31.78, 95, 0.16],  // Judean hill country (Jerusalem/Bethlehem ridge)
      [35.27, 32.75, 68, 0.13],  // Galilee uplands
      [35.85, 33.15, 100, 0.15], // Golan / Ituraea plateau
      [35.95, 32.05, 90, 0.12],  // Transjordan plateau (Decapolis / Peraea)
    ]
    const RELIEF_RIFT = [
      // Jordan rift corridor, north to south, deepening toward the Dead Sea
      [35.60, 33.07, 38, 0.12 * RIFT_MULT],  // Hula basin
      [35.58, 32.83, 58, 0.20 * RIFT_MULT],  // Sea of Galilee
      [35.55, 32.20, 42, 0.14 * RIFT_MULT],  // mid Jordan valley
      [35.49, 31.55, 68, 0.30 * RIFT_MULT],  // Dead Sea — lowest point on Earth
    ]
    RELIEF_HIGHLANDS.forEach(([lon, lat, r, op], i) => {
      const [x, y] = projection([lon, lat])
      const gid = `relief-hi-${i}`
      const grad = reliefG.append('radialGradient').attr('id', gid)
      grad.append('stop').attr('offset', '0%').attr('stop-color', HIGHLAND_COLOR).attr('stop-opacity', op)
      grad.append('stop').attr('offset', '100%').attr('stop-color', HIGHLAND_COLOR).attr('stop-opacity', 0)
      reliefG.append('circle').attr('cx', x).attr('cy', y).attr('r', r).attr('fill', `url(#${gid})`)
    })
    RELIEF_RIFT.forEach(([lon, lat, r, op], i) => {
      const [x, y] = projection([lon, lat])
      const gid = `relief-rift-${i}`
      const grad = reliefG.append('radialGradient').attr('id', gid)
      grad.append('stop').attr('offset', '0%').attr('stop-color', RIFT_COLOR).attr('stop-opacity', op)
      grad.append('stop').attr('offset', '100%').attr('stop-color', RIFT_COLOR).attr('stop-opacity', 0)
      reliefG.append('circle').attr('cx', x).attr('cy', y).attr('r', r).attr('fill', `url(#${gid})`)
    })

    // ── Coastline stroke — sharpens the sea/land edge
    mapG.append('path')
      .attr('d', landPathD)
      .attr('class', 'map-coast')
      .attr('fill', 'none')
      .attr('stroke', isLight ? '#8fa4b4' : '#4a7159')
      .attr('stroke-width', 1.1)
      .attr('stroke-opacity', 0.9)

    // Route cast shadow. This is the timeline's `cast` doing the same job here.
    // The sheen and bevel do NOT transfer: those light a *shape*, and SVG cannot
    // run a gradient across a stroke's thickness — a gradient on a stroke maps to
    // the path's bounding box, along its length rather than across it. Depth on a
    // line has to come from stacked strokes and a shadow instead.
    const defsSel = mapG.append('defs')
    defsSel.append('filter')
      .attr('id', 'route-cast')
      .attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%')
      .append('feDropShadow')
      .attr('dx', 0).attr('dy', 0.55).attr('stdDeviation', 0.7)
      .attr('flood-color', isLight ? '#6b5a3a' : '#000')
      .attr('flood-opacity', isLight ? 0.3 : 0.55)

    // ── Elevation contours. Under everything: they are ground, not content.
    // The Jordan Rift is the fact this map most needed to show — the Dead Sea
    // shore is the lowest land on earth, and Jericho to Jerusalem climbs about
    // 1000 m in 24 km, which is why the Gospels always say *up* to Jerusalem.
    // Sub-sea levels are cut to the rift box at build time; unrestricted they
    // trace the Mediterranean seabed.
    if (terrain?.levels) {
      const contourG = mapG.append('g').attr('class', 'map-contours')
      terrain.levels.forEach(({ level, lines }) => {
        if (!lines?.length) return
        contourG.append('path')
          .attr('class', 'map-contour')
          .attr('data-level', level)
          .attr('d', pathGen({ type: 'MultiLineString', coordinates: lines }))
          .attr('fill', 'none')
          .attr('stroke', isLight ? '#a8987c' : '#2f5340')
          // Sea-level reads as a shoreline and earns a little more weight than
          // the bands above and below it.
          .attr('stroke-width', level === 0 ? 0.5 : 0.35)
          .attr('stroke-linejoin', 'round')
          .attr('stroke-opacity', 0)   // zoom decides; see applyZoomStyling
      })
    }

    // ── Inland water — the Sea of Galilee, the Dead Sea, the Jordan.
    // Filled with the sea tone so the lake reads as the same substance as the
    // Mediterranean, and outlined with the coast stroke so its edge carries the
    // same weight as the coastline. See scripts/build-water.mjs for what is
    // reconstruction and what is observation.
    if (water) {
      const waterG = mapG.append('g').attr('class', 'map-water')
      water.lakes?.forEach(lake => {
        waterG.append('path')
          .attr('class', 'map-lake')
          .attr('data-lake', lake.id)
          .attr('d', pathGen({ type: 'Polygon', coordinates: lake.rings }))
          .attr('fill', isLight ? '#c3d3dd' : '#0d2233')
          .attr('fill-opacity', 0.95)
          .attr('stroke', isLight ? '#8fa4b4' : '#4a7159')
          .attr('stroke-width', 1.1)
          .attr('stroke-opacity', 0.9)
      })
      water.rivers?.forEach(river => {
        waterG.append('path')
          .attr('class', 'map-river')
          .attr('data-river', river.id)
          .attr('d', pathGen({ type: 'MultiLineString', coordinates: river.lines }))
          .attr('fill', 'none')
          .attr('stroke', isLight ? '#93aec2' : '#2f5f74')
          .attr('stroke-width', 0.8)
          .attr('stroke-opacity', 0.85)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')
      })
    }

    // ── Country borders
    mapG.append('path')
      .datum(borders)
      .attr('d', pathGen)
      .attr('class', 'map-borders')
      .attr('fill', 'none')
      .attr('stroke', isLight ? '#9aacb8' : '#243f30')
      .attr('stroke-width', 0.5)
      .attr('stroke-opacity', 0.7)

    // ── Province fills, borders, labels
    if (provincesGeo && showProvinces) {
      mapG.append('g')
        .selectAll('path')
        .data(provincesGeo.features)
        .join('path')
        .attr('d', pathGen)
        .attr('fill', d => visitedIds.has(normalizeProvinceName(d.properties.name)) ? '#c9a84c' : (isLight ? '#7a6a50' : '#a09a8e'))
        .attr('fill-opacity', d => visitedIds.has(normalizeProvinceName(d.properties.name)) ? (isLight ? 0.11 : 0.055) : (isLight ? 0.045 : 0.028))
        .attr('stroke', 'none')

      mapG.append('g')
        .selectAll('path')
        .data(provincesGeo.features)
        .join('path')
        .attr('class', 'province-border')
        .attr('d', pathGen)
        .attr('fill', 'none')
        .attr('stroke', '#c9a84c')
        .attr('stroke-width', 0.9)
        .attr('stroke-dasharray', '3 2.6')
        .attr('stroke-linecap', 'round')
        .attr('stroke-opacity', 0.4)

      const provLabelG = mapG.append('g').attr('pointer-events', 'none')
      provincesGeo.features.forEach(feature => {
        let centroid
        try { centroid = pathGen.centroid(feature) } catch { return }
        if (!centroid || isNaN(centroid[0]) || isNaN(centroid[1])) return
        if (centroid[0] < 0 || centroid[0] > W || centroid[1] < 0 || centroid[1] > H) return
        provLabelG.append('text')
          .attr('class', 'province-label')
          .attr('x', centroid[0])
          .attr('y', centroid[1])
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-family', 'Cinzel, serif')
          .attr('font-size', 15 / kRef.current)
          .attr('letter-spacing', 1.6 / kRef.current)
          .attr('fill', isLight ? '#6a5830' : '#c9a84c')
          // Region names were 9px at 0.3 fill-opacity, rendering ~6.8 screen px —
          // smaller than the city labels sitting inside them, which is backwards.
          // Now set above tier-1 cities and letterspaced, the usual treatment for
          // an area label; the opacity was hurting as much as the size.
          .attr('fill-opacity', isLight ? 0.66 : 0.6)
          .attr('paint-order', 'stroke')
          .attr('stroke', haloColor)
          .attr('stroke-opacity', 0.6)
          .attr('stroke-linejoin', 'round')
          .text(feature.properties.name)
        // Ruler sublabel — the AD 29–33 political reality under the region name
        if (feature.properties.ruler) {
          provLabelG.append('text')
            .attr('class', 'province-sub')
            .attr('x', centroid[0])
            .attr('data-y0', centroid[1])
            .attr('y', centroid[1] + 16 / kRef.current)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-family', 'Cormorant Garamond, serif')
            .attr('font-style', 'italic')
            .attr('font-size', 11 / kRef.current)
            .attr('fill', isLight ? '#6a5830' : '#c9a84c')
            .attr('fill-opacity', isLight ? 0.52 : 0.46)
            .attr('paint-order', 'stroke')
            .attr('stroke', haloColor)
            .attr('stroke-opacity', 0.55)
            .attr('stroke-linejoin', 'round')
            .text(feature.properties.ruler)
        }
      })
    }

    // ── Era roads: the Via Maris (coast → Jezreel → Galilee) and the
    // Jordan-valley pilgrim road (Galilee → Jericho → Jerusalem, the route
    // Galilean pilgrims took to skirt Samaria).
    const ERA_ROADS = [
      {
        label: 'VIA MARIS',
        labelIdx: 1,
        pts: [[34.90, 32.50], [35.18, 32.60], [35.53, 32.82]],
      },
      {
        label: 'JORDAN ROAD',
        labelIdx: 2,
        pts: [[35.57, 32.88], [35.55, 32.40], [35.50, 32.00], [35.46, 31.87], [35.28, 31.83], [35.23, 31.78]],
      },
    ]
    const roadG = mapG.append('g').attr('pointer-events', 'none')
    ERA_ROADS.forEach(road => {
      const proj = road.pts.map(c => projection(c))
      roadG.append('path')
        .attr('class', 'era-road')
        .attr('d', `M ${proj.map(p => p.join(',')).join(' L ')}`)
        .attr('fill', 'none')
        .attr('stroke', '#c9a84c')
        .attr('stroke-width', 0.8)
        .attr('stroke-opacity', 0.25)
        .attr('stroke-dasharray', '6 4')
        .attr('stroke-linecap', 'round')
      const midPt = proj[road.labelIdx]
      roadG.append('text')
        .attr('class', 'road-label')
        .attr('x', midPt[0])
        .attr('y', midPt[1] - 7)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Cinzel, serif')
        .attr('font-size', 9)
        .attr('letter-spacing', 3)
        .attr('fill', '#c9a84c')
        .attr('fill-opacity', 0.35)
        .attr('paint-order', 'stroke')
        .attr('stroke', haloColor)
        .attr('stroke-opacity', 0.4)
        .attr('stroke-linejoin', 'round')
        .text(road.label)
    })

    // ── Journey lines
    const linesG = mapG.append('g')

    const selectedBook = selectedBookId
      ? journeyData.books.find(b => b.id === selectedBookId)
      : null

    journeyData.journeys.forEach(journey => {
      const colors = JOURNEY_MAP[journey.id]
      if (!colors) return

      const isActive      = activeJourneys.has(journey.id)
      const isBookJourney = selectedBook && journey.id === selectedBook.journeyId

      let baseOpacity
      if (selectedBook) {
        baseOpacity = isBookJourney ? 0.3 : 0
      } else {
        baseOpacity = isActive ? 0.85 : 0
      }

      // Casing in a darker cast of the route's own hue. It used to be near-black
      // (#06110b at 0.85 under a 2px line), which reads as a sticker cut out and
      // laid on the map — and where two routes cross, one route's black rim
      // slices through the other's colour. Six converge on Capernaum and the
      // rims stacked into a blob. A hue-matched casing still lifts the route off
      // the terrain but keeps it reading as one object.
      // Toward the ground in both themes: darker than the route on the dark map,
      // paler than it on the parchment one.
      const caseColor = tint(colors.primary, isLight ? '#f5f0e8' : '#08150e', 0.55)

      const waypoints = journey.waypoints
        .filter((wp, i) => i === 0 || wp.cityId !== journey.waypoints[i - 1].cityId)
        .filter(wp => cityById[wp.cityId])

      if (waypoints.length < 2) return

      // Spine — invisible geometry carrier for arc lengths, sampling, and the Paul marker
      const spine = linesG.append('path')
        .attr('class', 'journey-spine')
        .datum(waypoints)
        .attr('d', lineGen)
        .attr('fill', 'none')
        .attr('stroke', 'none')

      const node  = spine.node()
      const total = node.getTotalLength()
      const wpLengths = waypointArcLengths(
        node,
        waypoints.map(wp => projection(cityById[wp.cityId].coords)),
        total,
      )

      // Visible route: one sampled sub-path per waypoint pair — sea legs dashed,
      // land legs solid over a casing; period-6 (Resurrection) stays dashed throughout
      const caseG = linesG.append('g').attr('filter', 'url(#route-cast)')
      const segG  = linesG.append('g')
      const hiG   = linesG.append('g')
      const segs = []
      const dStrings = []
      for (let i = 0; i < waypoints.length - 1; i++) {
        const l0 = wpLengths[i], l1 = wpLengths[i + 1]
        if (l1 - l0 < 0.5) { dStrings.push(null); continue }
        const d = samplePath(node, l0, l1)
        dStrings.push(d)
        const segLen = l1 - l0
        const dash = journey.id === 'period-6'
          ? [8, 5]
          : segModes[`${journey.id}:${i}`] === 'sea' ? [4, 3.2] : null
        let caseEl = null
        if (!dash) {
          caseEl = caseG.append('path')
            .attr('class', 'journey-case')
            .attr('d', d)
            .attr('fill', 'none')
            .attr('stroke', caseColor)
            .attr('stroke-width', 3.4)
            .attr('stroke-opacity', 0.9)
            .attr('stroke-linecap', 'round')
            .attr('stroke-linejoin', 'round')
            .attr('stroke-dasharray', `${segLen} ${segLen}`)
            .node()
        }
        // Lit top edge — the same path redrawn thinner, lighter, and nudged up
        // half a unit. With the casing below and the body between, the three
        // strokes read as a rounded section rather than a flat ribbon. Skipped on
        // dashed legs, where the offset copy shows through the gaps as a double
        // line rather than a highlight.
        let hiEl = null
        if (!dash) {
          hiEl = hiG.append('path')
            .attr('class', 'journey-hi')
            .attr('d', d)
            .attr('fill', 'none')
            .attr('stroke', tint(colors.primary, isLight ? '#3a2f22' : '#f4f2e4', 0.5))
            .attr('stroke-width', 0.85)
            .attr('stroke-linecap', 'round')
            .attr('stroke-linejoin', 'round')
            .attr('stroke-dasharray', `${segLen} ${segLen}`)
            .attr('transform', 'translate(0,-0.45)')
            .node()
        }

        const el = segG.append('path')
          .attr('class', 'journey-line')
          .attr('data-journey', journey.id)
          .attr('data-mode', dash ? (journey.id === 'period-6' ? 'traditional' : 'sea') : 'land')
          .attr('data-leg', `${waypoints[i].cityId}->${waypoints[i + 1].cityId}`)
          .attr('d', d)
          .attr('fill', 'none')
          .attr('stroke', colors.primary)
          .attr('stroke-width', 2)
          .attr('stroke-linecap', dash ? 'butt' : 'round')
          .attr('stroke-linejoin', 'round')
        if (!dash) el.attr('stroke-dasharray', `${segLen} ${segLen}`)
        segs.push({ el: el.node(), caseEl, hiEl, l0, l1, dash })
      }

      // Direction-of-travel chevrons, skipping the immediate vicinity of stops
      const chevG = linesG.append('g').attr('pointer-events', 'none')
      const chevrons = []
      for (let l = 48; l < total - 20; l += 85) {
        if (wpLengths.some(wl => Math.abs(wl - l) < 16)) continue
        const p  = node.getPointAtLength(l)
        const p2 = node.getPointAtLength(Math.min(total, l + 2))
        const angle = Math.atan2(p2.y - p.y, p2.x - p.x) * 180 / Math.PI
        const chev = chevG.append('path')
          .attr('class', 'route-chevron')
          .attr('d', 'M -3.4 -2.8 L 2.4 0 L -3.4 2.8')
          .attr('fill', 'none')
          // Lighter than the line it sits on — same hue and weight made these read
          // as bumps in the route rather than direction markers. Tinted toward
          // the theme's ink rather than d3's brighter(), which scales RGB and
          // drove the gold route's chevrons to a near-neon #fffd73.
          .attr('stroke', tint(colors.primary, isLight ? '#2a2420' : '#eef0e2', 0.45))
          .attr('stroke-width', 1.05)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')
          .attr('opacity', 0)
        chev.node().dataset.x = p.x.toFixed(2)
        chev.node().dataset.y = p.y.toFixed(2)
        chev.node().dataset.a = angle.toFixed(1)
        chevrons.push({ el: chev.node(), len: l })
      }

      const jd = { node, total, wps: waypoints, wpLengths, colors, baseOpacity, segs, chevrons,
                   segG: segG.node(), caseG: caseG.node(), hiG: hiG.node() }
      lineDataRef.current[journey.id] = jd

      // Initial reveal for the current scrub year (or full route when idle)
      const st = revealStateFor(journey, jd, timelineYearRef.current, isActive)
        ?? { len: total, op: baseOpacity }
      applyRevealState(jd, st.len, st.op)

      // Invisible per-segment hit targets for distance hover
      if (isActive && baseOpacity > 0) {
        for (let i = 0; i < waypoints.length - 1; i++) {
          const cityA = cityById[waypoints[i].cityId]
          const cityB = cityById[waypoints[i + 1].cityId]
          if (!cityA || !cityB) continue
          const segWps = [waypoints[i], waypoints[i + 1]]
          linesG.append('path')
            .attr('class', 'seg-hit')
            .attr('d', dStrings[i] ?? lineGen(segWps))
            .attr('fill', 'none')
            .attr('stroke', 'transparent')
            .attr('stroke-width', 12)
            .attr('cursor', 'crosshair')
            .on('mouseover', function(event) {
              const rect = containerRef.current?.getBoundingClientRect()
              if (!rect) return
              const km = haversineKm(cityA.coords, cityB.coords)
              setSegmentTip({
                from: cityA.name,
                to:   cityB.name,
                km,
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
              })
            })
            .on('mousemove', function(event) {
              const rect = containerRef.current?.getBoundingClientRect()
              if (!rect) return
              setSegmentTip(t => t ? { ...t, x: event.clientX - rect.left, y: event.clientY - rect.top } : t)
            })
            .on('mouseout', function() {
              setSegmentTip(null)
            })
        }
      }

      if (isBookJourney && selectedBook) {
        const segStart  = selectedBook.dateRange[0] - 0.5
        const segEnd    = selectedBook.dateRange[1] + 0.5
        const beforeIdx = waypoints.reduce((acc, wp, i) => wp.year <= segStart ? i : acc, -1)
        const afterIdx  = waypoints.findIndex(wp => wp.year >= segEnd)
        const startIdx  = Math.max(0, beforeIdx)
        const endIdx    = afterIdx === -1 ? waypoints.length - 1 : afterIdx
        const segWps    = waypoints.slice(startIdx, endIdx + 1)

        if (segWps.length >= 2) {
          const segEl = linesG.append('path')
            .datum(segWps)
            .attr('d', lineGen)
            .attr('fill', 'none')
            .attr('stroke', colors.primary)
            .attr('stroke-width', 3.5)
            .attr('stroke-opacity', isActive ? 0.9 : 0.5)
            .attr('stroke-linecap', 'round')
            .attr('stroke-linejoin', 'round')
          if (journey.id === 'period-6') segEl.attr('stroke-dasharray', '8 5')
        }
      }
    })

    // ── Letter route arc
    if (selectedBook) {
      const fromCity = cityById[selectedBook.writingLocationId]
      const toCity   = selectedBook.recipientCityIds.length > 0
        ? cityById[selectedBook.recipientCityIds[0]]
        : null

      if (fromCity && toCity && fromCity.id !== toCity.id) {
        const [x1, y1] = projection(fromCity.coords)
        const [x2, y2] = projection(toCity.coords)
        const mx = (x1 + x2) / 2
        const my = Math.min(y1, y2) - 40

        const arcG      = mapG.append('g').attr('pointer-events', 'none')
        const routePath = arcG.append('path')
          .attr('d', `M ${x1},${y1} Q ${mx},${my} ${x2},${y2}`)
          .attr('fill', 'none')
          .attr('stroke', '#e9c86c')
          .attr('stroke-width', 2.5)
          .attr('stroke-linecap', 'round')

        const totalLength = routePath.node().getTotalLength()
        routePath
          .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
          .attr('stroke-dashoffset', totalLength)
          .transition()
          .duration(1800)
          .ease(d3.easeQuadInOut)
          .attr('stroke-dashoffset', 0)
      }
    }

    // ── City glow rings (writing & recipient)
    const glowG = mapG.append('g').attr('pointer-events', 'none')

    if (selectedBook) {
      const writingCity = cityById[selectedBook.writingLocationId]
      if (writingCity) {
        const [wx, wy] = projection(writingCity.coords)
        glowG.append('circle')
          .attr('cx', wx).attr('cy', wy).attr('r', 18)
          .attr('fill', 'none')
          .attr('stroke', '#e9c86c').attr('stroke-width', 1)
          .attr('class', 'writing-glow-outer')
        glowG.append('circle')
          .attr('cx', wx).attr('cy', wy).attr('r', 12)
          .attr('fill', 'none')
          .attr('stroke', '#e9c86c').attr('stroke-width', 2)
          .attr('class', 'writing-glow')
      }

      selectedBook.recipientCityIds.forEach(cityId => {
        const city = cityById[cityId]
        if (!city) return
        const [rx, ry] = projection(city.coords)
        glowG.append('circle')
          .attr('cx', rx).attr('cy', ry).attr('r', 12)
          .attr('fill', 'none')
          .attr('stroke', '#4A7C6F').attr('stroke-width', 2)
          .attr('class', 'recipient-glow')
      })
    }

    // ── City dots + labels
    const dotsG = mapG.append('g')
    const labsG = mapG.append('g').attr('pointer-events', 'none')

    // Cities visited by any currently-active journey, or the selected book's journey
    const relevantJourneyIds = new Set([
      ...activeJourneys,
      ...(selectedBook ? [selectedBook.journeyId] : []),
    ])
    const activeCityIds = new Set(
      journeyData.journeys
        .filter(j => relevantJourneyIds.has(j.id))
        .flatMap(j => j.waypoints.map(w => w.cityId))
    )

    const usedIds = new Set(
      journeyData.journeys.flatMap(j => j.waypoints.map(w => w.cityId))
    )
    const seen = new Set()
    const cities = journeyData.cities.filter(c => {
      if (!usedIds.has(c.id) || seen.has(c.id)) return false
      seen.add(c.id)
      return true
    }).sort((a, b) => a.tier - b.tier)

    const placedBoxes = []

    cities.forEach(city => {
      const pt = projection(city.coords)
      if (!pt) return
      const [x, y] = pt
      if (x < -20 || x > W + 20 || y < -20 || y > H + 20) return

      const isActive = activeCityIds.has(city.id) && (!lensCityIds || lensCityIds.has(city.id))

      const r    = city.tier === 1 ? 5 : city.tier === 2 ? 3.5 : 2.25
      const fill = isActive ? (city.tier === 1 ? '#c9a84c' : '#a09a8e') : 'none'
      const fo   = isActive ? (city.tier === 1 ? 1 : city.tier === 2 ? 0.75 : 0.55) : 0

      const sw = isActive ? (city.tier === 1 ? 1 : 0.5) : 0.5
      dotsG.append('circle')
        .attr('class', 'city-dot')
        .attr('data-city', city.id)
        .attr('data-r0', r)
        .attr('data-sw0', sw)
        .attr('cx', x).attr('cy', y).attr('r', r)
        .attr('fill', fill).attr('fill-opacity', fo)
        .attr('stroke', isActive ? '#060d1a' : '#a09a8e')
        .attr('stroke-width', sw)
        .attr('stroke-opacity', isActive ? 1 : 0.15)
        .attr('cursor', isActive ? 'pointer' : 'default')
        .on('mouseover', function(event) {
          if (!isActive) return
          const rect = containerRef.current?.getBoundingClientRect()
          if (!rect) return
          setTooltipCity(city)
          setTooltipPos({ x: event.clientX - rect.left, y: event.clientY - rect.top })
          onCityHover?.(city.id)
        })
        .on('mousemove', function(event) {
          if (!isActive) return
          const rect = containerRef.current?.getBoundingClientRect()
          if (!rect) return
          setTooltipPos({ x: event.clientX - rect.left, y: event.clientY - rect.top })
        })
        .on('mouseout', function() {
          setTooltipCity(null)
          onCityHover?.(null)
        })

      if (!isActive) return

      if (city.tier === 1) {
        const off = ANCHOR_OFFSETS[city.labelAnchor] ?? ANCHOR_OFFSETS['right']
        const lx = x + off.dx, ly = y + off.dy
        labsG.append('text')
          .attr('class', 'city-label label-t1')
          .attr('x', lx).attr('y', ly)
          .attr('text-anchor', off.ta)
          .attr('font-family', 'Cinzel, serif')
          .attr('font-size', 13)
          .attr('fill', '#c9a84c')
          .attr('fill-opacity', 0.85)
          .attr('paint-order', 'stroke')
          .attr('stroke', haloColor)
          .attr('stroke-opacity', 0.75)
          .attr('stroke-linejoin', 'round')
          .text(city.name)
        placedBoxes.push(labelBox(lx, ly, city.name, 13, off.ta))
      }

      if (city.tier === 2) {
        const { lx, ly, ta } = greedyLabelPos(x, y, city.name, 11, placedBoxes)
        labsG.append('text')
          .attr('class', 'city-label label-t2')
          .attr('x', lx).attr('y', ly)
          .attr('text-anchor', ta)
          .attr('font-family', 'Cinzel, serif')
          .attr('font-size', 11)
          .attr('fill', '#c9a84c')
          .attr('fill-opacity', 0.75)
          .attr('paint-order', 'stroke')
          .attr('stroke', haloColor)
          .attr('stroke-opacity', 0.65)
          .attr('stroke-linejoin', 'round')
          .attr('opacity', 0)
          .text(city.name)
        placedBoxes.push(labelBox(lx, ly, city.name, 11, ta))
      }

      if (city.tier === 3) {
        const { lx, ly, ta } = greedyLabelPos(x, y, city.name, 9, placedBoxes)
        labsG.append('text')
          .attr('class', 'city-label label-t3')
          .attr('x', lx).attr('y', ly)
          .attr('text-anchor', ta)
          .attr('font-family', 'Cinzel, serif')
          .attr('font-size', 9)
          .attr('fill', '#a09a8e')
          .attr('fill-opacity', 0.7)
          .attr('paint-order', 'stroke')
          .attr('stroke', haloColor)
          .attr('stroke-opacity', 0.65)
          .attr('stroke-linejoin', 'round')
          .attr('opacity', 0)
          .text(city.name)
        placedBoxes.push(labelBox(lx, ly, city.name, 9, ta))
      }
    })

    // ── Paul marker — comet head at the reveal front (positioned by the
    // progressive effect; initial position replayed here for re-renders mid-scrub)
    const markerG = mapG.append('g')
      .attr('class', 'paul-marker')
      .attr('display', 'none')
      .attr('pointer-events', 'none')
    markerG.append('circle')
      .attr('class', 'paul-marker-halo')
      .attr('r', 7).attr('fill', '#e9c86c').attr('fill-opacity', 0.22)
    markerG.append('circle')
      .attr('class', 'paul-marker-core')
      .attr('r', 2.8).attr('fill', '#e9c86c')
      .attr('stroke', '#060d1a').attr('stroke-width', 0.9)
    paulMarkerRef.current = markerG.node()

    const yearNow = timelineYearRef.current
    if (yearNow !== null) {
      for (const journey of journeyData.journeys) {
        const jd2 = lineDataRef.current[journey.id]
        if (!jd2 || !activeJourneys.has(journey.id)) continue
        if (yearNow >= journey.dateRange[0] && yearNow < journey.dateRange[1]) {
          const stM = revealStateFor(journey, jd2, yearNow, true)
          if (stM) {
            const p = jd2.node.getPointAtLength(stM.len)
            markerG.attr('display', null).attr('transform', `translate(${p.x},${p.y})`)
          }
          break
        }
      }
    }

    applyZoomStyling(mapGRef.current, kRef.current)

  }, [projection, pathGen, land, borders, water, terrain, provincesGeo, showProvinces, activeJourneys, selectedBookId, cityById, visitedIds, lineGen, theme, isLight, segModes, lensCityIds])

  // ── Progressive reveal — synchronized to timelineYear ─────────────────
  useEffect(() => {
    const mapG = d3.select(mapGRef.current)

    // ── City dot visibility
    const cityFirstYear = {}
    if (timelineYear !== null) {
      journeyData.journeys.forEach(journey => {
        if (!activeJourneys.has(journey.id)) return
        journey.waypoints.forEach(wp => {
          if (!cityFirstYear[wp.cityId] || wp.year < cityFirstYear[wp.cityId])
            cityFirstYear[wp.cityId] = wp.year
        })
      })
    }

    mapG.selectAll('.city-dot').each(function() {
      const cityId = d3.select(this).attr('data-city')
      const city   = cityById[cityId]
      if (!city) return
      const full = city.tier === 1 ? 1 : city.tier === 2 ? 0.75 : 0.55
      if (timelineYear === null) {
        d3.select(this).attr('fill-opacity', full)
        return
      }
      const fy      = cityFirstYear[cityId]
      const reached = fy !== undefined && fy <= timelineYear
      d3.select(this).attr('fill-opacity', reached ? full : full * 0.2)
    })

    // ── Journey line reveal (per-segment: solid legs via dashoffset,
    // dashed sea/period-6 legs via constructed dasharray)
    let paulPos = null
    journeyData.journeys.forEach(journey => {
      const jd = lineDataRef.current[journey.id]
      if (!jd) return
      const isActive = activeJourneys.has(journey.id)
      const st = revealStateFor(journey, jd, timelineYear, isActive)
      if (st) applyRevealState(jd, st.len, st.op)

      // Paul rides the reveal front of the journey containing the current year
      if (st && isActive && timelineYear !== null &&
          timelineYear >= journey.dateRange[0] && timelineYear < journey.dateRange[1]) {
        const p = jd.node.getPointAtLength(st.len)
        paulPos = [p.x, p.y]
      }
    })

    if (paulMarkerRef.current) {
      const m = d3.select(paulMarkerRef.current)
      if (paulPos) m.attr('display', null).attr('transform', `translate(${paulPos[0]},${paulPos[1]})`)
      else m.attr('display', 'none')
    }

    // ── Map pan to follow Paul during play (throttled)
    if (isPlaying && timelineYear !== null) {
      const now = performance.now()
      if (now - lastPanRef.current > 250 && zoomRef.current && svgRef.current) {
        lastPanRef.current = now
        const loc = getPaulLocationAtYear(timelineYear, cityById)
        if (loc) {
          const [px, py] = projection(loc)
          const targetK  = getPlayZoom(loc)
          const tx = W / 2 - px * targetK
          const ty = H * 0.38 - py * targetK
          d3.select(svgRef.current)
            .transition('pan').duration(600).ease(d3.easeQuadOut)
            .call(zoomRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(targetK))
        }
      }
    }

  }, [timelineYear, activeJourneys, isPlaying, cityById, projection])

  // ── Journey bounds zoom — fires when detailJourneyId changes ──────────
  const homeTransformRef = useRef(null)
  const prevDetailRef = useRef(detailJourneyId)
  useEffect(() => {
    const prevDetail = prevDetailRef.current
    prevDetailRef.current = detailJourneyId
    if (!zoomRef.current || !svgRef.current) return

    if (detailJourneyId === null) {
      // Only undo an actual drill-down. This branch also ran on mount, where it
      // transitioned the map straight back to identity and wiped the curated
      // `initialFocus` the mount effect had applied a few lines earlier — so the
      // atlas opened on the full dark strip at k=1, the exact thing initialFocus
      // exists to avoid, rather than framed on the opening period at k=2.
      // Guarding on "first run" is not enough: StrictMode double-invokes the
      // effect and refs survive between the two, so the second pass reset it
      // anyway. Comparing against the previous value is what actually holds.
      if (prevDetail === null) return
      // Back to the opening frame, not to identity — "Overview" should return
      // you where the atlas started, and identity is a view it never shows.
      d3.select(svgRef.current)
        .transition('zoom-to-journey').duration(800).ease(d3.easeCubicInOut)
        .call(zoomRef.current.transform, homeTransformRef.current ?? d3.zoomIdentity)
      return
    }

    const journey = journeyData.journeys.find(j => j.id === detailJourneyId)
    if (!journey) return

    const coords = journey.waypoints
      .map(wp => cityById[wp.cityId]?.coords)
      .filter(Boolean)
    if (coords.length === 0) return

    const lons = coords.map(c => c[0])
    const lats = coords.map(c => c[1])
    // Margin is a share of the period's own extent. It used to be a flat ±2°,
    // inherited from Paul's world where a journey spanned the Mediterranean and
    // two degrees was a modest frame. Gospel periods span 0.03° to 1.1°, so the
    // padding swamped the subject: every period resolved to k≈0.5 regardless of
    // size, which meant clicking a bar to *drill in* zoomed further out than the
    // atlas's own opening view. The floor keeps a single-city period sane.
    const padLon = Math.max((Math.max(...lons) - Math.min(...lons)) * 0.12, 0.012)
    const padLat = Math.max((Math.max(...lats) - Math.min(...lats)) * 0.12, 0.012)

    const [x0, y0] = projection([Math.min(...lons) - padLon, Math.max(...lats) + padLat])
    const [x1, y1] = projection([Math.max(...lons) + padLon, Math.min(...lats) - padLat])
    const raw = 0.9 / Math.max((x1 - x0) / W, (y1 - y0) / H)
    const scale = Math.max(K_MIN, Math.min(K_AUTO_MAX, raw))
    const tx = W / 2 - scale * (x0 + x1) / 2
    const ty = H / 2 - scale * (y0 + y1) / 2

    d3.select(svgRef.current)
      .transition('zoom-to-journey').duration(800).ease(d3.easeCubicInOut)
      .call(zoomRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(scale))

  }, [detailJourneyId, projection, cityById])

  // ── Timeline stop hover → glow city dot on map ────────────────────────
  useEffect(() => {
    if (!mapGRef.current) return
    const g = d3.select(mapGRef.current)

    g.selectAll('.city-dot').each(function() {
      const el     = d3.select(this)
      const cityId = el.attr('data-city')
      const isHovered = cityId === hoveredCityId

      if (isHovered) {
        el.raise()
          .transition('glow').duration(120)
          .attr('r', function() { return parseFloat(el.attr('r')) * 1.0 }) // preserve r, just trigger filter
          .attr('filter', 'url(#city-glow)')
          .attr('stroke', '#c9a84c')
          .attr('stroke-width', 2)
          .attr('stroke-opacity', 1)
      } else {
        el.transition('glow').duration(200)
          .attr('filter', null)
          .attr('stroke', '#060d1a')
          .attr('stroke-width', el.attr('data-city') ? 0.5 : 0.5)
          .attr('stroke-opacity', 1)
      }
    })
  }, [hoveredCityId])

  return (
    <div ref={containerRef} className="map-svg-wrapper" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio={`xMidYMid ${fitMode}`}
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <filter id="city-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width={W} height={H} fill={isLight ? '#b8c8d4' : '#060d1a'} />
        <g ref={mapGRef} />
      </svg>

      {/* Scale bar — fixed 50 km reference, bottom-right */}
      <ScaleBar projection={projection} theme={theme} fitMode={fitMode} />

      {segmentTip && !tooltipCity && (
        <div className="city-tooltip" style={{
          position: 'absolute',
          left: segmentTip.x + 16,
          top:  segmentTip.y - 12,
          pointerEvents: 'none',
        }}>
          <div className="city-tooltip__name" style={{ fontSize: 11 }}>
            {segmentTip.from} → {segmentTip.to}
          </div>
          <div className="city-tooltip__desc" style={{ fontSize: 13, marginBottom: 0 }}>
            ~{segmentTip.km.toLocaleString()} km
          </div>
        </div>
      )}

      {tooltipCity && (
        <div className="city-tooltip" style={{
          position: 'absolute',
          left: tooltipPos.x + 16,
          top:  tooltipPos.y - 12,
          pointerEvents: 'none',
        }}>
          <div className="city-tooltip__name">{tooltipCity.name}</div>
          {tooltipCity.modernName && (
            <div className="city-tooltip__modern">{tooltipCity.modernName}</div>
          )}
          <div className="city-tooltip__desc">{tooltipCity.description}</div>
          {tooltipCity.ref && (
            <div className="city-tooltip__ref">{tooltipCity.ref}</div>
          )}
        </div>
      )}
    </div>
  )
}
