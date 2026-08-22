import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

// A first-run walkthrough of the atlas. The app has a lot of surface — a layers
// pane with three filter modes and the Gospel Lens, three top-level tabs, a
// timeline with four disclosure states and a drill-down, and a play mode — and
// none of it announces itself. This points at each in turn.
//
// The tour is read-only: the veil swallows clicks rather than letting you drive
// the app mid-step, so no step can leave the atlas in a state a later step
// contradicts. `spot` is the element to cut out of the scrim; `spotMobile` is
// the stand-in for a target that lives in the off-canvas panel on small
// screens. A step whose target is missing or collapsed falls back to a centred
// card, so nothing ever points at empty space.
const STEPS = [
  {
    spot: null,
    title: 'Four years, three ways in',
    body: 'Everything here is the four Gospels laid over the map, the calendar and the text — AD 29 to 33, 26 places, 34 miracles and 34 parables. Ninety seconds and you will know where all of it lives.',
  },
  {
    spot: '.nav-tabs',
    title: 'Atlas, Charts, Reader',
    body: 'Three views of one data set. The Atlas is the map and timeline in front of you. Charts show where the miracles and parables cluster, and which Gospels attest what. The Reader is all four Gospels as a 39-day chronological read-through, with this same map following along.',
  },
  {
    spot: '.fp-lens',
    spotMobile: '.fp-mobile-toggle',
    title: 'The Gospel Lens',
    body: 'Pick a Gospel and the whole app answers as that Gospel: places it never mentions go dark on the map, and events it does not tell fade on the timeline. Nothing moves or disappears — the gaps are the point. Try John, then Mark.',
  },
  {
    spot: '.fp-tabs',
    spotMobile: '.fp-mobile-toggle',
    title: 'Journeys, Events, Parables',
    body: 'Three ways to fill the map. Journeys draws the six periods of the ministry as routes. Events lists the sixteen marquee moments. Parables lists all 34, each with its topic and the place it was told.',
  },
  {
    spot: '.fp-journey-list',
    spotMobile: '.fp-mobile-toggle',
    title: 'Layers, one at a time',
    body: 'Tick a period to draw its route; tick several to compare them. Only places that period visits keep their labels — the rest fade to outlines, so the map never says more than the period does. Provincial Boundaries, at the foot of the panel, adds the seven Herodian regions.',
  },
  {
    spot: '.tl-state-nav',
    title: 'Four levels of timeline',
    body: 'The timeline discloses in stages: the six period bars, then the event flags, then their labels, then the events alone with their dates. Step through with Next — it is the same timeline each time, saying more.',
  },
  {
    spot: '.timeline-bar',
    title: 'Drill into a period',
    body: 'Click any period bar to open it: every stop at its true duration, the events of that period, and a thread for each place. Drag anywhere on the timeline to scrub the year, and the map draws the routes as you go.',
  },
  {
    spot: '.story-btn',
    title: 'Or just watch it',
    body: 'Jesus’s Story plays the whole arc end to end — the routes draw themselves, the map follows, and a caption names each place as it arrives. The PLAY tab under the timeline holds the transport controls and speed.',
  },
  {
    spot: null,
    title: 'That is the whole map',
    body: 'Reopen this any time from the ? beside the theme switch in the header.',
  },
]

const PAD = 8            // breathing room between the spotlight and its target
const CARD_W = 340
const GAP = 14           // between spotlight and card
const MARGIN = 12        // keep the card clear of the viewport edges

export default function Tour({ onClose }) {
  const [i, setI] = useState(0)
  const holeRef = useRef(null)
  const cardRef = useRef(null)

  const step = STEPS[i]
  const last = i === STEPS.length - 1

  const close = useCallback(() => {
    localStorage.setItem('jw-tour-done', '1')
    onClose?.()
  }, [onClose])

  // Layout is measured and applied imperatively rather than held in state: the
  // spotlight has to read the live rect of an element this component does not
  // own, and re-rendering to store what we just measured buys nothing.
  const place = useCallback(() => {
    const hole = holeRef.current
    const card = cardRef.current
    if (!card) return

    const onFallback = window.innerWidth <= 768 && !!step.spotMobile
    const sel = onFallback ? step.spotMobile : step.spot
    // Three consecutive steps describe the layers panel, which is off-canvas on
    // small screens; without this the copy talks about controls that are not on
    // screen and the spotlight sits on the same hamburger each time.
    card.dataset.fallback = onFallback ? '1' : ''
    const el = sel ? document.querySelector(sel) : null
    const r = el?.getBoundingClientRect()
    const lit = !!r && r.width >= 4 && r.height >= 4 && r.right > 0 && r.left < window.innerWidth

    if (hole) {
      hole.style.display = lit ? '' : 'none'
      if (lit) {
        hole.style.top = `${r.top - PAD}px`
        hole.style.left = `${r.left - PAD}px`
        hole.style.width = `${r.width + PAD * 2}px`
        hole.style.height = `${r.height + PAD * 2}px`
      }
    }

    if (!lit) {
      card.style.top = '50%'
      card.style.left = '50%'
      card.style.transform = 'translate(-50%,-50%)'
      return
    }
    card.style.transform = 'none'
    const h = card.offsetHeight
    const below = r.bottom + PAD + GAP
    const top = below + h + MARGIN <= window.innerHeight
      ? below
      : Math.max(MARGIN, r.top - PAD - GAP - h)
    card.style.top = `${top}px`
    card.style.left = `${Math.min(
      Math.max(MARGIN, r.left + r.width / 2 - CARD_W / 2),
      window.innerWidth - CARD_W - MARGIN,
    )}px`
  }, [step])

  useLayoutEffect(() => {
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [place])

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); close() }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault()
        if (last) close(); else setI(n => n + 1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault(); setI(n => Math.max(0, n - 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, last])

  useEffect(() => { cardRef.current?.focus() }, [])

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label="How to use this atlas">
      <div className="tour-veil" onClick={close} />
      <div className="tour-hole" ref={holeRef} aria-hidden="true" />

      <div className="tour-card" ref={cardRef} tabIndex={-1}>
        <div className="tour-card__head">
          <span className="tour-card__count">{i + 1} / {STEPS.length}</span>
          <button className="tour-card__skip" onClick={close}>{last ? 'Close' : 'Skip'}</button>
        </div>

        <h2 className="tour-card__title">{step.title}</h2>
        <p className="tour-card__body">{step.body}</p>
        {step.spotMobile && (
          <p className="tour-card__hint">Tap ☰ to open the panel.</p>
        )}

        <div className="tour-card__foot">
          <div className="tour-dots" aria-hidden="true">
            {STEPS.map((s, n) => (
              <span key={s.title} className={`tour-dot${n === i ? ' tour-dot--on' : ''}`} />
            ))}
          </div>
          <div className="tour-card__nav">
            {i > 0 && <button className="tour-btn" onClick={() => setI(n => n - 1)}>Back</button>}
            <button
              className="tour-btn tour-btn--primary"
              onClick={() => { if (last) close(); else setI(n => n + 1) }}
            >{last ? 'Explore' : 'Next'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
