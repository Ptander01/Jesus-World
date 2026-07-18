import { useRef, useEffect } from 'react'
// Imported (not served from /public) so Vite content-hashes the filenames — a changed
// image gets a new URL, so browser/CDN caches can never serve a stale layer.
import image1Sky from '../assets/hero/image1_sky.png'
import image2Midground from '../assets/hero/image2_midground.png'
import image3Foreground from '../assets/hero/image3_foreground.png'

const GREEK = 'Ἐν ἀρχῇ ἦν ὁ λόγος'
const GREEK_TRANS = 'In the beginning was the Word · John 1:1'

// Depth-glide parallax. The scene is PINNED (a sticky stage inside a taller scroll
// track), so as you scroll each layer glides at its own rate and the depth reads
// clearly instead of the whole scene just scrolling away. Motion is expressed as a
// fraction of the viewport height and combined with a base scale that provides the
// overscan those upward translations consume — see LAYERS + hero.css `.hero-layer-N`.
// Each layer's `scale` here must match its CSS base scale so the two agree at rest.
const LAYERS = [
  { key: 'layer1', shift: -0.04, scale: 1.12, grow: 0.00 }, // sky — barely moves
  { key: 'layer2', shift: -0.11, scale: 1.24, grow: 0.00 }, // midground — medium
  { key: 'layer3', shift: -0.22, scale: 1.34, grow: 0.14 }, // foreground — fast + drifts toward you
]

// Smooth 0→1 ramp across [a,b], flat outside — used for fades so they ease in/out.
const smoothstep = (x, a, b) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export default function HeroLanding({ onEnter }) {
  const scrollRef = useRef(null)
  const enteredRef = useRef(false)
  const layer1Ref = useRef(null)
  const layer2Ref = useRef(null)
  const layer3Ref = useRef(null)
  const contentRef = useRef(null)
  const stageRef = useRef(null)

  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    const refs = { layer1: layer1Ref, layer2: layer2Ref, layer3: layer3Ref }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const apply = (p) => {
      const h = scroller.clientHeight
      // Respect reduced-motion: hold the layers still, only fade the title + scene.
      for (const l of LAYERS) {
        const el = refs[l.key].current
        if (el) el.style.transform = reduce
          ? `scale(${l.scale})`
          : `translate3d(0, ${p * l.shift * h}px, 0) scale(${l.scale + p * l.grow})`
      }
      // Title lifts away and fades out over the first half of the scroll.
      if (contentRef.current) {
        contentRef.current.style.opacity = String(1 - smoothstep(p, 0.08, 0.55))
        contentRef.current.style.transform = reduce ? '' : `translate3d(0, ${p * -80}px, 0)`
      }
      // Near the end the whole scene dissolves, handing off to the atlas behind it.
      if (stageRef.current) stageRef.current.style.opacity = String(1 - smoothstep(p, 0.74, 1))
    }

    const onScroll = () => {
      const max = scroller.scrollHeight - scroller.clientHeight
      const progress = max > 0 ? Math.min(1, scroller.scrollTop / max) : 0
      apply(progress)
      if (progress >= 0.98 && !enteredRef.current) {
        enteredRef.current = true
        onEnter()
      }
    }

    apply(0)
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [onEnter])

  const enter = () => {
    const scroller = scrollRef.current
    if (!scroller) return
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
  }

  return (
    <div className="hero" ref={scrollRef}>
      {/* Tall track gives the scroll distance; the stage pins to the top of it. */}
      <div className="hero-track">
        <div className="hero-stage" ref={stageRef}>
          <div ref={layer1Ref} className="hero-layer hero-layer-1" style={{ backgroundImage: `url(${image1Sky})` }} />
          <div ref={layer2Ref} className="hero-layer hero-layer-2" style={{ backgroundImage: `url(${image2Midground})` }} />
          <div ref={layer3Ref} className="hero-layer hero-layer-3" style={{ backgroundImage: `url(${image3Foreground})` }} />

          {/* Content Overlay — centered title area only */}
          <div className="hero-content" ref={contentRef}>
            <div className="hero-title-area">
              <div className="hero-kicker">An Atlas of the Gospels</div>
              <h1 className="hero-title">Jesus&rsquo;s World</h1>
              <p className="hero-sub">The places, the people, and the four years that changed the world.</p>
              <div className="hero-verse" tabIndex={0}>
                <span className="hero-verse-text">{GREEK}</span>
                <span className="hero-verse-tip">{GREEK_TRANS}</span>
              </div>
              <button className="hero-enter" onClick={enter} type="button">
                <span>Enter the Atlas</span>
                <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true" className="hero-chev">
                  <path d="M6 0 L6 12 M1 7 L6 12 L11 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
