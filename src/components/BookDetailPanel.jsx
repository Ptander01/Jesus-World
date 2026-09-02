import journeyData from '../data/gospels-data.json'
import ScriptureReveal from './ScriptureReveal.jsx'
import { isAllFour } from '../lib/attestation.js'

// "Matthew, Mark and Luke" — the Gospels that carry this event, named. The old
// copy here said only "attested in fewer than all four", which is both vaguer
// than the data and was derived from a stale `attribution` field.
function tellsIt(gospels = []) {
  if (isAllFour(gospels)) return 'Told in all four Gospels.'
  if (gospels.length === 1) return `Told only in ${gospels[0]}.`
  return `Told in ${gospels.slice(0, -1).join(', ')} and ${gospels[gospels.length - 1]}.`
}

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
            {book.when ?? `AD ${Math.round(book.dateRange[0])}`}
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
              <ScriptureReveal passageRef={book.keyVerse} label="Read this verse" />
            </div>
          )}

          {book.gospels?.length > 0 && (
            <div className="bdp-attr-note">{tellsIt(book.gospels)}</div>
          )}

          {book.ref && (
            <div className="bdp-section">
              <div className="bdp-label">Scripture</div>
              <div className="bdp-ref-full">{book.ref}</div>
              <ScriptureReveal passageRef={book.ref} label="Read the full account" />
            </div>
          )}

          <div className="bdp-study-sep" />
          <div className="bdp-ctx">
            <div className="bdp-ctx-label">Reading Context</div>
            <a className="bdp-ctx-link" href="#/context/parallel-accounts">
              Why the four accounts differ
            </a>
            <a className="bdp-ctx-link" href="#/context/authorial-emphasis">
              What each writer emphasises
            </a>
          </div>
        </>
      )}
    </div>
  )
}
