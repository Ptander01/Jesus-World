#!/usr/bin/env node
/**
 * Builds src/data/site-plans.json — schematic town plans for the Gospels sites.
 *
 *   node scripts/build-site-plans.mjs
 *
 * WHY THESE ARE NOT ON THE MAP. A viewBox unit is 428 m at this projection, so
 * Capernaum's 300 m of shore is 0.7 units: 22 px wide at the k=32 ceiling. A
 * readable plan needs about k=430, and there the basemap (Natural Earth 10m),
 * the hillshade (150 m/px) and the contours are all an order of magnitude past
 * their own resolution. Town plans therefore live at their own scale, entered
 * from a place, the way JerusalemDiagram already works — and each carries a
 * metre scale bar and its true footprint so drawing it large never implies it
 * was large.
 *
 * WHAT THEY ARE. Layouts are laid out procedurally in metres from a handful of
 * declared parameters, then rendered as line art. Footprint dimensions and the
 * named landmarks are real and sourced per site. The street grid and the
 * individual blocks are NOT: they are an honest illustration of density and
 * arrangement, not a survey, and every plan says so on its face. That line
 * matters here — this atlas refuses to ship a Dead Sea shoreline that fails its
 * own check, so an invented street grid must not be able to pass as one.
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT  = join(ROOT, 'src/data/site-plans.json')

// Deterministic jitter — a perfect grid reads as a modern town, and a random
// one changes every build. Same seed, same plan, every time.
const rng = seed => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const SITES = [
  {
    id: 'capernaum', name: 'Capernaum', modern: 'Tell Hum',
    footprint: [320, 170], hectares: 6, people: '~1,500',
    shore: 'south',
    basis: 'Excavated extent runs roughly 300 m along the lakeshore. The synagogue (4th-c. white limestone on 1st-c. basalt foundations) and the insula beneath the octagonal church — the "house of Peter" — are located; the surrounding block plan is illustration.',
    landmarks: [
      { id: 'synagogue', label: 'Synagogue', sub: 'White limestone on basalt footings', x: -20, y: -35, w: 40, h: 26, kind: 'major' },
      { id: 'peters-house', label: "The insula church", sub: 'Octagon over a 1st-c. house', x: 34, y: 4, w: 26, h: 26, kind: 'major' },
      { id: 'harbour', label: 'Harbour', sub: 'Breakwater along the shore', x: -60, y: 68, w: 150, h: 12, kind: 'water' },
    ],
    seed: 11,
  },
  {
    id: 'nazareth', name: 'Nazareth', modern: 'Nazareth, Israel',
    footprint: [190, 150], hectares: 4, people: '~400',
    basis: 'A small agricultural village in the first century — the excavated remains are houses, silos, cisterns and rock-cut tombs on the hill slope. No public buildings are attested. The arrangement here is illustration.',
    landmarks: [
      { id: 'springs', label: "Mary's Well", sub: 'The village spring', x: 58, y: -46, w: 16, h: 16, kind: 'water' },
      { id: 'tombs', label: 'Rock-cut tombs', sub: 'Outside the village', x: -70, y: 52, w: 44, h: 18, kind: 'minor' },
    ],
    seed: 23,
  },
  {
    id: 'magdala', name: 'Magdala', modern: 'Migdal',
    footprint: [300, 190], hectares: 5, people: '~1,000',
    shore: 'east',
    basis: 'Excavation has exposed a 1st-c. synagogue with a carved stone, a harbour with mooring stones, a market and ritual baths. Block layout beyond those is illustration.',
    landmarks: [
      { id: 'synagogue', label: 'Synagogue', sub: 'First century, with the carved stone', x: -46, y: -30, w: 34, h: 28, kind: 'major' },
      { id: 'harbour', label: 'Harbour', sub: 'Mooring stones still in place', x: 96, y: -20, w: 14, h: 120, kind: 'water' },
      { id: 'baths', label: 'Ritual baths', sub: 'Spring-fed miqva’ot', x: -18, y: 44, w: 26, h: 18, kind: 'minor' },
    ],
    seed: 37,
  },
  {
    // Jerusalem is a different kind of entry from the villages. Almost every
    // feature here is individually attested — excavated, or still standing — so
    // the plan carries a per-landmark `tier` rather than one blanket caveat, and
    // it gets no procedural blocks at all. Inventing an insula grid for a city
    // this well studied would be adding noise to evidence.
    id: 'jerusalem', name: 'Jerusalem', modern: 'Jerusalem',
    footprint: [1000, 900], hectares: 90, people: '~40,000',
    noBlocks: true,
    basis: 'Roughly 90 hectares inside Herod\u2019s walls, perhaps 40,000 people — a hundred times Nazareth on twenty times the ground. Individual features are marked by how well each is known. The Ottoman Old City wall, built in 1538, is deliberately not drawn: it does not follow the first-century line.',
    landmarks: [
      { id: 'temple-mount', label: 'The Temple Mount', sub: "Herod's platform \u2014 walls still standing", x: 150, y: -150, w: 200, h: 310, kind: 'major', tier: 'extant' },
      { id: 'antonia', label: 'Antonia Fortress', sub: 'Position known, plan debated', x: 150, y: -350, w: 90, h: 70, kind: 'minor', tier: 'reconstructed' },
      { id: 'upper-city', label: 'The Upper City', sub: 'Herodian mansions, excavated', x: -230, y: -40, w: 260, h: 240, kind: 'major', tier: 'excavated' },
      { id: 'herods-palace', label: "Herod's Palace", sub: 'Phasael\u2019s tower base survives', x: -350, y: -170, w: 110, h: 130, kind: 'major', tier: 'excavated' },
      { id: 'city-of-david', label: 'City of David', sub: 'The original spur', x: 90, y: 260, w: 120, h: 300, kind: 'minor', tier: 'excavated' },
      { id: 'siloam', label: 'Pool of Siloam', sub: 'Steps uncovered in 2004', x: 90, y: 415, w: 70, h: 45, kind: 'water', tier: 'extant' },
      { id: 'bethesda', label: 'Pool of Bethesda', sub: 'Twin pools, excavated', x: 210, y: -395, w: 80, h: 55, kind: 'water', tier: 'extant' },
      { id: 'golgotha', label: 'Golgotha', sub: 'A disused quarry outside the wall', x: -300, y: -350, w: 70, h: 55, kind: 'major', tier: 'excavated' },
    ],
    seed: 71,
  },
  {
    id: 'bethsaida', name: 'Bethsaida', modern: 'et-Tell',
    footprint: [420, 260], hectares: 8, people: '~800',
    basis: 'A mound north-east of the lake, identified with et-Tell. An Iron Age gate complex survives and 1st-c. houses sit on the slope; the shoreline lay closer in antiquity than it does now. Block layout is illustration.',
    landmarks: [
      { id: 'gate', label: 'Iron Age gate', sub: 'Still standing when Jesus came', x: -120, y: 60, w: 52, h: 34, kind: 'major' },
      { id: 'fisher', label: "Fisherman's house", sub: 'Net weights, hooks, anchors', x: 40, y: -32, w: 30, h: 24, kind: 'minor' },
    ],
    seed: 53,
  },
]

function layout(site) {
  const [W, H] = site.footprint
  if (site.noBlocks) return { blocks: [], streets: [] }
  const r = rng(site.seed)
  const blocks = []
  const streets = []
  const occupied = site.landmarks.map(l => ({ x: l.x, y: l.y, w: l.w, h: l.h }))
  const hits = (x, y, w, h) => occupied.some(o =>
    Math.abs(x - o.x) * 2 < w + o.w + 10 && Math.abs(y - o.y) * 2 < h + o.h + 10)

  // One main street along the long axis, lanes off it. Villages of this period
  // grew along a route rather than to a plan, so the grid is deliberately loose.
  const laneGap = 42
  for (let sy = -H / 2 + 26; sy < H / 2 - 20; sy += laneGap)
    streets.push({ x1: -W / 2 + 8, y1: sy, x2: W / 2 - 8, y2: sy })
  for (let sx = -W / 2 + 48; sx < W / 2 - 30; sx += 70)
    streets.push({ x1: sx, y1: -H / 2 + 12, x2: sx, y2: H / 2 - 12 })

  for (let sy = -H / 2 + 30; sy < H / 2 - 26; sy += laneGap) {
    let x = -W / 2 + 14
    while (x < W / 2 - 24) {
      const w = 14 + Math.round(r() * 12)
      const h = 12 + Math.round(r() * 8)
      const cx = x + w / 2, cy = sy + 12 + r() * 6
      if (!hits(cx, cy, w, h) && Math.abs(cx) < W / 2 - 12 && Math.abs(cy) < H / 2 - 10)
        blocks.push({ x: +cx.toFixed(1), y: +cy.toFixed(1), w, h, r: +(r() * 6 - 3).toFixed(1) })
      x += w + 6 + Math.round(r() * 8)
    }
  }
  return { blocks, streets }
}

const plans = SITES.map(s => ({
  id: s.id, name: s.name, modern: s.modern,
  footprint: s.footprint, hectares: s.hectares, people: s.people,
  shore: s.shore ?? null,
  confidence: s.noBlocks ? 'attested-features' : 'schematic',
  basis: s.basis,
  landmarks: s.landmarks,
  ...layout(s),
}))

writeFileSync(OUT, JSON.stringify({
  _readme: 'Generated by scripts/build-site-plans.mjs — do not hand-edit. Footprints and named landmarks are sourced; street grids and blocks are illustration, not survey. See that script.',
  scaleNote: 'Drawn at their own scale, not the map’s: a viewBox unit is 428 m there, so Capernaum would be 22 px wide at maximum zoom.',
  plans,
}, null, 1))

console.log(`wrote ${OUT}`)
plans.forEach(p => console.log(
  `  ${p.name.padEnd(11)} ${String(p.footprint[0]).padStart(3)}×${p.footprint[1]} m  ${String(p.hectares).padStart(2)} ha  ${String(p.blocks.length).padStart(3)} blocks  ${p.landmarks.length} landmarks`))
