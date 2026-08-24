import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import MapView from './MapView'
import JerusalemDiagram from './JerusalemDiagram.jsx'
import ReaderTimeline from './ReaderTimeline.jsx'
import NavTabs from './NavTabs.jsx'
import planIndex from '../data/reading-plan/index.json'
import journeyData from '../data/gospels-data.json'
import { attestationLabel } from '../lib/attestation.js'

// Per-day verse text is lazy — the whole plan is ~400KB of scripture and you read
// one day at a time. Vite turns this glob into 39 separate chunks.
const DAY_FILES = import.meta.glob('../data/reading-plan/day-*.json')

const DAYS = planIndex.days
const ALL_PERIODS = new Set(journeyData.journeys.map(j => j.id))
const cityName = id => journeyData.cities.find(c => c.id === id)?.name ?? id

const SITE_PROSE_NAME = {
  'temple-mount': 'The Temple', 'mount-of-olives': 'Mount of Olives', antonia: 'Antonia Fortress',
  'upper-room': 'The Upper Room', gethsemane: 'Gethsemane', golgotha: 'Golgotha',
  'garden-tomb': 'The Garden Tomb', bethphage: 'Bethphage', bethany: 'Bethany',
}
const placeOf = o =>
  o?.site ? (SITE_PROSE_NAME[o.site] ?? cityName(o.cityId)) : (o?.cityId ? cityName(o.cityId) : null)

function loadDay(day) {
  const loader = DAY_FILES[`../data/reading-plan/day-${day}.json`]
  if (!loader) return Promise.reject(new Error(`no data for day ${day}`))
  return loader().then(m => m.default ?? m)
}

const verseKey = (book, v) => `${book} ${v.c}:${v.v}`

/**
 * A curated scene — the hand-written prose that used to live in its own reader
 * at /read, now set inside the full text at the verse it belongs to. Reads as
 * commentary, deliberately not as scripture: no verse numbers, its own rule.
 */
function Scene({ scene, on, refCb }) {
  return (
    <aside className={`gr-scene${on ? ' gr-scene--on' : ''}`} ref={refCb}>
      <div className="gr-scene-head">
        {scene.day && <span className="gr-scene-day">{scene.day}</span>}
        <h3 className="gr-scene-title">{scene.title}</h3>
      </div>
      <p className="gr-scene-prose">{scene.prose}</p>
      <div className="gr-scene-foot">
        <span className="gr-scene-ref">{scene.ref}</span>
        {scene.gospels?.length > 0 && (
          <span className="rd-attest" title={scene.gospels.join(', ')}>
            Told in {attestationLabel(scene.gospels)}
          </span>
        )}
      </div>
    </aside>
  )
}

/** Verse numbers show the chapter too whenever the chapter turns mid-passage. */
function Passage({ passage, showCite, sceneAt, sectionId, register, activeKey }) {
  const rows = passage.verses.map((v, i) => ({
    ...v,
    turned: i === 0 || v.c !== passage.verses[i - 1].c,
    scene: sceneAt.get(`${sectionId}|${verseKey(passage.book, v)}`) ?? null,
  }))
  return (
    <div className="gr-passage">
      {showCite && <div className="gr-passage-cite">{passage.cite}</div>}
      {rows.map(v => (
        <div key={`${v.c}:${v.v}`}>
          {v.scene && (
            <Scene
              scene={v.scene.scene}
              on={v.scene.key === activeKey}
              refCb={el => register(v.scene.key, el)}
            />
          )}
          <p className="rd-v">
            <span className={`rd-vn${v.turned ? ' rd-vn--chapter' : ''}`}>
              {v.turned ? `${v.c}:${v.v}` : v.v}
            </span>
            {v.t}
          </p>
        </div>
      ))}
    </div>
  )
}

