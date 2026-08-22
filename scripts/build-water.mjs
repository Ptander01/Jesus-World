#!/usr/bin/env node
/**
 * Builds src/data/water-levant.json — the inland water of the Gospels theatre.
 *
 *   node scripts/build-water.mjs            (uses scripts/.water-cache.json)
 *   node scripts/build-water.mjs --refetch  (bypasses it)
 *
 * Why this exists at all: the basemap carried only land and modern country
 * borders, so the Sea of Galilee, the Dead Sea and the Jordan were not on the
 * map — d3.geoContains answered "land" at the centre of all three. A third of
 * the ministry happens on a lake that was not being drawn, and Capernaum,
 * Bethsaida, Magdala, Gergesa and Tiberias were shore towns sitting on a green
 * field. It also silently disabled a feature: MapView classifies each journey
 * leg sea-or-land to draw boat crossings dashed, and with no inland water in
 * the data, 0 of 42 legs ever classified as sea — including Capernaum→Gergesa,
 * which is the Calming of the Storm.
 *
 * Why OpenStreetMap and not Natural Earth: NE 10m draws the Sea of Galilee with
 * 28 vertices. That is fine at k=1 and visibly polygonal by k=8, and the atlas
 * now zooms to 32. OSM gives ~2000. NE also carries six modern reservoirs
 * inside the basemap's crop box — Atatürk (1990), Nasser (1970), Keban (1974),
 * al-Assad (1973), Tharthar and Mingəçevir (1950s) — which have no business on
 * a first-century map.
 *
 * PERIOD FIDELITY. Shorelines here are reconstructions, not observations, and
 * each carries its own `note` and `source` in the output:
 *
 *  - Sea of Galilee — modern outline, used as-is. The lake is fed and dammed at
 *    its outlet today, but its Roman-period shoreline sat within a few metres
 *    vertically of the modern one; at this projection that is sub-pixel.
 *  - Dead Sea — the modern lake is two basins joined by a causeway, the
 *    southern one an engineered evaporation-pond field with dead-straight
 *    dikes. In antiquity it was a single body standing near -395m against
 *    today's -437m and falling. The two basins are emitted together with the
 *    Lisan strait closed, which restores the connection but NOT the full
 *    historic extent — the true reconstruction is the -395m contour, and that
 *    wants the elevation data the terrain work will bring in. Marked
 *    provisional in the output so it cannot be mistaken for settled.
 *  - Lake Huleh (Josephus's Semechonitis, War 3.515) is deliberately ABSENT.
 *    It was drained in the 1950s, so it appears in no modern dataset — not even
 *    Natural Earth's historic-lakes layer, which has nothing for the Levant. It
 *    has to be authored from topography rather than guessed at, so it waits for
 *    the same elevation data.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT  = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT   = join(ROOT, 'src/data/water-levant.json')
const CACHE = join(ROOT, 'scripts/.water-cache.json')
const REFETCH = process.argv.includes('--refetch')

// Same rounding rationale as crop-basemap.mjs: 4 decimals is ~0.02px at this
// projection, still sub-pixel at the k=32 ceiling. The rest is filesize.
const P = 1e4
const round = ([x, y]) => [Math.round(x * P) / P, Math.round(y * P) / P]

const QUERY = `[out:json][timeout:180];
(
  relation["natural"="water"]["name:en"~"Sea of Galilee|Kinneret",i](32.6,35.4,33.0,35.8);
  relation["natural"="water"]["name:en"~"Dead Sea",i](31.0,35.3,31.8,35.7);
  relation["waterway"="river"]["name:en"~"Jordan",i](31.0,35.2,33.4,35.8);
);
out geom;`

const cache = existsSync(CACHE) && !REFETCH ? JSON.parse(readFileSync(CACHE, 'utf8')) : null

async function overpass() {
  if (cache) { console.log('using scripts/.water-cache.json (--refetch to bypass)'); return cache }
  console.log('querying Overpass…')
  // Overpass answers 406 without a User-Agent it recognises as a real client.
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'jesus-world-atlas/1.0 (build script; contact via repo)',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({ data: QUERY }).toString(),
  })
  if (!res.ok) throw new Error(`Overpass ${res.status}`)
  const json = await res.json()
  writeFileSync(CACHE, JSON.stringify(json))
  return json
}

// An OSM multipolygon relation is a bag of unordered, arbitrarily-directed ways.
// Stitch them end-to-end into closed rings before anything can be filled.
function ringsFrom(members) {
  const open = members.filter(m => m.role !== 'inner' && m.geometry)
                      .map(m => m.geometry.map(p => [p.lon, p.lat]))
  const inner = members.filter(m => m.role === 'inner' && m.geometry)
                       .map(m => m.geometry.map(p => [p.lon, p.lat]))
  const close = segs => {
    const rings = []
    const pool = segs.slice()
    while (pool.length) {
      let ring = pool.shift()
      let moved = true
      while (moved && (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1])) {
        moved = false
        for (let i = 0; i < pool.length; i++) {
          const seg = pool[i]
          const tail = ring.at(-1)
          const same = (a, b) => Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7
          if (same(tail, seg[0]))            { ring = ring.concat(seg.slice(1));         pool.splice(i, 1); moved = true; break }
          if (same(tail, seg.at(-1)))        { ring = ring.concat(seg.slice(0, -1).reverse()); pool.splice(i, 1); moved = true; break }
        }
      }
      if (ring.length > 3) { ring.push(ring[0]); rings.push(ring.map(round)) }
    }
    return rings
  }
  return { outer: close(open), inner: close(inner) }
}

const j = await overpass()
const named = t => (t?.['name:en'] || t?.name || '').toLowerCase()

const galilee = j.elements.find(e => /galilee|kinneret/.test(named(e.tags)))
const deadSeas = j.elements.filter(e => /dead sea/.test(named(e.tags)))
const jordans  = j.elements.filter(e => /jordan/.test(named(e.tags)) && e.tags?.waterway === 'river')

if (!galilee) throw new Error('Sea of Galilee not returned by Overpass')

const lakes = []

{
  const { outer, inner } = ringsFrom(galilee.members)
  lakes.push({
    id: 'sea-of-galilee', name: 'Sea of Galilee',
    period: 'as-is',
    note: 'Modern outline. The Roman-period shoreline sat within a few metres vertically of it — sub-pixel at this projection.',
    source: 'OpenStreetMap (ODbL)',
    rings: [...outer, ...inner],
  })
}

if (deadSeas.length) {
  const rings = deadSeas.flatMap(e => ringsFrom(e.members).outer)
  lakes.push({
    id: 'dead-sea', name: 'Dead Sea',
    period: 'provisional-reconstruction',
    note: 'Two modern basins emitted together. In antiquity this was one body near -395m against today\'s -437m; the southern basin is now an engineered evaporation-pond field. A true reconstruction is the -395m contour and awaits the elevation data.',
    source: 'OpenStreetMap (ODbL); level history after Bookman et al. 2004, Late Holocene lake levels of the Dead Sea',
    rings,
  })
}

const rivers = jordans.flatMap(e =>
  (e.geometry ? [e.geometry.map(p => [p.lon, p.lat])]
              : (e.members || []).filter(m => m.geometry).map(m => m.geometry.map(p => [p.lon, p.lat])))
).map(l => l.map(round)).filter(l => l.length > 1)

const out = {
  _readme: 'Generated by scripts/build-water.mjs — do not hand-edit. Shorelines are reconstructions; see each lake\'s note/source and the header of that script.',
  lakes,
  rivers: rivers.length ? [{ id: 'jordan', name: 'Jordan', source: 'OpenStreetMap (ODbL)', lines: rivers }] : [],
}
writeFileSync(OUT, JSON.stringify(out))

const vtx = lakes.reduce((a, l) => a + l.rings.reduce((b, r) => b + r.length, 0), 0)
console.log(`\nwrote ${OUT}`)
lakes.forEach(l => console.log(`  ${l.name.padEnd(16)} ${l.rings.length} ring(s), ${l.rings.reduce((a,r)=>a+r.length,0)} vertices  [${l.period}]`))
console.log(`  Jordan           ${rivers.length} line(s), ${rivers.reduce((a,l)=>a+l.length,0)} vertices`)
console.log(`  total ${vtx} lake vertices · ${(JSON.stringify(out).length/1024).toFixed(0)} kB`)
