import { useState } from 'react'
import { fetchPassages } from '../lib/scripture.js'

// Click-to-expand scripture, dropped in wherever a `ref` field is already shown as
// plain text (FilterPanel's events/parables, BookDetailPanel's key verse, the story
// caption). Fetches lazily on first open and caches after — see lib/scripture.js.
// Named `passageRef` (not `ref`) because `ref` is a reserved React prop.
export default function ScriptureReveal({ passageRef, label = 'Read', dense = false, className = '' }) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState('idle') // idle | loading | done | error
  const [results, setResults] = useState([])

  function toggle() {
    if (!open && state === 'idle') {
      setState('loading')
      fetchPassages(passageRef)
        .then(res => {
          setResults(res)
          setState(res.some(r => r.ok) ? 'done' : 'error')
        })
        .catch(() => setState('error'))
    }
    setOpen(o => !o)
  }

  if (!passageRef) return null

  return (
    <div className={`scr ${dense ? 'scr--dense' : ''} ${className}`}>
      <button type="button" className="scr-trigger" onClick={toggle} aria-expanded={open}>
        <span className="scr-trigger-icon">{open ? '−' : '✦'}</span>
        {label}
      </button>
      {open && (
        <div className="scr-panel">
          {state === 'loading' && (
            <div className="scr-loading">
              <span className="scr-loading-bar" />
              <span className="scr-loading-bar" />
            </div>
          )}
          {state === 'error' && (
            <div className="scr-error">Couldn&rsquo;t load this passage.</div>
          )}
          {(state === 'done' || state === 'error') && results.map(r => (
            r.ok ? (
              <div className="scr-passage" key={r.ref}>
                <div className="scr-passage-ref">{r.passage.reference}</div>
                <div className="scr-passage-text">
                  {r.passage.verses.length > 0 ? r.passage.verses.map(v => (
                    <span key={v.verse}>
                      <sup className="scr-vnum">{v.verse}</sup>{v.text}{' '}
                    </span>
                  )) : r.passage.text}
                </div>
              </div>
            ) : (
              <div className="scr-passage scr-passage--error" key={r.ref}>
                <div className="scr-passage-ref">{r.ref}</div>
                <div className="scr-error">Couldn&rsquo;t load.</div>
              </div>
            )
          ))}
          {state === 'done' && (
            <div className="scr-credit">World English Bible · Public Domain</div>
          )}
        </div>
      )}
    </div>
  )
}
