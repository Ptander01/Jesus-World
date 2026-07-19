import { useState, useMemo } from 'react'
import journeyData from '../data/gospels-data.json'
import { attestationLabel, inLens } from '../lib/attestation.js'
import ScriptureReveal from './ScriptureReveal.jsx'

const LENSES = ['All', 'Synoptics', 'Matthew', 'Mark', 'Luke', 'John']

export default function FilterPanel({
  activeJourneys,
  selectedBookId,
  viewMode,
  showProvinces,
  lens = 'All',
  onLensChange,
  onJourneyToggle,
  onBookSelect,
  onViewModeChange,
  onShowProvincesChange,
  onLocate,
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  // Parables grouped by topic, in first-appearance order. `topic` is a key
  // ("kingdom"); parableTopics carries the display label. Groups that the Lens
  // empties out are dropped rather than left as bare headings.
  const parableThemes = useMemo(() => {
    const groups = new Map()
    for (const p of journeyData.parables ?? []) {
      if (!inLens(p.gospels, lens)) continue
      const label = journeyData.parableTopics?.[p.topic]?.label ?? p.topic
      if (!groups.has(label)) groups.set(label, [])
      groups.get(label).push(p)
    }
    return [...groups.entries()]
  }, [lens])

  // How much of the located corpus the current Lens keeps — shown as a live readout
  // so the Lens states its own cost.
  const lensCounts = useMemo(() => {
    const located = journeyData.churchEvents.filter(e => e.gospels)
    return {
      shown: located.filter(e => inLens(e.gospels, lens)).length,
      total: located.length,
    }
  }, [lens])

  const cityName = id => journeyData.cities.find(c => c.id === id)?.name ?? id

  // Located content grouped by category for the Events browser (marquee "event"
  // items are already the chips above, so they're excluded here)
  const eventCategories = useMemo(() => {
    const meta = [
      ['miracle',   'Miracles',   '#c9a84c'],
      ['teaching',  'Teachings',  '#4A7C6F'],
      ['encounter', 'Encounters', '#7B6FA0'],
    ]
    const groups = {}
    for (const e of journeyData.churchEvents ?? []) {
      if (!inLens(e.gospels, lens)) continue
      if (!groups[e.category]) groups[e.category] = []
      groups[e.category].push(e)
    }
    return meta
      .filter(([cat]) => groups[cat]?.length)
      .map(([cat, label, color]) => [label, color, groups[cat].sort((a, b) => a.year - b.year)])
  }, [lens])

  const allActive  = journeyData.journeys.every(j => activeJourneys.has(j.id))
  const noneActive = journeyData.journeys.every(j => !activeJourneys.has(j.id))

  function selectAll() {
    journeyData.journeys.filter(j => !activeJourneys.has(j.id)).forEach(j => onJourneyToggle(j.id))
  }
  function clearAll() {
    journeyData.journeys.filter(j => activeJourneys.has(j.id)).forEach(j => onJourneyToggle(j.id))
  }

  return (
    <>
      {/* Mobile hamburger toggle — only visible on small screens */}
      <button
        className="fp-mobile-toggle"
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle filters"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Backdrop — mobile only, closes panel on tap */}
      {mobileOpen && (
        <div className="fp-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fp${mobileOpen ? ' fp--open' : ''}`}>
        {/* ── Gospel Lens — sits above the tabs because it governs all of them,
             plus the map and the timeline ── */}
        <div className="fp-lens">
          <div className="fp-lens-head">Gospel Lens</div>
          <div className="fp-lens-pills">
            {LENSES.map(l => (
              <button
                key={l}
                type="button"
                className={`fp-lens-pill${lens === l ? ' fp-lens-pill--active' : ''}`}
                onClick={() => onLensChange?.(l)}
              >{l}</button>
            ))}
          </div>
          <div className="fp-lens-note">
            {lens === 'All'
              ? `All ${lensCounts.total} located events`
              : `${lensCounts.shown} of ${lensCounts.total} events · places this Gospel records nothing go dark`}
          </div>
        </div>

        {/* ── Mode toggle ── */}
        <div className="fp-tabs">
          <button
            className={`fp-tab ${viewMode === 'journeys' ? 'fp-tab--active' : ''}`}
            onClick={() => onViewModeChange('journeys')}
          >Journeys</button>
          <button
            className={`fp-tab ${viewMode === 'books' ? 'fp-tab--active' : ''}`}
            onClick={() => onViewModeChange('books')}
          >Events</button>
          <button
            className={`fp-tab ${viewMode === 'parables' ? 'fp-tab--active' : ''}`}
            onClick={() => onViewModeChange('parables')}
          >Parables</button>
        </div>

        {/* ── Journey mode ── */}
        {viewMode === 'journeys' && (
          <>
            <div className="fp-toolbar">
              <button className="fp-link" onClick={selectAll} disabled={allActive}>
                Select All
              </button>
              <span className="fp-sep">·</span>
              <button className="fp-link" onClick={clearAll} disabled={noneActive}>
                Clear All
              </button>
            </div>

            <div className="fp-journey-list">
              {journeyData.journeys.map(journey => {
                const active = activeJourneys.has(journey.id)
                const isPostRome = journey.id === 'period-6'
                const drStart = Math.round(journey.dateRange[0])
                const drEnd   = Math.round(journey.dateRange[1])
                return (
                  <label
                    key={journey.id}
                    className={`fp-journey-row ${active ? '' : 'fp-journey-row--dim'}`}
                    style={{ '--jc': journey.color, background: 'transparent' }}
                  >
                    <input
                      type="checkbox"
                      className="fp-check"
                      checked={active}
                      onChange={() => onJourneyToggle(journey.id)}
                    />
                    <svg className="fp-line-swatch" width="36" height="10" aria-hidden="true">
                      <line
                        x1="2" y1="5" x2="34" y2="5"
                        stroke={journey.color}
                        strokeWidth={isPostRome ? 1.5 : 2.5}
                        strokeDasharray={isPostRome ? '5 3' : undefined}
                        strokeLinecap="round"
                        strokeOpacity="0.9"
                      />
                    </svg>
                    <span className="fp-journey-text">
                      <span className={`fp-journey-name ${isPostRome ? 'fp-em' : ''}`}>
                        {journey.shortName}
                        {isPostRome && <span className="fp-muted"> (traditional)</span>}
                      </span>
                      <span className="fp-journey-date">
                        AD {drStart === drEnd ? drStart : `${drStart}–${drEnd}`}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </>
        )}

        {/* ── Book mode ── */}
        {viewMode === 'books' && (
          <>
            <div className="fp-book-grid">
              {journeyData.books.map(book => {
                const journey = journeyData.journeys.find(j => j.id === book.journeyId)
                const color   = journey?.color ?? '#a09a8e'
                const selected = selectedBookId === book.id
                const debated  = book.attribution === 'debated'
                return (
                  <button
                    key={book.id}
                    className={`fp-pill ${selected ? 'fp-pill--on' : ''} ${debated ? 'fp-em' : ''}`}
                    onClick={() => onBookSelect(selected ? null : book.id)}
                    title={book.name}
                  >
                    <span className="fp-pill-dot" style={{ background: color }} />
                    {book.abbrev}
                  </button>
                )
              })}
            </div>

            <div className="fp-attr-legend">
              <span className="fp-muted">Regular = in all four Gospels</span>
              <span className="fp-muted fp-em">Italic = fewer Gospels / disputed</span>
            </div>

            {eventCategories.map(([label, color, list]) => (
              <div key={label} className="fp-evt-cat">
                <div className="fp-evt-cat-head">
                  <span className="fp-evt-dot" style={{ background: color }} />
                  {label}
                  <span className="fp-evt-count">{list.length}</span>
                </div>
                {list.map(e => (
                  <div key={e.id} className="fp-evt-item">
                    <button
                      type="button"
                      className="fp-evt-row"
                      onClick={() => onLocate?.(e.cityId)}
                      title={`${e.label} — ${e.ref}`}
                    >
                      <span className="fp-evt-name">{e.label}</span>
                      <span className="fp-evt-loc">{cityName(e.cityId)}</span>
                    </button>
                    <ScriptureReveal passageRef={e.ref} dense />
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        {/* ── Parables mode (thematic index — decoupled from the map) ── */}
        {viewMode === 'parables' && (
          <div className="fp-parables">
            {parableThemes.map(([theme, list]) => (
              <div key={theme} className="fp-parable-theme">
                <div className="fp-parable-theme-head">{theme}</div>
                {list.map(p => (
                  <div key={p.id} className="fp-parable">
                    <div className="fp-parable-name">{p.name}</div>
                    {p.lesson && <div className="fp-parable-lesson">{p.lesson}</div>}
                    <div className="fp-parable-meta">
                      <span className="fp-parable-ref">{p.ref.split(';')[0]}</span>
                      <span className="fp-parable-gospels">{attestationLabel(p.gospels)}</span>
                    </div>
                    <div className="fp-parable-actions">
                      {p.occasion && (
                        <button
                          type="button"
                          className="fp-parable-occasion"
                          onClick={() => onLocate?.(p.occasion.cityId)}
                          title={p.occasion.note}
                        >
                          ◎ {cityName(p.occasion.cityId)}
                        </button>
                      )}
                      <ScriptureReveal passageRef={p.ref} dense />
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div className="fp-attr-legend">
              <span className="fp-muted">Parables have no fixed location — grouped by theme, linked to the teaching setting where known (◎).</span>
            </div>
          </div>
        )}

        {/* ── Map layer toggles ── */}
        <div className="fp-layer-divider" />
        <label className="fp-layer-row">
          <input
            type="checkbox"
            className="fp-check"
            checked={showProvinces}
            onChange={() => onShowProvincesChange(!showProvinces)}
          />
          <span className="fp-province-swatch" />
          <span className="fp-journey-name">Provincial Boundaries</span>
        </label>
        <div className="fp-attr-credit">
          Region boundaries:{' '}
          <a href="https://www.openbible.info/geo/" target="_blank" rel="noreferrer">OpenBible.info</a>
          {' '}(CC BY 4.0)
        </div>
      </aside>
    </>
  )
}
