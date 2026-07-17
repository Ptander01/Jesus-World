import { useRef, useEffect } from 'react'

const GREEK = 'Ἐν ἀρχῇ ἦν ὁ λόγος'
const GREEK_TRANS = 'In the beginning was the Word · John 1:1'

// Overscan applied to every hero layer. Must match `.hero-layer` scale() in hero.css:
// its ~10% top margin (0.1 × 672px ≈ 67px) covers the capped downward parallax offsets.
const LAYER_SCALE = 1.2

export default function HeroLanding({ onEnter }) {
  const scrollRef = useRef(null)
  const enteredRef = useRef(false)
  const layer1Ref = useRef(null)
  const layer2Ref = useRef(null)
  const layer3Ref = useRef(null)

  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return

    const onScroll = () => {
      const max = scroller.scrollHeight - scroller.clientHeight
      const progress = max > 0 ? Math.min(1, scroller.scrollTop / max) : 0

      // Scroll-driven parallax. Each layer is nudged DOWN as you scroll; the nearest
      // layer moves least, so relative to the scrolling container the foreground drifts
      // upward fastest and the sky lingers — natural depth. Offsets are clamped to CAP
      // (a fraction of LAYER_SCALE's overscan) so a translate never exposes a layer edge;
      // past ~one viewport of scroll the drift is frozen while the scene scrolls away.
      const s = Math.min(scroller.scrollTop, 700)
      const tf = (o) => `translate3d(0, ${o}px, 0) scale(${LAYER_SCALE})`

      if (layer1Ref.current) layer1Ref.current.style.transform = tf(s * 0.086) // sky   → cap 60
      if (layer2Ref.current) layer2Ref.current.style.transform = tf(s * 0.054) // mid   → cap 38
      if (layer3Ref.current) layer3Ref.current.style.transform = tf(s * 0.023) // fore  → cap 16

      if (progress >= 0.985 && !enteredRef.current) {
        enteredRef.current = true
        onEnter()
      }
    }

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
      {/* 3D Parallax Container */}
      <div className="hero-perspective">
        <div className="hero-stage">
          {/* Layer 1: Sky (scrolls slowest) */}
          <div ref={layer1Ref} className="hero-layer hero-layer-1" style={{
            backgroundImage: `url(/assets/image1_sky.png)`
          }} />

          {/* Layer 2: Midground Sea of Galilee (normal speed) */}
          <div ref={layer2Ref} className="hero-layer hero-layer-2" style={{
            backgroundImage: `url(/assets/image2_midground.png)`
          }} />

          {/* Layer 3: Foreground Hill (scrolls fastest) */}
          <div ref={layer3Ref} className="hero-layer hero-layer-3" style={{
            backgroundImage: `url(/assets/image3_foreground.png)`
          }} />
        </div>

        {/* Content Overlay — centered title area only */}
        <div className="hero-content">
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

      {/* Scroll Runway */}
      <div className="hero-runway" />
    </div>
  )
}