/**
 * The reader: the whole four Gospels as a 39-day chronological plan, a day at a
 * time, with the map and timeline tracking where you are.
 *
 * The curated Passion Week material is folded in rather than living at its own
 * route — its scenes are attached at build time to the reading they fall inside
 * (see scripts/build-reading-plan.mjs) and rendered inline here. That also makes
 * the map finer-grained exactly where it used to be worst: day 324 runs 103
 * verses through Emmaus, Thomas, the shore, the commission and the ascension,
 * and now moves through all five instead of sitting on one "Jerusalem" pin.
 */
export default function GospelReader({ theme = 'dark', lens = 'All', initialDay = null }) {
  const startIdx = useMemo(() => {
    const i = DAYS.findIndex(d => d.day === initialDay)
    return i >= 0 ? i : 0
  }, [initialDay])

  const [dayIdx, setDayIdx] = useState(startIdx)
  // Day data is stamped with the day it belongs to, so switching days derives an
  // empty pane instead of needing a synchronous reset inside the loading effect.
  const [loaded, setLoaded] = useState(null)
  const [active, setActive] = useState(0)
  const [indexOpen, setIndexOpen] = useState(false)

  const scrollerRef = useRef(null)
  const stopRefs = useRef([])
  const panToCityRef = useRef(null)
  const lastPannedRef = useRef(null)

  const meta = DAYS[dayIdx]
  const fresh = loaded?.day === meta.day
  const day = fresh ? loaded.data : null
  const error = fresh ? loaded.error : null
  const sections = useMemo(() => day?.sections ?? [], [day])

  // Load the active day, and prefetch the next one so paging forward is instant.
  useEffect(() => {
    let cancelled = false
    loadDay(meta.day)
      .then(d => { if (!cancelled) setLoaded({ day: meta.day, data: d, error: null }) })
      .catch(e => { if (!cancelled) setLoaded({ day: meta.day, data: null, error: e.message }) })
    const next = DAYS[dayIdx + 1]
    if (next) loadDay(next.day).catch(() => {})
    return () => { cancelled = true }
  }, [meta.day, dayIdx])

  // Keep the URL shareable. replaceState doesn't fire hashchange, so this can't
  // loop back through the router.
  useEffect(() => {
    window.history.replaceState(null, '', `#/gospels/${meta.day}`)
  }, [meta.day])

  useEffect(() => {
    stopRefs.current = []
    scrollerRef.current?.scrollTo({ top: 0 })
  }, [meta.day])

  /**
   * Every place the reading can "be": each section, plus each curated scene, in
   * document order. Scene order has to come from walking the passages — on day
   * 324 the scenes' own order (Emmaus, Thomas, shore, commission, ascension) is
   * narrative, while the text runs Matthew, then Luke, then John.
   */
  const { stops, sceneAt, indexOfKey } = useMemo(() => {
    const stops = []
    const sceneAt = new Map()
    sections.forEach((s, si) => {
      stops.push({ key: `sec-${s.id}`, si, cityId: s.cityId, site: s.site, year: s.year })
      const pending = new Map()
      for (const sc of s.scenes ?? []) {
        if (sc.anchor) pending.set(verseKey(sc.anchor.book, { c: sc.anchor.c, v: sc.anchor.v }), sc)
      }
      for (const p of s.passages) {
        for (const v of p.verses) {
          const k = verseKey(p.book, v)
          const sc = pending.get(k)
          if (!sc) continue
          const key = `scene-${s.id}-${sc.id}`
          stops.push({ key, si, cityId: sc.cityId, site: sc.site, year: s.year, scene: sc })
          sceneAt.set(`${s.id}|${k}`, { scene: sc, key })
          pending.delete(k)
        }
      }
    })
    const indexOfKey = new Map(stops.map((s, i) => [s.key, i]))
    return { stops, sceneAt, indexOfKey }
  }, [sections])

  const register = useCallback((key, el) => {
    const i = indexOfKey.get(key)
    if (i != null) stopRefs.current[i] = el
  }, [indexOfKey])

  const measure = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const line = scroller.getBoundingClientRect().top + scroller.clientHeight * 0.35
    let best = 0
    let bestDist = Infinity
    stopRefs.current.forEach((el, i) => {
      if (!el) return
      const r = el.getBoundingClientRect()
      // A scene is a short block and a section is a long one, so compare against
      // the top edge rather than the centre — otherwise a tall section always
      // wins on proximity and the scenes never become active.
      const dist = Math.abs(r.top - line)
      if (dist < bestDist) { bestDist = dist; best = i }
    })
    setActive(prev => (prev === best ? prev : best))
  }, [])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    measure()
    scroller.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      scroller.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [measure, day])

  const stop = stops[active] ?? stops[0] ?? null
  const isCloseUp = Boolean(stop?.site)
  // The active stop is often a scene *inside* a section, so "which section is lit"
  // is its parent, not a key match — otherwise reading a scene dims the very
  // block you are reading down to .34.
  const activeSi = stop?.si ?? -1
  const activeKey = stop?.key ?? null

  // Hold the last real position: several readings legitimately have no atlas pin
  // (the prologue, the Machaerus execution), and jumping the map to nowhere is
  // worse than leaving it where the story last was.
  useEffect(() => {
    const cityId = stop?.cityId
    if (!cityId || lastPannedRef.current === cityId) return
    lastPannedRef.current = cityId
    panToCityRef.current?.(cityId)
  }, [stop])

  const goDay = useCallback(d => {
    const i = DAYS.findIndex(x => x.day === d)
    if (i >= 0) { setDayIdx(i); setIndexOpen(false) }
  }, [])

  useEffect(() => {
    const onKey = e => {
      if (e.target.closest?.('input, textarea, button')) return
      if (e.key === 'ArrowRight' && dayIdx < DAYS.length - 1) setDayIdx(dayIdx + 1)
      if (e.key === 'ArrowLeft' && dayIdx > 0) setDayIdx(dayIdx - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dayIdx])

  const mapYear = stop?.year ?? meta.year
  const totalVerses = useMemo(() => DAYS.reduce((a, d) => a + d.verseCount, 0), [])
  const sceneCount = sections.reduce((a, s) => a + (s.scenes?.length ?? 0), 0)

  return (
    <div className="rd gr" data-theme={theme}>
      <div className="rd-map" aria-hidden="true">
        <div className={`rd-map-layer${!isCloseUp ? ' rd-map-layer--on' : ''}`}>
          <MapView
            activeJourneys={ALL_PERIODS}
            selectedBookId={null}
            timelineYear={mapYear}
            hoveredCityId={stop?.cityId ?? null}
            onCityHover={() => {}}
            onCityClick={() => {}}
            provincesGeo={null}
            showProvinces={false}
            isPlaying={false}
            detailJourneyId={null}
            onMapReady={fn => {
              panToCityRef.current = fn
              const first = DAYS[startIdx].cityIds[0]
              if (first) fn(first)
            }}
            theme={theme}
            lens={lens}
            fitMode="slice"
          />
        </div>
        <div className={`rd-map-layer${isCloseUp ? ' rd-map-layer--on' : ''}`}>
          <JerusalemDiagram activeSite={stop?.site ?? null} />
        </div>
        <div className={`rd-map-scrim${isCloseUp ? ' rd-map-scrim--closeup' : ''}`} />
      </div>

      <div className="rd-scroll" ref={scrollerRef}>
        <div className="rd-col">
          <header className="gr-dayhead">
            <NavTabs current="reader" />
            <div className="gr-dayhead-row">
              <span className="rd-kicker">
                Day {dayIdx + 1} of {DAYS.length}
                <span className="gr-daynum"> · plan day {meta.day}</span>
              </span>
              <button className="gr-index-btn" type="button" onClick={() => setIndexOpen(o => !o)}>
                {indexOpen ? 'Close index' : 'All 39 days'}
              </button>
            </div>
            <h1 className="gr-title">{meta.cite.split(' | ')[0]}</h1>
            {meta.cite.includes(' | ') && (
              <p className="gr-subcite">{meta.cite.split(' | ').slice(1).join(' · ')}</p>
            )}
            <p className="gr-meta">
              {meta.verseCount} verses
              {meta.cityIds.length > 0 && <> · {meta.cityIds.map(cityName).join(' · ')}</>}
              {sceneCount > 0 && <> · {sceneCount} annotated {sceneCount === 1 ? 'scene' : 'scenes'}</>}
            </p>
          </header>

          {indexOpen && (
            <nav className="gr-index" aria-label="Reading plan index">
              {DAYS.map((d, i) => (
                <button
                  key={d.day}
                  type="button"
                  className={`gr-index-item${i === dayIdx ? ' gr-index-item--on' : ''}`}
                  onClick={() => goDay(d.day)}
                >
                  <span className="gr-index-n">{i + 1}</span>
                  <span className="gr-index-cite">{d.cite.replace(/ \| /g, ' · ')}</span>
                  <span className="gr-index-v">{d.verseCount}v</span>
                </button>
              ))}
            </nav>
          )}

          {error && <p className="gr-error">Couldn’t load day {meta.day}: {error}</p>}
          {!day && !error && <p className="gr-loading">Loading day {meta.day}…</p>}

          {sections.map((s, si) => {
            return (
              <section
                key={s.id}
                ref={el => register(`sec-${s.id}`, el)}
                className={`rd-sec gr-sec${si === activeSi ? ' rd-sec--on' : ''}`}
              >
                <div className="rd-sec-head">
                  <span className="rd-day">{s.cite}</span>
                  {placeOf(s) && <span className="rd-place">{placeOf(s)}</span>}
                </div>
                {s.note && <p className="gr-note">{s.note}</p>}
                <blockquote className="rd-verses">
                  {s.passages.map(p => (
                    <Passage
                      key={p.cite}
                      passage={p}
                      showCite={s.passages.length > 1}
                      sceneAt={sceneAt}
                      sectionId={s.id}
                      register={register}
                      activeKey={activeKey}
                    />
                  ))}
                </blockquote>
              </section>
            )
          })}

          {day?.extra && (
            <section className="rd-sec gr-sec gr-sec--disputed rd-sec--on">
              <div className="rd-sec-head">
                <span className="rd-day">{day.extra.cite}</span>
                <span className="rd-place gr-disputed-tag">Disputed text</span>
              </div>
              <p className="gr-note">
                Printed here because the plan includes it, and marked because the
                earliest manuscripts do not. Read it as part of the tradition’s
                argument with itself, not as a settled part of the text.
              </p>
              <blockquote className="rd-verses">
                {day.extra.passages.map(p => (
                  <Passage
                    key={p.cite}
                    passage={p}
                    showCite={day.extra.passages.length > 1}
                    sceneAt={sceneAt}
                    sectionId="extra"
                    register={register}
                    activeKey={activeKey}
                  />
                ))}
              </blockquote>
            </section>
          )}

          <footer className="gr-foot">
            <div className="rd-end-rule" />
            <div className="gr-pager">
              <button
                type="button"
                className="gr-page"
                disabled={dayIdx === 0}
                onClick={() => setDayIdx(dayIdx - 1)}
              >← Day {dayIdx}</button>
              <span className="gr-page-of">{dayIdx + 1} / {DAYS.length}</span>
              <button
                type="button"
                className="gr-page"
                disabled={dayIdx === DAYS.length - 1}
                onClick={() => setDayIdx(dayIdx + 1)}
              >Day {dayIdx + 2} →</button>
            </div>
            <p className="rd-end-note">
              Scripture quoted from the {planIndex.translation.name} ({planIndex.translation.note}),
              fetched from {planIndex.translation.source}. The plan runs the four Gospels in
              approximate chronological order — {totalVerses.toLocaleString()} verses across{' '}
              {DAYS.length} days — so parallel accounts are read back to back rather than
              harmonised into one.
            </p>
          </footer>
        </div>
      </div>

      <ReaderTimeline
        days={DAYS}
        activeDay={meta.day}
        year={mapYear}
        onPickDay={goDay}
      />
    </div>
  )
}
