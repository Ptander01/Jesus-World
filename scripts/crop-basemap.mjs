#!/usr/bin/env node
/**
 * Crops the world-atlas 10m basemap to the Gospels theatre.
 *
 *   node scripts/crop-basemap.mjs
 *
 * Why: the app renders a ~200 km strip of the Levant, but the full 10m land
 * ring set draws as a path of ~8.1 million characters whose bounding box is
 * 78540 × 75387 against a 1200 × 680 viewBox — about 99.99% of it outside the
 * frame. That path is what made the lazy 10m swap a visible, seconds-long
 * teardown-and-rebuild of the whole map rather than a silent upgrade.
 *
 * Output: src/data/basemap-levant.json — plain GeoJSON, already rewound, so
 * MapView can use it directly without topojson.feature/mesh or a runtime rewind.
 *
 * The crop box is padded well beyond the widest view (at the minimum zoom of
 * 0.5 the frame spans lon 29.9–40.9, lat 29.7–35.0). Panning is unbounded, so
 * pan far enough and you will reach the edge of the data — but there is nothing
 * out there for this atlas to say.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import * as topojson from 'topojson-client'
import * as d3 from 'd3-geo'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'src/data/basemap-levant.json')

const BOX = { west: 22, east: 50, south: 20, north: 44 }

// Raw atlas coordinates carry ~15 significant digits. At this projection
// (Mercator, scale 12500) one degree is ~218px, so 4 decimals is ~0.02px — still
// under a fifth of a pixel at the maximum zoom of 8. The rest is pure filesize.
const P = 1e4
const round = ([x, y]) => [Math.round(x * P) / P, Math.round(y * P) / P]

// ── Sutherland–Hodgman, one half-plane at a time. Planar is fine here: the box
// is small, mid-latitude, and nowhere near a pole or the antimeridian.
const INSIDE = {
  west:  p => p[0] >= BOX.west,  east:  p => p[0] <= BOX.east,
  south: p => p[1] >= BOX.south, north: p => p[1] <= BOX.north,
}
const CUT = {
  west:  (a, b) => [BOX.west,  a[1] + (b[1] - a[1]) * (BOX.west  - a[0]) / (b[0] - a[0])],
  east:  (a, b) => [BOX.east,  a[1] + (b[1] - a[1]) * (BOX.east  - a[0]) / (b[0] - a[0])],
  south: (a, b) => [a[0] + (b[0] - a[0]) * (BOX.south - a[1]) / (b[1] - a[1]), BOX.south],
  north: (a, b) => [a[0] + (b[0] - a[0]) * (BOX.north - a[1]) / (b[1] - a[1]), BOX.north],
}

function clipRing(ring) {
  let out = ring
  for (const edge of ['west', 'east', 'south', 'north']) {
    const input = out
    out = []
    for (let i = 0; i < input.length; i++) {
      const cur = input[i]
      const prev = input[(i + input.length - 1) % input.length]
      const curIn = INSIDE[edge](cur)
      const prevIn = INSIDE[edge](prev)
      if (curIn) {
        if (!prevIn) out.push(CUT[edge](prev, cur))
        out.push(cur)
      } else if (prevIn) {
        out.push(CUT[edge](prev, cur))
      }
    }
    if (!out.length) return null
  }
  // close the ring
  const [f] = out, l = out[out.length - 1]
  if (f[0] !== l[0] || f[1] !== l[1]) out.push([f[0], f[1]])
  return out.length >= 4 ? out : null
}

/** Normalise winding the way MapView's rewindRings does, so d3-geo fills land. */
const fixWinding = ring =>
  d3.geoArea({ type: 'Polygon', coordinates: [ring] }) > 2 * Math.PI ? ring.slice().reverse() : ring

function clipPolygon(poly) {
  const rings = poly.map(clipRing).filter(Boolean).map(fixWinding).map(r => r.map(round))
  return rings.length ? rings : null
}

// ── Line clipping for the country-border mesh: keep the runs inside the box.
const inBox = p => p[0] >= BOX.west && p[0] <= BOX.east && p[1] >= BOX.south && p[1] <= BOX.north
function clipLine(line) {
  const runs = []
  let run = []
  for (const p of line) {
    if (inBox(p)) run.push(p)
    else if (run.length) { if (run.length > 1) runs.push(run); run = [] }
  }
  if (run.length > 1) runs.push(run)
  return runs.map(r => r.map(round))
}

const atlas = JSON.parse(
  readFileSync(join(ROOT, 'node_modules/world-atlas/countries-10m.json'), 'utf8')
)

// ── land ──
const landFC = topojson.feature(atlas, atlas.objects.land)
const landGeoms = []
for (const f of landFC.features ?? [landFC]) {
  const g = f.geometry ?? f
  if (g.type === 'Polygon') {
    const p = clipPolygon(g.coordinates)
    if (p) landGeoms.push(p)
  } else if (g.type === 'MultiPolygon') {
    for (const poly of g.coordinates) {
      const p = clipPolygon(poly)
      if (p) landGeoms.push(p)
    }
  }
}
const land = { type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: landGeoms } }

// ── borders ──
const mesh = topojson.mesh(atlas, atlas.objects.countries, (a, b) => a !== b)
const borderLines = mesh.coordinates.flatMap(clipLine)
const borders = { type: 'MultiLineString', coordinates: borderLines }

writeFileSync(OUT, JSON.stringify({ bbox: BOX, land, borders }))

const before = JSON.stringify(atlas).length
const after = JSON.stringify({ bbox: BOX, land, borders }).length
const area = d3.geoArea(land)
console.log(`polygons kept   ${landGeoms.length}`)
console.log(`border lines    ${borderLines.length}`)
console.log(`land geoArea    ${area.toFixed(4)} sr  ${area > 2 * Math.PI ? '!! INVERTED' : '(ok — fills land, not sea)'}`)
console.log(`source 10m      ${(before / 1024 / 1024).toFixed(2)} MB`)
console.log(`cropped         ${(after / 1024).toFixed(0)} KB   (${(100 * after / before).toFixed(2)}% of source)`)
