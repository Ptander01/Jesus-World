import { useState, useRef, useEffect, useCallback } from 'react'
import MapView from './MapView'
import reading from '../data/passion-reading.json'
import journeyData from '../data/gospels-data.json'
import { attestationLabel } from '../lib/attestation.js'

const SECTIONS = reading.sections
const PERIODS = new Set(['period-5', 'period-6'])
const cityName = id => journeyData.cities.find(c => c.id === id)?.name ?? id

// Scroll-driven reader: prose is the spine, the map is the illustration. The active
// section is whichever sits nearest the reading line (35% down the viewport) — a
// centre-distance test rather than IntersectionObserver thresholds, because "what am
// I reading now" is a question about proximity to the eye, not about how much of a
// tall block happens to be on screen.
export default function ReadingMode({ theme = 'dark', lens = 'All', onExit }) {
  const [active, setActive] = useState(0)
  const scrollerRef = useRef(null)
  const sectionRefs = useRef([])
  const panToCityRef = useRef(null)
  const lastPannedRef = useRef(null)

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
  }, [measure])

  // Fly the map to the active section's place. Guarded so re-renders don't re-pan to
  // a city we're already sitting on.
  const section = SECTIONS[active]
  useEffect(() => {
    if (!section || lastPannedRef.current === section.id) return
    lastPannedRef.current = section.id
    panToCityRef.current?.(section.cityId)
  }, [section])

  return (
    <div className="rd" data-theme={theme}>
      <div className="rd-map" aria-hidden="true">
        <MapView
          activeJourneys={PERIODS}
          selectedBookId={null}
          timelineYear={section?.year ?? SECTIONS[0].year}
          hoveredCityId={section?.cityId ?? null}
          onCityHover={() => {}}
          onCityClick={() => {}}
          provincesGeo={null}
          showProvinces={false}
          isPlaying={false}
          detailJourneyId={null}
          onMapReady={fn => {
            panToCityRef.current = fn
            if (SECTIONS[0]) fn(SECTIONS[0].cityId)
          }}
          theme={theme}
          lens={lens}
        />
        <div className="rd-map-scrim" />
      </div>

      <div className="rd-scroll" ref={scrollerRef}>
        <div className="rd-col">
          <header className="rd-hero">
            <button className="rd-exit" onClick={onExit} type="button">← The Atlas</button>
            <div className="rd-kicker">Jerusalem · AD 33</div>
            <h1 className="rd-title">The Last Week</h1>
            <p className="rd-standfirst">
              Six days from the road at Bethphage to a borrowed tomb, and what followed.
              Scroll to walk it. The map keeps your place.
            </p>
            <div className="rd-scrolltip">Scroll ↓</div>
          </header>

          {SECTIONS.map((s, i) => (
            <section
              key={s.id}
              ref={el => { sectionRefs.current[i] = el }}
              className={`rd-sec${i === active ? ' rd-sec--on' : ''}`}
            >
              <div className="rd-sec-head">
                <span className="rd-day">{s.day}</span>
                <span className="rd-place">{cityName(s.cityId)}</span>
              </div>
              <h2 className="rd-sec-title">{s.title}</h2>
              <p className="rd-prose">{s.prose}</p>

              <blockquote className="rd-verses">
                {s.verses.map(v => (
                  <p className="rd-v" key={v.v}>
                    <span className="rd-vn">{v.v}</span>
                    {v.text}
                  </p>
                ))}
                <cite className="rd-cite">
                  {/* `ref` is the passage quoted; `gospels` is which Gospels tell the
                      event — separate claims, so they get separate labels. */}
                  <span className="rd-ref">{s.ref}</span>
                  <span className="rd-attest" title={s.gospels.join(', ')}>
                    Told in {attestationLabel(s.gospels)}
                  </span>
                </cite>
              </blockquote>
            </section>
          ))}

          <footer className="rd-end">
            <div className="rd-end-rule" />
            <p className="rd-end-note">
              Scripture quoted from the {reading.translation.name} ({reading.translation.note}).
              Counting and attestation conventions are set out in the project's crosswalk;
              where the Gospels disagree — the date of the supper, the order of the week — this
              reading leaves the disagreement standing rather than harmonising it away.
            </p>
            <button className="rd-exit rd-exit--foot" onClick={onExit} type="button">
              ← Back to the Atlas
            </button>
          </footer>
        </div>
      </div>

      <nav className="rd-rail" aria-label="Progress">
        {SECTIONS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`rd-tick${i === active ? ' rd-tick--on' : ''}`}
            title={`${s.day} · ${s.title}`}
            onClick={() => sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          />
        ))}
      </nav>
    </div>
  )
}
