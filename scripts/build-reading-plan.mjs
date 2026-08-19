#!/usr/bin/env node
/**
 * Builds the 39-day chronological Gospel reading plan into the data the reader
 * consumes. Reproducible: re-run it any time the plan or the location spine
 * changes. Nothing here should be hand-edited downstream — fix the source table
 * or the overrides below and re-run.
 *
 *   node scripts/build-reading-plan.mjs            # uses the HTTP cache
 *   node scripts/build-reading-plan.mjs --refetch  # ignores the cache
 *
 * Output: src/data/reading-plan/index.json  (39 days: refs, place, year — small,
 *                                            imported eagerly for the day index)
 *         src/data/reading-plan/day-NNN.json (verse text — lazy-loaded per day)
 *
 * ── Source conventions carried over from the print plan ──
 *   |  separates readings within a day (the natural section unit)
 *   ;  continues the SAME BOOK when the next segment carries no book name
 *      (day 292's "Luke 5:1-11; 4:31-37" is still Luke)
 *   ,  separates disjoint loci sharing a chapter ("Matthew 8:18, 23-27")
 *   [additional reading: X] marks the two disputed passages — the woman caught
 *      in adultery and the longer ending of Mark. They are kept and flagged,
 *      not dropped: the reader's editorial line is to leave the disagreement
 *      standing rather than harmonise it away.
 *   Half-verse markers (3:23b, 3:23a) are stripped for fetching but kept in the
 *      displayed citation.
 *
 * ── Why chapter-at-a-time fetching ──
 * bible-api.com caps a request at two chapters, and every open-ended form
 * (`Matthew 5:1-6:999`, `Matthew 5:3-`, `Matthew 5-6`) 404s or errors. The only
 * reliable primitive is a whole chapter (`Matthew 5`). So: fetch each of the 89
 * Gospel chapters once, slice every passage locally. Exact, and it needs no
 * table of chapter lengths.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const OUT_DIR = join(ROOT, 'src/data/reading-plan')
const CACHE_FILE = join(HERE, '.chapter-cache.json')
const REFETCH = process.argv.includes('--refetch')

const TRANSLATION = { id: 'web', name: 'World English Bible', note: 'Public Domain', source: 'bible-api.com' }

// ─────────────────────────────────────────────────────────────────────────────
// The plan, verbatim from the print edition. This table is the source of truth.
// ─────────────────────────────────────────────────────────────────────────────
const PLAN = `
286\tMatthew 1:1–17; Luke 3:23b–38 | John 1:1–18 | Luke 1:1–25
287\tLuke 1:26–80 | Matthew 1:18–25
288\tLuke 2:1–38 | Matthew 2:1–23 | Luke 2:39–52
289\tMatthew 3:1–17; Mark 1:1–11; Luke 3:1–23a
290\tMatthew 4:1–11; Mark 1:12–13; Luke 4:1–13 | John 1:19–2:25
291\tJohn 3:1–36 | Matthew 4:12–17; Mark 1:14–15; Luke 4:14–30; John 4:1–54
292\tMatthew 4:18–22; Mark 1:16–28; Luke 5:1–11; 4:31–37 | Matthew 8:14–17; Mark 1:29–34; Luke 4:38–41 | Matthew 4:23–25; Mark 1:35–39; Luke 4:42–44
293\tMatthew 8:2–4; Mark 1:40–45; Luke 5:12–16 | Matthew 9:1–17; Mark 2:1–22; Luke 5:17–39 | John 5:1–47
294\tMatthew 12:1–21; Mark 2:23–3:19; Luke 6:1–16
295\tMatthew 5:1–8:1; Luke 6:17–49
296\tMatthew 8:5–13; Luke 7:1–17 | Matthew 11:2–30; Luke 7:18–50
297\tLuke 8:1–3 | Matthew 12:22–50; 9:27–34; Mark 3:20–35; Luke 8:19–21
298\tMatthew 13:1–53; Mark 4:1–34; Luke 8:4–18
299\tMatthew 8:18, 23–27; Mark 4:35–41; Luke 8:22–25 | Matthew 8:28–34; Mark 5:1–20; Luke 8:26–39 | Matthew 9:18–26; Mark 5:21–43; Luke 8:40–56 | Matthew 13:54–58; Mark 6:1–6 | Matthew 9:35–38
300\tMatthew 10:1–11:1; Mark 6:7–13; Luke 9:1–6 | Matthew 14:1–12; Mark 6:14–30; Luke 9:7–9
301\tMatthew 14:13–36; Mark 6:31–56; Luke 9:10–17; John 6:1–71
302\tMatthew 15:1–16:28; Mark 7:1–9:1; Luke 9:18–27
303\tMatthew 17:1–18:35; Mark 9:2–50; Luke 9:28–50
304\tMatthew 8:19–22; Luke 9:51–62 | John 7:1–52 [additional reading: John 7:53–8:11]
305\tJohn 8:12–10:42
306\tLuke 10:1–12:59
307\tLuke 13:1–15:32
308\tLuke 16:1–17:37 | John 11:1–57
309\tLuke 18:1–14 | Matthew 19:1–12; Mark 10:1–12 | Matthew 19:13–30; Mark 10:13–31; Luke 18:15–30
310\tMatthew 20:1–34; Mark 10:32–52; Luke 18:31–19:28
311\tMatthew 21:1–22; Mark 11:1–25; Luke 19:29–48; John 12:1, 9–50
312\tMatthew 21:23–22:22; Mark 11:27–12:17; Luke 20:1–26
313\tMatthew 22:23–23:36; Mark 12:18–40; Luke 20:27–47
314\tMatthew 23:37–24:31; Mark 12:41–13:27; Luke 21:1–27
315\tMatthew 24:32–25:46; Mark 13:28–37; Luke 21:28–38
316\tMatthew 26:1–5; Mark 14:1–2; Luke 22:1–6 | Matthew 26:6–16; Mark 14:3–11; John 12:2–8
317\tMatthew 26:17–25; Mark 14:12–21; Luke 22:7–16, 21–30; John 13:1–30
318\tMatthew 26:26–35; Mark 14:22–31; Luke 22:17–20, 31–38; John 13:31–16:4
319\tJohn 16:5–18:12; Matthew 26:36–56; Mark 14:32–52; Luke 22:39–53
320\tMatthew 26:57–75; Mark 14:53–72; Luke 22:54–65; John 18:13–27
321\tMatthew 27:1–30; Mark 15:1–20; Luke 22:66–23:25; John 18:28–19:16
322\tMatthew 27:31–56; Mark 15:21–41; Luke 23:26–49; John 19:17–30
323\tMatthew 27:57–28:8; Mark 15:42–16:8; Luke 23:50–24:12; John 19:31–20:18
324\tMatthew 28:9–20; Luke 24:13–53; John 20:19–21:25 [additional reading: Mark 16:9–20]
`.trim()

// ─────────────────────────────────────────────────────────────────────────────
// Location spine. 36 of the 62 readings resolve automatically by overlapping the
// passage range against the refs already carried by gospels-data.json's events
// and parables. The rest are declared here, keyed "day:readingIndex". Values are
// city ids from gospels-data.json; `site` (optional) is a JerusalemDiagram pin.
// ─────────────────────────────────────────────────────────────────────────────
const LOCATION_OVERRIDES = {
  '286:0': { cityId: 'bethlehem', note: 'The genealogies — Davidic line, Bethlehem' },
  '286:1': { cityId: 'bethlehem', note: 'The prologue — no scene; anchored to the nativity' },
  '286:2': { cityId: 'jerusalem', site: 'temple-mount', note: 'Zechariah in the temple' },
  '287:0': { cityId: 'nazareth', note: 'The annunciation' },
  '287:1': { cityId: 'nazareth', note: "Joseph's dream" },
  '288:0': { cityId: 'bethlehem', note: 'The nativity; presentation in the temple' },
  '288:1': { cityId: 'bethlehem', note: 'The magi, the flight to Egypt' },
  '288:2': { cityId: 'nazareth', note: 'The return to Nazareth; the boy in the temple' },
  '289:0': { cityId: 'bethany-beyond-jordan', note: 'John baptizing at the Jordan' },
  '290:0': { cityId: 'judean-wilderness', note: 'The temptation' },
  '292:2': { cityId: 'capernaum', note: 'Preaching through Galilee' },
  '295:0': { cityId: 'capernaum', note: 'The Sermon on the Mount / on the Plain' },
  '297:0': { cityId: 'capernaum', note: 'The women who provided for them' },
  '299:3': { cityId: 'nazareth', note: 'Rejected in his home town' },
  '299:4': { cityId: 'capernaum', note: 'The harvest is plentiful' },
  '300:0': { cityId: 'capernaum', note: 'Sending out the twelve' },
  // The atlas has no Machaerus pin — Herod's fortress east of the Dead Sea, where
  // Josephus places the execution. Left unlocated rather than pinned to a place
  // the text doesn't claim; the map simply holds its last position.
  '300:1': { cityId: null, note: "John the Baptist's death at Machaerus — not on the atlas" },
  '304:0': { cityId: 'sychar', note: 'Setting his face toward Jerusalem, through Samaria' },
  '304:1': { cityId: 'jerusalem', site: 'temple-mount', note: 'The Feast of Tabernacles' },
  // "Judea beyond the Jordan" is Perea; Bethany-beyond-Jordan is the atlas pin there.
  '309:1': { cityId: 'bethany-beyond-jordan', note: 'Teaching in Judea beyond the Jordan' },
  '312:0': { cityId: 'jerusalem', site: 'temple-mount', note: 'Teaching in the temple courts' },
  '316:0': { cityId: 'jerusalem', site: 'temple-mount', note: 'The plot against him' },
  '316:1': { cityId: 'bethany', site: 'bethany', note: 'The anointing at Bethany' },
  '317:0': { cityId: 'jerusalem', site: 'upper-room', note: 'The Passover meal prepared' },
  '318:0': { cityId: 'jerusalem', site: 'upper-room', note: 'The bread and the cup; the farewell discourse' },
  '320:0': { cityId: 'jerusalem', site: 'antonia', note: "Before Caiaphas; Peter's denial" },
}

// Cities the overrides assume. Any that gospels-data.json doesn't carry are
// reported at the end rather than silently producing a dead map pin.
// ─────────────────────────────────────────────────────────────────────────────

const BOOKS = ['Matthew', 'Mark', 'Luke', 'John']
const BOOK_RE = new RegExp(`^(${BOOKS.join('|')})\\s+(.*)$`)
const dash = s => s.replace(/[–—−]/g, '-')

function parseLocus(locus) {
  let m = /^(\d+):(\d+)-(\d+):(\d+)$/.exec(locus)
  if (m) return [+m[1], +m[2], +m[3], +m[4]]
  m = /^(\d+):(\d+)-(\d+)$/.exec(locus)
  if (m) return [+m[1], +m[2], +m[1], +m[3]]
  m = /^(\d+):(\d+)$/.exec(locus)
  if (m) return [+m[1], +m[2], +m[1], +m[2]]
  return null
}

function parsePlan(text) {
  return text.split('\n').filter(Boolean).map(rawRow => {
    const row = dash(rawRow)
    const [dayStr, rest] = row.split('\t')
    let body = rest
    let extra = null
    const mb = /\[additional reading:\s*([^\]]+)\]/.exec(body)
    if (mb) { extra = mb[1].trim(); body = body.slice(0, mb.index).trim() }

    const readings = body.split('|').map(chunk => {
      const passages = []
      let book = null, chapter = null
      for (const segRaw of chunk.split(';')) {
        const seg = segRaw.trim()
        if (!seg) continue
        let locusStr
        const m = BOOK_RE.exec(seg)
        if (m) { book = m[1]; locusStr = m[2].trim() } else { locusStr = seg }
        for (const partRaw of locusStr.split(',')) {
          // "3:23b" / "23a" — the print marks half-verses. The letter is stripped
          // for fetching (the API has no notion of half a verse) but kept in the
          // citation the reader displays, because it is a real claim about where
          // the genealogy starts.
          let shown = partRaw.trim()
          if (!shown) continue
          let part = shown.replace(/(\d+)[ab]\b/g, '$1')
          // A comma-continuation ("8:18, 23-27") inherits the running chapter.
          if (!part.includes(':') && chapter != null) {
            part = `${chapter}:${part}`
            shown = `${chapter}:${shown}`
          }
          const range = parseLocus(part)
          if (!range) throw new Error(`unparsed locus: day ${dayStr} ${book} "${part}"`)
          chapter = range[0]
          passages.push({ book, range, cite: `${book} ${shown}` })
        }
      }
      return passages
    }).filter(p => p.length)

    const day = { day: +dayStr, readings }
    if (extra) {
      const passages = []
      let book = null
      for (const segRaw of extra.split(';')) {
        const m = BOOK_RE.exec(segRaw.trim())
        if (!m) continue
        book = m[1]
        const range = parseLocus(m[2].trim())
        if (range) passages.push({ book, range, cite: `${book} ${m[2].trim()}` })
      }
      day.extra = passages
    }
    return day
  })
}

// ── Chapter fetching ────────────────────────────────────────────────────────

const cache = (!REFETCH && existsSync(CACHE_FILE))
  ? JSON.parse(readFileSync(CACHE_FILE, 'utf8'))
  : {}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function getChapter(book, n) {
  const key = `${book} ${n}`
  if (cache[key]) return cache[key]
  const url = `https://bible-api.com/${encodeURIComponent(key)}?translation=web`
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url)
      if (res.status === 429) { await sleep(4000 * attempt); continue }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      cache[key] = (data.verses ?? []).map(v => ({ c: v.chapter, v: v.verse, t: (v.text ?? '').trim() }))
      process.stdout.write(`  ${key} (${cache[key].length}v)\n`)
      await sleep(900)
      return cache[key]
    } catch (err) {
      if (attempt === 4) throw new Error(`${key}: ${err.message}`)
      await sleep(2000 * attempt)
    }
  }
}

const inRange = (v, [c1, v1, c2, v2]) =>
  (v.c > c1 || (v.c === c1 && v.v >= v1)) && (v.c < c2 || (v.c === c2 && v.v <= v2))

async function slicePassage(p) {
  const [c1, , c2] = p.range
  const verses = []
  for (let c = c1; c <= c2; c++) {
    const ch = await getChapter(p.book, c)
    for (const v of ch) if (inRange(v, p.range)) verses.push(v)
  }
  return verses
}

// ── Location + year spine ───────────────────────────────────────────────────

const gospels = JSON.parse(readFileSync(join(ROOT, 'src/data/gospels-data.json'), 'utf8'))
const CITY_IDS = new Set(gospels.cities.map(c => c.id))

const ABBR = { Matt: 'Matthew', Mat: 'Matthew', Mk: 'Mark', Lk: 'Luke', Jn: 'John', Matthew: 'Matthew', Mark: 'Mark', Luke: 'Luke', John: 'John' }

function parseAtlasRef(ref) {
  const out = []
  for (const partRaw of dash(ref ?? '').split(/[;,]/)) {
    const m = /^\s*([1-3]?\s*[A-Za-z]+)\s+(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?/.exec(partRaw)
    if (!m) continue
    const book = ABBR[m[1].trim()]
    if (!book) continue
    const c1 = +m[2], v1 = +m[3]
    const c2 = m[4] ? +m[4] : c1
    const v2 = m[5] ? +m[5] : v1
    out.push({ book, range: [c1, v1, c2, v2] })
  }
  return out
}

// ── Curated Passion Week scenes ─────────────────────────────────────────────
// The hand-written prose from passion-reading.json — formerly its own reader at
// /read. Rather than duplicating the last week as a second surface, each scene
// is attached to the plan section its ref falls inside, anchored to the verse it
// begins at, so the prose and its Jerusalem site land inside the full text.
// This is a real gain over the old split: day 324 runs 103 verses through
// Emmaus, Thomas, the shore, the commission and the ascension under a single
// "Jerusalem" pin — the same frozen-map problem the site diagram was built for.
const passion = JSON.parse(readFileSync(join(ROOT, 'src/data/passion-reading.json'), 'utf8'))
const SCENES = passion.sections.map(s => {
  const [first] = parseAtlasRef(s.ref)
  return {
    id: s.id, title: s.title, prose: s.prose, site: s.site ?? null,
    cityId: s.cityId, ref: s.ref, gospels: s.gospels ?? [], day: s.day ?? null,
    match: first ?? null,
    anchor: first ? { book: first.book, c: first.range[0], v: first.range[1] } : null,
  }
})

// Everything in the atlas that carries both a ref and a place
const LOCATED = []
for (const e of gospels.churchEvents) {
  for (const r of parseAtlasRef(e.ref)) {
    LOCATED.push({ ...r, cityId: e.cityId, year: e.year, label: e.label })
  }
}
for (const p of gospels.parables) {
  const cityId = p.occasion?.cityId
  if (!cityId) continue
  for (const r of parseAtlasRef(p.ref)) LOCATED.push({ ...r, cityId, year: p.occasion?.year, label: p.name })
}

const overlaps = (a, b) =>
  a.book === b.book &&
  (a.range[0] < b.range[2] || (a.range[0] === b.range[2] && a.range[1] <= b.range[3])) &&
  (b.range[0] < a.range[2] || (b.range[0] === a.range[2] && b.range[1] <= a.range[3]))

function autoLocate(passages) {
  for (const p of passages) {
    for (const l of LOCATED) {
      if (overlaps(p, l)) return { cityId: l.cityId, year: l.year, via: l.label }
    }
  }
  return null
}

// ── Build ───────────────────────────────────────────────────────────────────

const days = parsePlan(PLAN)
const unresolved = []
const badCities = []

// Pass 1 — attach place/year to every reading
for (const d of days) {
  d.sections = d.readings.map((passages, i) => {
    const key = `${d.day}:${i}`
    const override = LOCATION_OVERRIDES[key]
    const auto = autoLocate(passages)
    // A declared override wins outright, including a declared `null` — that is a
    // decision that the scene has no atlas pin, not a gap to be auto-filled.
    const cityId = override ? (override.cityId ?? null) : (auto?.cityId ?? null)
    if (cityId && !CITY_IDS.has(cityId)) badCities.push(`${key} → ${cityId}`)
    if (!cityId) unresolved.push(`${key}  ${passages.map(p => p.cite).join(' ; ')}`)
    return {
      id: `d${d.day}-${i}`,
      cite: passages.map(p => p.cite).join('; '),
      passages,
      cityId,
      site: override?.site ?? null,
      note: override?.note ?? auto?.via ?? null,
      year: auto?.year ?? null,
      located: Boolean(override) ? 'declared' : (auto ? 'derived' : 'none'),
      scenes: SCENES.filter(sc => sc.match && passages.some(p => overlaps(p, sc.match))),
    }
  })
}

// Pass 2 — a monotonic year for every section. The plan is chronological, so
// derived years are clamped non-decreasing and the gaps interpolated; without
// this the timeline marker would jump backwards wherever a parallel account
// happens to carry an earlier atlas year.
const flat = days.flatMap(d => d.sections)
let last = gospels.dateRange?.[0] ?? 29
for (const s of flat) {
  if (s.year != null) { s.year = Math.max(s.year, last); last = s.year }
}
const END = gospels.dateRange?.[1] ?? 33.5
for (let i = 0; i < flat.length; i++) {
  if (flat[i].year != null) continue
  let lo = i - 1; while (lo >= 0 && flat[lo].year == null) lo--
  let hi = i + 1; while (hi < flat.length && flat[hi].year == null) hi++
  const a = lo >= 0 ? flat[lo].year : (gospels.dateRange?.[0] ?? 29)
  const b = hi < flat.length ? flat[hi].year : END
  const span = (hi < flat.length ? hi : flat.length) - (lo >= 0 ? lo : -1)
  flat[i].year = +(a + (b - a) * ((i - (lo >= 0 ? lo : -1)) / span)).toFixed(3)
}

// Pass 3 — fetch and emit
mkdirSync(OUT_DIR, { recursive: true })
let totalVerses = 0, totalBytes = 0

const index = { _readme: 'Generated by scripts/build-reading-plan.mjs — do not hand-edit. Verse text lives in the per-day files; this index carries only what the day picker and the timeline need.', translation: TRANSLATION, days: [] }

for (const d of days) {
  const dayOut = { day: d.day, translation: TRANSLATION, sections: [] }
  for (const s of d.sections) {
    const verses = []
    for (const p of s.passages) {
      const vs = await slicePassage(p)
      verses.push({ cite: p.cite, book: p.book, verses: vs })
    }
    const n = verses.reduce((a, b) => a + b.verses.length, 0)
    const bytes = verses.reduce((a, b) => a + b.verses.reduce((x, v) => x + v.t.length, 0), 0)
    totalVerses += n; totalBytes += bytes
    dayOut.sections.push({
      id: s.id, cite: s.cite, cityId: s.cityId, site: s.site,
      note: s.note, year: s.year, verseCount: n, passages: verses,
      scenes: s.scenes.map(sc => ({
        id: sc.id, title: sc.title, prose: sc.prose, site: sc.site,
        cityId: sc.cityId, ref: sc.ref, gospels: sc.gospels, day: sc.day,
        anchor: sc.anchor,
      })),
    })
  }
  if (d.extra) {
    const verses = []
    for (const p of d.extra) verses.push({ cite: p.cite, book: p.book, verses: await slicePassage(p) })
    const n = verses.reduce((a, b) => a + b.verses.length, 0)
    totalVerses += n
    dayOut.extra = {
      id: `d${d.day}-extra`,
      cite: d.extra.map(p => p.cite).join('; '),
      // Both bracketed passages are textually disputed — absent from the earliest
      // manuscripts. Flagged in the data so the reader can say so rather than
      // presenting them as though the tradition were settled.
      disputed: true,
      verseCount: n,
      passages: verses,
    }
  }
  writeFileSync(join(OUT_DIR, `day-${d.day}.json`), JSON.stringify(dayOut))
  index.days.push({
    day: d.day,
    cite: d.sections.map(s => s.cite).join(' | '),
    year: d.sections[0].year,
    endYear: d.sections[d.sections.length - 1].year,
    cityIds: [...new Set(d.sections.map(s => s.cityId).filter(Boolean))],
    sectionCount: d.sections.length,
    verseCount: dayOut.sections.reduce((a, s) => a + s.verseCount, 0) + (dayOut.extra?.verseCount ?? 0),
    hasExtra: Boolean(d.extra),
  })
}

writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 1))
writeFileSync(CACHE_FILE, JSON.stringify(cache))

console.log(`\ndays      ${days.length}`)
console.log(`sections  ${flat.length}`)
console.log(`passages  ${days.reduce((a, d) => a + d.readings.reduce((x, r) => x + r.length, 0), 0)}`)
console.log(`verses    ${totalVerses}`)
console.log(`text      ${(totalBytes / 1024).toFixed(0)} KB`)
console.log(`chapters  ${Object.keys(cache).length} cached`)
console.log(`located   declared ${flat.filter(s => s.located === 'declared').length} · derived ${flat.filter(s => s.located === 'derived').length} · none ${flat.filter(s => s.located === 'none').length}`)
if (badCities.length) console.log(`\n!! city ids not in gospels-data.json:\n  ${badCities.join('\n  ')}`)
if (unresolved.length) console.log(`\n!! sections with no location:\n  ${unresolved.join('\n  ')}`)
