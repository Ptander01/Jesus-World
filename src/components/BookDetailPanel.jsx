import journeyData from '../data/gospels-data.json'

export default function BookDetailPanel({ book, onClose }) {
  const writingCity = book
    ? journeyData.cities.find(c => c.id === book.writingLocationId)
    : null

  return (
    <div className={`bdp${book ? ' bdp--open' : ''}`}>
      {book && (
        <>
          <button className="bdp-close" onClick={onClose}>Clear ×</button>

          <h2 className="bdp-title">{book.name}</h2>

          <div className="bdp-badge">
            AD {Math.round(book.dateRange[0]) === Math.round(book.dateRange[1])
              ? Math.round(book.dateRange[0])
              : `${Math.round(book.dateRange[0])}–${Math.round(book.dateRange[1])}`}
            {book.dateDebated && <span className="bdp-badge-debated"> · chronology debated</span>}
          </div>

          {writingCity && (
            <div className="bdp-section">
              <div className="bdp-label">Setting</div>
              <div className="bdp-writing-loc">
                <span className="bdp-city-name">{writingCity.name}</span>
                <span className="bdp-province">{writingCity.province}</span>
              </div>
            </div>
          )}

          {book.recipientRegion && (
            <div className="bdp-section">
              <div className="bdp-label">Region</div>
              <div className="bdp-chips">
                <span className="bdp-chip">{book.recipientRegion}</span>
              </div>
            </div>
          )}

          {book.theme && (
            <div className="bdp-section">
              <div className="bdp-label">Theme</div>
              <div className="bdp-theme">{book.theme}</div>
            </div>
          )}

          {book.keyVerse && (
            <div className="bdp-verse">
              <div className="bdp-verse-label">Key Verse</div>
              <div className="bdp-verse-ref">{book.keyVerse}</div>
            </div>
          )}

          {book.attribution === 'debated' && (
            <div className="bdp-attr-note">
              Attested in fewer than all four Gospels (single Gospel or the Synoptics).
            </div>
          )}

          <div className="bdp-study-sep" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="bdp-study-btn bdp-study-btn--disabled" disabled>
              Study Guide — coming soon
            </button>
            <button className="bdp-study-btn bdp-study-btn--disabled" disabled>
              Maps &amp; Timeline — coming soon
            </button>
          </div>
        </>
      )}
    </div>
  )
}
