import { useRef, useEffect } from 'react'
// Imported (not served from /public) so Vite content-hashes the filenames — a changed
// image gets a new URL, so browser/CDN caches can never serve a stale layer.
import image1Sky from '../assets/hero/image1_sky.webp'
import image2Midground from '../assets/hero/image2_midground.webp'
import image3Foreground from '../assets/hero/image3_foreground.webp'

const GREEK = 'Ἐν ἀρχῇ ἦν ὁ λόγος'
const GREEK_TRANS = 'In the beginning was the Word · John 1:1'

// ── Depth-glide parallax ─────────────────────────────────────────────────────
// The scene is PINNED (sticky stage inside a tall scroll track). Scrolling glides
// each layer between `from` and `to` (fractions of viewport height): the story opens
// on the full midground vista — the foreground cliff waits almost entirely below the
// fold (from: +0.55) — then the cliff sweeps up and toward the viewer (grow) while
// the sky barely breathes. `scale` is the resting overscan; kept near 1 so the full
// painted width of the art shows (the bitmaps carry their own vertical headroom).
// CSS base scales in hero.css `.hero-layer-N` must match `scale` here.
// `mouse` is the ± px of cursor parallax per layer (deeper = more).
const LAYERS = [
  { key: 'layer1', from: 0.0, to: -0.02, scale: 1.05, grow: 0.0, mouse: 5 }, // sky
  { key: 'layer2', from: 0.0, to: -0.05, scale: 1.12, grow: 0.04, mouse: 11 }, // midground
  { key: 'layer3', from: 0.55, to: -0.04, scale: 1.12, grow: 0.1, mouse: 19 }, // foreground
]

// Static composition used when prefers-reduced-motion: a mid-glide pose (cliff
// partially risen) so the scene reads complete without any scroll animation.
const REDUCED_POSE = 0.35

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
  const glowRef = useRef(null)
  const contentRef = useRef(null)
  const stageRef = useRef(null)

  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    const refs = { layer1: layer1Ref, layer2: layer2Ref, layer3: layer3Ref }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(pointer: fine)').matches

    // rAF-smoothed state: `shown` chases raw scroll progress and mx/my chase the
    // cursor, so wheel steps and pointer moves render as a continuous glide.
    let raw = 0
    let shown = reduce ? REDUCED_POSE : 0
    let mx = 0, my = 0, tmx = 0, tmy = 0
    let rafId
    let lastTick = performance.now()

    const readScroll = () => {
      const max = scroller.scrollHeight - scroller.clientHeight
      raw = max > 0 ? Math.min(1, scroller.scrollTop / max) : 0
    }

    const onScroll = () => {
      readScroll()
      // If the rAF loop is stalled (hidden webview, battery-saver throttling),
      // track scroll directly; smoothing resumes when frames come back.
      if (!reduce && performance.now() - lastTick > 200) {
        shown = raw
        apply()
      }
      if (raw >= 0.985 && !enteredRef.current) {
        enteredRef.current = true
        onEnter()
      }
    }

    const onMouse = (e) => {
      tmx = e.clientX / window.innerWidth - 0.5
      tmy = e.clientY / window.innerHeight - 0.5
    }

    const apply = () => {
      const h = scroller.clientHeight
      const p = reduce ? REDUCED_POSE : shown
      for (const l of LAYERS) {
        const el = refs[l.key].current
        if (!el) continue
        const y = (l.from + (l.to - l.from) * p) * h - my * l.mouse * 0.6
        el.style.transform =
          `translate3d(${(-mx * l.mouse).toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${(l.scale + p * l.grow).toFixed(4)})`
      }
      // Sun glow rides with the sky layer so it stays anchored to the sun.
      if (glowRef.current) {
        const s = LAYERS[0]
        glowRef.current.style.transform =
          `translate3d(${(-mx * s.mouse).toFixed(2)}px, ${((s.from + (s.to - s.from) * p) * h).toFixed(2)}px, 0)`
      }
      // Title holds through the opening beat, then lifts away and fades.
      if (contentRef.current) {
        const op = 1 - smoothstep(p, 0.06, 0.3)
        contentRef.current.style.opacity = String(op)
        contentRef.current.style.pointerEvents = op < 0.05 ? 'none' : 'auto'
        if (!reduce) contentRef.current.style.transform = `translate3d(0, ${p * -90}px, 0)`
      }
      // Final beat: the whole scene dissolves, handing off to the atlas behind it.
      if (stageRef.current) stageRef.current.style.opacity = String(1 - smoothstep(p, 0.82, 1))
    }

    const tick = () => {
      lastTick = performance.now()
      shown += (raw - shown) * 0.09
      mx += (tmx - mx) * 0.06
      my += (tmy - my) * 0.06
      apply()
      rafId = requestAnimationFrame(tick)
    }

    readScroll()
    apply()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    if (!reduce) {
      if (finePointer) window.addEventListener('mousemove', onMouse, { passive: true })
      rafId = requestAnimationFrame(tick)
    }
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouse)
      if (rafId) cancelAnimationFrame(rafId)
    }
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
          <div ref={layer2Ref} className="hero-layer hero-layer-2" style={{ backgroundImage: `url(${image2Midground})` }}>
            {/* Living details ride the midground's parallax as children of layer 2 */}
            <div className="hero-mist hero-mist-1" aria-hidden="true" />
            <div className="hero-mist hero-mist-2" aria-hidden="true" />
            <div className="hero-birds" aria-hidden="true">
              <svg viewBox="0 0 132 48" width="132" height="48">
                <g className="hb-bob hb-bob-1"><path className="hb" d="M6 18 C9 13 12 13 15 18 C18 13 21 13 24 18" /></g>
                <g className="hb-bob hb-bob-2"><path className="hb hb-s" d="M44 10 C46.5 6 49 6 51.5 10 C54 6 56.5 6 59 10" /></g>
                <g className="hb-bob hb-bob-3"><path className="hb" d="M78 24 C81 19 84 19 87 24 C90 19 93 19 96 24" /></g>
                <g className="hb-bob hb-bob-4"><path className="hb hb-s" d="M112 16 C114 12.5 116 12.5 118 16 C120 12.5 122 12.5 124 16" /></g>
              </svg>
            </div>
          </div>
          <div ref={layer3Ref} className="hero-layer hero-layer-3" style={{ backgroundImage: `url(${image3Foreground})` }} />
          {/* Living light: breathing glow + sweeping rays, anchored over the sun */}
          <div ref={glowRef} className="hero-glow" aria-hidden="true">
            <div className="hero-glow-core" />
            <div className="hero-rays" />
          </div>

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
