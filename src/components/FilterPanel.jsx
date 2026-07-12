import { useState, useMemo } from 'react'
import journeyData from '../data/gospels-data.json'

export default function FilterPanel({
  activeJourneys,
  selectedBookId,
  viewMode,
  showProvinces,
  onJourneyToggle,
  onBookSelect,
  onViewModeChange,
  onShowProvincesChange,
  onLocate,
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  // Parables grouped by theme, in first-appearance order
  const parableThemes = useMemo(() => {
    const groups = new Map()
    for (const p of journeyData.parables ?? []) {
      if (!groups.has(p.theme)) groups.set(p.theme, [])
      groups.get(p.theme).push(p)
    }
    return [...groups.entries()]
  }, [])

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
      if (!groups[e.category]) groups[e.category] = []
      groups[e.category].push(e)
    }
    return meta
      .filter(([cat]) => groups[cat])
      .map(([cat, label, color]) => [label, color, groups[cat].sort((a, b) => a.year - b.year)])
  }, [])

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
                  <button
                    key={e.id}
                    type="button"
                    className="fp-evt-row"
                    onClick={() => onLocate?.(e.cityId)}
                    title={`${e.label} — ${e.ref}`}
                  >
                    <span className="fp-evt-name">{e.label}</span>
                    <span className="fp-evt-loc">{cityName(e.cityId)}</span>
                  </button>
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
                      <span className="fp-parable-gospels">{p.gospels}</span>
                    </div>
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
