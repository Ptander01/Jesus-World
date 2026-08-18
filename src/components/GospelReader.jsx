import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import MapView from './MapView'
import JerusalemDiagram from './JerusalemDiagram.jsx'
import ReaderTimeline from './ReaderTimeline.jsx'
import planIndex from '../data/reading-plan/index.json'
import journeyData from '../data/gospels-data.json'

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
const placeName = s =>
  s.site ? (SITE_PROSE_NAME[s.site] ?? cityName(s.cityId)) : (s.cityId ? cityName(s.cityId) : null)

function loadDay(day) {
  const loader = DAY_FILES[`../data/reading-plan/day-${day}.json`]
  if (!loader) return Promise.reject(new Error(`no data for day ${day}`))
  return loader().then(m => m.default ?? m)
}

/** Verse numbers show the chapter too whenever the chapter turns mid-passage. */
function Passage({ passage, showCite }) {
  const rows = passage.verses.map((v, i) => ({
    ...v,
    turned: i === 0 || v.c !== passage.verses[i - 1].c,
  }))
  return (
    <div className="gr-passage">
      {showCite && <div className="gr-passage-cite">{passage.cite}</div>}
      {rows.map(v => (
        <p className="rd-v" key={`${v.c}:${v.v}`}>
          <span className={`rd-vn${v.turned ? ' rd-vn--chapter' : ''}`}>
            {v.turned ? `${v.c}:${v.v}` : v.v}
          </span>
          {v.t}
        </p>
      ))}
    </div>
  )
}

/**
 * The whole-Gospels reader: the 39-day chronological plan, a day at a time.
 *
 * Sibling to ReadingMode rather than a replacement for it — that one is a
 * curated essay on the last week with written prose and site-level pins; this
 * one is the full text. They share the reading-pane shell (`rd-*`) and the
 * map-follows-the-reading machinery, and nothing else.
 */
export default function GospelReader({ theme = 'dark', lens = 'All', onExit }) {
  const [dayIdx, setDayIdx] = useState(0)
  // Day data is stamped with the day it belongs to, so switching days derives an
  // empty pane instead of needing a synchronous reset inside the loading effect.
  const [loaded, setLoaded] = useState(null)
  const [active, setActive] = useState(0)
  const [indexOpen, setIndexOpen] = useState(false)

  const scrollerRef = useRef(null)
  const sectionRefs = useRef([])
  const panToCityRef = useRef(null)
  const lastPannedRef = useRef(null)

  const meta = DAYS[dayIdx]
  const fresh = loaded?.day === meta.day
  const day = fresh ? loaded.data : null
  const error = fresh ? loaded.error : null

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

  // New day starts at the top.
  useEffect(() => {
    sectionRefs.current = []
    scrollerRef.current?.scrollTo({ top: 0 })
  }, [meta.day])

  const measure = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const line = scroller.getBoundingClientRect().top + scroller.clientHeight * 0.35
    let best = 0
    let bestDist = Infinity
    sectionRefs.current.forEach((el, i) => {
      if (!el) return
      const r = el.getBoundingClientRect()
      const dist = Math.abs(r.top + r.height / 2 - line)
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

  const sections = day?.sections ?? []
  const section = sections[active]
  const isCloseUp = Boolean(section?.site)

  // Hold the last real position: several sections legitimately have no atlas pin
  // (the prologue, the Machaerus execution), and jumping the map to nowhere is
  // worse than leaving it where the story last was.
  useEffect(() => {
    const cityId = section?.cityId
    if (!cityId || lastPannedRef.current === cityId) return
    lastPannedRef.current = cityId
    panToCityRef.current?.(cityId)
  }, [section])

  const goDay = useCallback(d => {
    const i = DAYS.findIndex(x => x.day === d)
    if (i >= 0) { setDayIdx(i); setIndexOpen(false) }
  }, [])

  // ← / → page between days when focus isn't in a control
  useEffect(() => {
    const onKey = e => {
      if (e.target.closest?.('input, textarea, button')) return
      if (e.key === 'ArrowRight' && dayIdx < DAYS.length - 1) setDayIdx(dayIdx + 1)
      if (e.key === 'ArrowLeft' && dayIdx > 0) setDayIdx(dayIdx - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dayIdx])

  const mapYear = section?.year ?? meta.year
  const totalVerses = useMemo(() => DAYS.reduce((a, d) => a + d.verseCount, 0), [])

  return (
    <div className="rd gr" data-theme={theme}>
      <div className="rd-map" aria-hidden="true">
        <div className={`rd-map-layer${!isCloseUp ? ' rd-map-layer--on' : ''}`}>
          <MapView
            activeJourneys={ALL_PERIODS}
            selectedBookId={null}
            timelineYear={mapYear}
            hoveredCityId={section?.cityId ?? null}
            onCityHover={() => {}}
            onCityClick={() => {}}
            provincesGeo={null}
            showProvinces={false}
            isPlaying={false}
            detailJourneyId={null}
            onMapReady={fn => {
              panToCityRef.current = fn
              const first = DAYS[0].cityIds[0]
              if (first) fn(first)
            }}
            theme={theme}
            lens={lens}
          />
        </div>
        <div className={`rd-map-layer${isCloseUp ? ' rd-map-layer--on' : ''}`}>
          <JerusalemDiagram activeSite={section?.site ?? null} />
        </div>
        <div className={`rd-map-scrim${isCloseUp ? ' rd-map-scrim--closeup' : ''}`} />
      </div>

      <div className="rd-scroll" ref={scrollerRef}>
        <div className="rd-col">
          <header className="gr-dayhead">
            <button className="rd-exit" onClick={onExit} type="button">← The Atlas</button>
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

          {sections.map((s, i) => (
            <section
              key={s.id}
              ref={el => { sectionRefs.current[i] = el }}
              className={`rd-sec gr-sec${i === active ? ' rd-sec--on' : ''}`}
            >
              <div className="rd-sec-head">
                <span className="rd-day">{s.cite}</span>
                {placeName(s) && <span className="rd-place">{placeName(s)}</span>}
              </div>
              {s.note && <p className="gr-note">{s.note}</p>}
              <blockquote className="rd-verses">
                {s.passages.map(p => (
                  <Passage key={p.cite} passage={p} showCite={s.passages.length > 1} />
                ))}
              </blockquote>
            </section>
          ))}

          {day?.extra && (
            <section className="rd-sec gr-sec gr-sec--disputed">
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
                  <Passage key={p.cite} passage={p} showCite={day.extra.passages.length > 1} />
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
