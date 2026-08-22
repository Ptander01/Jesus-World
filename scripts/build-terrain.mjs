#!/usr/bin/env node
/**
 * Builds src/data/terrain-levant.json — elevation contours for the Gospels
 * theatre, plus two water features that only topography can supply.
 *
 *   node scripts/build-terrain.mjs            (tiles cached in scripts/.terrain-cache/)
 *   node scripts/build-terrain.mjs --refetch
 *
 * Source: the public Terrarium elevation tiles on S3 (no key). Terrarium encodes
 * height in the RGB channels: h = R*256 + G + B/256 - 32768 metres.
 *
 * Zoom 10 gives ~150 m/px at this latitude, which is the right trade: the atlas
 * frames a ~200 km strip, and z11 would quadruple a 54-tile fetch for detail no
 * contour interval here would use.
 *
 * WHY THIS MATTERS BEYOND LOOKS. The Jordan Rift is the defining fact of this
 * geography — the Dead Sea shore is the lowest land on earth, and Jericho to
 * Jerusalem climbs about 1000 m in 24 km, which is why the Gospels always say
 * *up* to Jerusalem. None of that was on the map. It also unlocks two things
 * the water build had to leave out:
 *
 *  - the Dead Sea's ~-395 m antique shoreline, as an actual contour rather than
 *    the modern two-basin outline with its evaporation-pond dikes;
 *  - Lake Huleh (Josephus's Semechonitis, War 3.515: "sixty furlongs long and
 *    thirty broad"), drained in the 1950s and therefore absent from every
 *    modern dataset, recovered from the basin it sat in.
 *
 * No PNG dependency: terrarium tiles are 8-bit RGB, non-interlaced, so the
 * decoder below is zlib plus the five PNG filter types.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { inflateSync, deflateSync } from 'node:zlib'

const ROOT  = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT   = join(ROOT, 'src/data/terrain-levant.json')
const CACHE = join(ROOT, 'scripts/.terrain-cache')
const REFETCH = process.argv.includes('--refetch')
mkdirSync(CACHE, { recursive: true })

const Z = 10
const BOX = { west: 34.55, east: 36.25, south: 30.75, north: 33.55 }

// ── PNG: 8-bit RGB, no interlace ──────────────────────────────────────
function decodePNG(buf) {
  const width = buf.readUInt32BE(16), height = buf.readUInt32BE(20)
  if (buf[24] !== 8 || buf[25] !== 2 || buf[28] !== 0)
    throw new Error(`unexpected PNG: depth ${buf[24]} colour ${buf[25]} interlace ${buf[28]}`)
  const idat = []
  let off = 8
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.toString('ascii', off + 4, off + 8)
    if (type === 'IDAT') idat.push(buf.subarray(off + 8, off + 8 + len))
    off += 12 + len
    if (type === 'IEND') break
  }
  const raw = inflateSync(Buffer.concat(idat))
  const BPP = 3, stride = width * BPP
  const out = Buffer.alloc(height * stride)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    for (let x = 0; x < stride; x++) {
      const a = x >= BPP ? out[y * stride + x - BPP] : 0
      const b = y > 0 ? out[(y - 1) * stride + x] : 0
      const c = x >= BPP && y > 0 ? out[(y - 1) * stride + x - BPP] : 0
      let v = line[x]
      if (filter === 1) v += a
      else if (filter === 2) v += b
      else if (filter === 3) v += (a + b) >> 1
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c)
      }
      out[y * stride + x] = v & 0xff
    }
  }
  return { width, height, data: out }
}

// ── PNG encode: 8-bit greyscale, one IDAT ─────────────────────────────
// Same reasoning as the decoder — a PNG is zlib plus a filter byte per row, so
// hand-rolling the narrow case beats a dependency for a build script.
const CRC = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return buf => {
    let c = -1
    for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
    return (c ^ -1) >>> 0
  }
})()
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(CRC(td))
  return Buffer.concat([len, td, crc])
}
function encodeGrayPNG(width, height, gray) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 0
  const raw = Buffer.alloc(height * (width + 1))
  for (let y = 0; y < height; y++) {
    raw[y * (width + 1)] = 1              // Sub filter: neighbouring terrain samples
    let prev = 0                          // are close, so this deflates far better
    for (let x = 0; x < width; x++) {     // than storing raw rows
      const v = gray[y * width + x]
      raw[y * (width + 1) + 1 + x] = (v - prev) & 0xff
      prev = v
    }
  }
  return Buffer.concat([
    Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Web Mercator tile maths ───────────────────────────────────────────
const n = 2 ** Z
const lon2x = lon => (lon + 180) / 360 * n
const lat2y = lat => {
  const r = lat * Math.PI / 180
  return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n
}
const x2lon = x => x / n * 360 - 180
const y2lat = y => {
  const t = Math.PI * (1 - 2 * y / n)
  return Math.atan(Math.sinh(t)) * 180 / Math.PI
}

const x0 = Math.floor(lon2x(BOX.west)),  x1 = Math.floor(lon2x(BOX.east))
const y0 = Math.floor(lat2y(BOX.north)), y1 = Math.floor(lat2y(BOX.south))
const TW = x1 - x0 + 1, TH = y1 - y0 + 1
console.log(`z${Z}: ${TW}×${TH} = ${TW * TH} tiles  (lon ${BOX.west}–${BOX.east}, lat ${BOX.south}–${BOX.north})`)

async function tile(tx, ty) {
  const f = join(CACHE, `${Z}-${tx}-${ty}.png`)
  if (existsSync(f) && !REFETCH) return readFileSync(f)
  const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${tx}/${ty}.png`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(f, buf)
  return buf
}

const S = 256
const W = TW * S, H = TH * S
const elev = new Float32Array(W * H)
let fetched = 0
for (let ty = y0; ty <= y1; ty++) {
  for (let tx = x0; tx <= x1; tx++) {
    const png = decodePNG(await tile(tx, ty))
    fetched++
    for (let py = 0; py < S; py++) {
      for (let px = 0; px < S; px++) {
        const i = (py * S + px) * 3
        const h = png.data[i] * 256 + png.data[i + 1] + png.data[i + 2] / 256 - 32768
        elev[((ty - y0) * S + py) * W + ((tx - x0) * S + px)] = h
      }
    }
  }
  process.stdout.write(`\r  tiles ${fetched}/${TW * TH}`)
}
console.log()

const gx2lon = gx => x2lon(x0 + gx / S)
const gy2lat = gy => y2lat(y0 + gy / S)

// Douglas–Peucker. Contours off a 150 m/px DEM carry far more vertices than a
// 1.1px stroke can show; ~90 m of tolerance is invisible at the k=32 ceiling and
// takes the file from a megabyte to something shippable.
const TOL = 0.0008
function simplify(pts, tol) {
  if (pts.length < 3) return pts
  const keep = new Uint8Array(pts.length)
  keep[0] = keep[pts.length - 1] = 1
  const stack = [[0, pts.length - 1]]
  while (stack.length) {
    const [lo, hi] = stack.pop()
    let far = -1, maxd = tol
    const [ax, ay] = pts[lo], [bx, by] = pts[hi]
    const dx = bx - ax, dy = by - ay
    const den = Math.hypot(dx, dy) || 1
    for (let i = lo + 1; i < hi; i++) {
      const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / den
      if (d > maxd) { maxd = d; far = i }
    }
    if (far > 0) { keep[far] = 1; stack.push([lo, far], [far, hi]) }
  }
  return pts.filter((_, i) => keep[i])
}

// ── Marching squares, stitched into polylines ─────────────────────────
// Sampled every STRIDE cells: at full resolution the 200 m contours alone run to
// megabytes, and the atlas draws them at 1.1px.
const STRIDE = 3
const KEY = 1e5
// `region` is a lon/lat box limiting where the march runs. Terrarium carries
// bathymetry, so an unrestricted contour below sea level traces the
// Mediterranean shelf edge — the -395 m "Dead Sea" came out as a single 84×189
// km line running the length of the map. Sub-sea levels must be asked for
// somewhere specific.
function contour(level, region, stride = STRIDE) {
  const STRIDE = stride
  const segs = []
  const at = (gx, gy) => elev[gy * W + gx]
  const gxLo = region ? Math.max(0, Math.floor((lon2x(region[0]) - x0) * S)) : 0
  const gxHi = region ? Math.min(W - 1, Math.ceil((lon2x(region[2]) - x0) * S)) : W - 1
  const gyLo = region ? Math.max(0, Math.floor((lat2y(region[3]) - y0) * S)) : 0
  const gyHi = region ? Math.min(H - 1, Math.ceil((lat2y(region[1]) - y0) * S)) : H - 1
  for (let gy = gyLo; gy + STRIDE <= gyHi; gy += STRIDE) {
    for (let gx = gxLo; gx + STRIDE <= gxHi; gx += STRIDE) {
      const a = at(gx, gy), b = at(gx + STRIDE, gy)
      const c = at(gx + STRIDE, gy + STRIDE), d = at(gx, gy + STRIDE)
      const idx = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0)
      if (idx === 0 || idx === 15) continue
      const ip = (p, q, vp, vq) => { const t = (level - vp) / (vq - vp); return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t] }
      const P = [gx, gy], Q = [gx + STRIDE, gy], R = [gx + STRIDE, gy + STRIDE], Sx = [gx, gy + STRIDE]
      const top = () => ip(P, Q, a, b), right = () => ip(Q, R, b, c)
      const bottom = () => ip(Sx, R, d, c), left = () => ip(P, Sx, a, d)
      const push = (u, v) => segs.push([u, v])
      switch (idx) {
        case 1: case 14: push(left(), bottom()); break
        case 2: case 13: push(bottom(), right()); break
        case 3: case 12: push(left(), right()); break
        case 4: case 11: push(top(), right()); break
        case 5:          push(left(), top()); push(bottom(), right()); break
        case 6: case 9:  push(top(), bottom()); break
        case 7: case 8:  push(left(), top()); break
        case 10:         push(left(), bottom()); push(top(), right()); break
      }
    }
  }
  // Stitch segments into polylines. Marching squares emits each segment with an
  // arbitrary direction, so an index keyed on start points alone cannot follow a
  // contour that arrives at a segment's far end — which fragmented every long
  // one. The Dead Sea's -395 m shoreline came out as a 5 km scrap of a 60 km
  // ring. Index both endpoints and allow reversal.
  const key = p => `${Math.round(p[0] * KEY)},${Math.round(p[1] * KEY)}`
  const ends = new Map()
  segs.forEach((sg, i) => {
    for (const e of [0, 1]) {
      const k = key(sg[e])
      if (!ends.has(k)) ends.set(k, [])
      ends.get(k).push([i, e])
    }
  })
  const used = new Uint8Array(segs.length)
  const lines = []
  const extend = (line, forward) => {
    for (;;) {
      const tip = forward ? line.at(-1) : line[0]
      const cand = (ends.get(key(tip)) || []).find(([i]) => !used[i])
      if (!cand) return
      const [i, e] = cand
      used[i] = 1
      const other = segs[i][1 - e]
      if (forward) line.push(other); else line.unshift(other)
      if (line.length > 20000) return
    }
  }
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue
    used[i] = 1
    const line = [segs[i][0], segs[i][1]]
    extend(line, true)
    extend(line, false)
    if (line.length > 3) lines.push(simplify(line.map(p => [gx2lon(p[0]), gy2lat(p[1])]), TOL)
      .map(p => [Math.round(p[0] * 1e4) / 1e4, Math.round(p[1] * 1e4) / 1e4]))
  }
  return lines
}

// Fewer, wider-spaced levels: nine bands off a 150 m/px DEM ran to a megabyte,
// and at 1.1px the map cannot show that many without reading as hatching.
// Land contours run everywhere; the Rift's sub-sea levels are asked for inside
// the Jordan valley only, or they trace the Mediterranean seabed instead.
// ── Hillshade ─────────────────────────────────────────────────────────
// Standard slope/aspect shading from a north-west sun, which is the cartographic
// convention: lit from the upper left, because a relief lit from below reads as
// inverted — ridges become valleys. Emitted as an 8-bit greyscale PNG into
// public/, not as a data URI, so it stays out of the JS bundle and the browser
// can cache it on its own.
//
// Downsampled 2x. The map lays this under a land tint at low opacity, so it is
// carrying the *shape* of the terrain, not its detail — the contours do detail.
// Full resolution quadrupled the file for something no one can see through a
// 0.3-opacity wash.
const HS_STEP = 2
const hsW = Math.floor(W / HS_STEP), hsH = Math.floor(H / HS_STEP)
const shade = new Uint8Array(hsW * hsH)
{
  const AZ = (315 * Math.PI) / 180        // north-west
  const ALT = (42 * Math.PI) / 180
  const sinAlt = Math.sin(ALT), cosAlt = Math.cos(ALT)
  // Metres per pixel at this latitude, so slope is in real units and the shading
  // does not flatten out as you move north.
  const midLat = (BOX.south + BOX.north) / 2
  const mpp = (156543.03392 * Math.cos((midLat * Math.PI) / 180)) / 2 ** Z * HS_STEP
  const at = (x, y) => elev[Math.min(H - 1, y * HS_STEP) * W + Math.min(W - 1, x * HS_STEP)]
  for (let y = 0; y < hsH; y++) {
    for (let x = 0; x < hsW; x++) {
      const xm = Math.max(1, Math.min(hsW - 2, x)), ym = Math.max(1, Math.min(hsH - 2, y))
      const a = at(xm - 1, ym - 1), b = at(xm, ym - 1), c = at(xm + 1, ym - 1)
      const d = at(xm - 1, ym),                        f = at(xm + 1, ym)
      const g = at(xm - 1, ym + 1), h = at(xm, ym + 1), i = at(xm + 1, ym + 1)
      const dzdx = ((c + 2 * f + i) - (a + 2 * d + g)) / (8 * mpp)
      const dzdy = ((g + 2 * h + i) - (a + 2 * b + c)) / (8 * mpp)
      const slope = Math.atan(Math.hypot(dzdx, dzdy))
      const aspect = Math.atan2(dzdy, -dzdx)
      let v = sinAlt * Math.cos(slope) + cosAlt * Math.sin(slope) * Math.cos(AZ - aspect)
      shade[y * hsW + x] = Math.max(0, Math.min(255, Math.round(v * 255)))
    }
  }
}
const HS_OUT = join(ROOT, 'public/hillshade-levant.png')
writeFileSync(HS_OUT, encodeGrayPNG(hsW, hsH, shade))

const LEVELS = [0, 300, 600, 900, 1200]
const RIFT_BOX = [35.25, 30.9, 35.85, 33.3]
const RIFT_LEVELS = [-350, -200]
const extentKm = l => {
  const lat = l.map(p => p[1]), lon = l.map(p => p[0])
  const la = Math.max(...lat) - Math.min(...lat)
  const lo = Math.max(...lon) - Math.min(...lon)
  return [lo * 111 * Math.cos(Math.min(...lat) * Math.PI / 180), la * 111]
}
const contours = [
  ...RIFT_LEVELS.map(level => ({ level, region: 'jordan-rift', lines: contour(level, RIFT_BOX) })),
  ...LEVELS.map(level => ({ level, lines: contour(level) })),
].sort((a, b) => a.level - b.level)
contours.forEach(c => console.log(`  ${String(c.level).padStart(5)} m  ${String(c.lines.length).padStart(4)} lines${c.region ? '  [' + c.region + ']' : ''}`))

const report = (label, lines) => {
  if (!process.env.DEBUG_PICK) return lines
  console.log(`\n  [debug] ${label}: ${lines.length} candidate lines`)
  lines.map(l => {
    const lat = l.map(p => p[1]), lon = l.map(p => p[0])
    const [kx, ky] = extentKm(l)
    return { cx: ((Math.min(...lon)+Math.max(...lon))/2).toFixed(3),
             cy: ((Math.min(...lat)+Math.max(...lat))/2).toFixed(3),
             km: `${kx.toFixed(1)}x${ky.toFixed(1)}`, n: l.length }
  }).sort((a,b)=>parseFloat(b.km)-parseFloat(a.km)).slice(0,6)
   .forEach(r => console.log(`     centroid ${r.cx},${r.cy}  ${r.km} km  ${r.n} pts`))
  return lines
}

// ── Reconstructions, and why neither ships ────────────────────────────
// Both were meant to come from this DEM. Neither survives its own check, so the
// script emits the reason rather than a plausible-looking wrong shape.
//
//  Dead Sea, -395 m. The lake surface reads -415 m here and the west shore is a
//  cliff, so the -395 m band is only a few pixels wide. Even marching at full
//  resolution it comes back as scattered two-point scraps along the north-east
//  shore instead of one ring: the crossing is real but too thin and too noisy at
//  150 m/px to stitch. This wants a finer DEM (z12+) or a proper lake mask.
//
//  Lake Huleh, ~+70 m. A pure elevation threshold cannot find it, because the
//  Huleh valley floor either side of the lake sits at much the same height. Ask
//  for the contour over the basin and you get a 7 x 23 km sheet — the valley.
//  Tighten the box and it just clips to the box. Separating lake from marsh from
//  dry floor needs a hydrological constraint this data does not carry, or the
//  1940s survey mapping from before the drainage.
//
// The check is Josephus, War 3.515: sixty furlongs by thirty, about 11 x 5.5 km
// at 185 m to the stadion.
const centroidIn = (l, box) => {
  const lat = l.map(p => p[1]), lon = l.map(p => p[0])
  const cy = (Math.min(...lat) + Math.max(...lat)) / 2
  const cx = (Math.min(...lon) + Math.max(...lon)) / 2
  return cy > box[1] && cy < box[3] && cx > box[0] && cx < box[2]
}
const pick = (label, lines, box, wantKm, tolerance = 0.6) => {
  const best = lines.filter(l => centroidIn(l, box))
    .sort((a, b) => extentKm(b)[1] - extentKm(a)[1])[0]
  if (!best) return { ok: false, reason: 'no candidate ring in the expected basin' }
  const [kx, ky] = extentKm(best)
  const off = Math.abs(kx - wantKm[0]) / wantKm[0] + Math.abs(ky - wantKm[1]) / wantKm[1]
  if (off > tolerance)
    return { ok: false, reason: `best ring is ${kx.toFixed(1)}x${ky.toFixed(1)} km against an expected ${wantKm[0]}x${wantKm[1]} km`, lines: [best] }
  return { ok: true, lines: [best] }
}

const deadSea = pick('Dead Sea',
  report('-395 m', contour(-395, [35.28, 31.0, 35.68, 31.87], 1)),
  [35.28, 31.0, 35.68, 31.87], [17, 60])
const hulehPick = pick('Lake Huleh',
  report('+70 m', contour(70, [35.55, 33.02, 35.73, 33.17], 1)),
  [35.55, 33.02, 35.73, 33.17], [5.5, 11])

const out = {
  hillshade: {
    src: '/hillshade-levant.png',
    width: hsW, height: hsH,
    // Web Mercator, same projection family the map uses, so the image maps to a
    // rectangle in projected space and needs no reprojection — only these corners.
    bounds: { west: x2lon(x0), east: x2lon(x1 + 1), north: y2lat(y0), south: y2lat(y1 + 1) },
    note: 'North-west sun at 42 degrees altitude, 2x downsampled from the z10 DEM.',
  },
  _readme: 'Generated by scripts/build-terrain.mjs — do not hand-edit. Contours from Terrarium elevation tiles (z10, ~150 m/px). The Dead Sea antique shoreline and Lake Huleh are reconstructions; see that script.',
  levels: contours,
  reconstructions: {
    deadSeaAntique: deadSea.ok
      ? { level: -395, note: 'Antique shoreline, one basin. Modern lake stands near -437 m and is split.', source: 'Terrarium DEM; level history after Bookman et al. 2004', lines: deadSea.lines }
      : { attempted: true, shipped: false, level: -395, reason: deadSea.reason },
    lakeHuleh: hulehPick.ok
      ? { level: 70, note: 'Josephus, War 3.515 — Semechonitis, "sixty furlongs long and thirty broad". Drained in the 1950s and absent from modern datasets.', source: 'Terrarium DEM; basin extraction', lines: hulehPick.lines }
      : { attempted: true, shipped: false, level: 70, reason: hulehPick.reason },
  },
}
writeFileSync(OUT, JSON.stringify(out))
const kb = (JSON.stringify(out).length / 1024).toFixed(0)
console.log(`\nwrote ${OUT}  (${kb} kB)`)
console.log(`wrote ${HS_OUT}  (${hsW}x${hsH}, ${(readFileSync(HS_OUT).length/1024).toFixed(0)} kB)`)
console.log(`  Dead Sea -395 m: ${deadSea.ok ? 'shipped' : 'NOT shipped — ' + deadSea.reason}`)
console.log(`  Lake Huleh:      ${hulehPick.ok ? 'shipped' : 'NOT shipped — ' + hulehPick.reason}`)
