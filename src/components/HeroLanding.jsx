import { useRef, useEffect, useCallback } from 'react'

// John 1:1 — real Greek (the Gospel was written in Greek), used legibly rather than as
// decorative "Hebrew-ish" texture. Hover reveals the translation.
const GREEK = 'Ἐν ἀρχῇ ἦν ὁ λόγος'
const GREEK_TRANS = 'In the beginning was the Word · John 1:1'

const clamp = v => (v < 0 ? 0 : v > 1 ? 1 : v)

// ---- procedural noise ----
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0
    let t = Math.imul(a ^ a >>> 15, 1 | a)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}
function makeNoise(seed) {
  const r = mulberry32(seed); const p = new Float32Array(512)
  for (let i = 0; i < 512; i++) p[i] = r()
  return function (x) {
    const i = Math.floor(x), f = x - i, a = p[i & 511], b = p[(i + 1) & 511], u = f * f * (3 - 2 * f)
    return a + (b - a) * u
  }
}
function fbm(n, x, oct) {
  let s = 0, amp = 0.5, fr = 1, norm = 0
  for (let o = 0; o < oct; o++) { s += amp * n(x * fr); norm += amp; amp *= 0.5; fr *= 2 }
  return s / norm
}
function grainCanvas(w, h, alpha, seed) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const g = c.getContext('2d'); const img = g.createImageData(w, h); const r = mulberry32(seed)
  for (let i = 0; i < img.data.length; i += 4) { const v = (r() * 255) | 0; img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = alpha }
  g.putImageData(img, 0, 0); return c
}
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a == null ? 1 : a})`
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))

// ---- Golden Hour scene ----
const SKY_TOP = [199, 210, 178], SKY_MID = [234, 223, 191], SKY_HOR = [243, 230, 196]
const HILL_TOP = [[196, 205, 158], [168, 188, 120], [132, 162, 86], [92, 132, 58], [58, 94, 40], [40, 68, 30]]
const HILL_BOT = [[176, 190, 138], [140, 164, 96], [104, 140, 66], [70, 108, 44], [42, 74, 30], [24, 46, 20]]
const BASES = [0.60, 0.66, 0.72, 0.79, 0.86, 0.94]
const AMPS = [26, 34, 44, 56, 70, 88]
const FREQS = [0.35, 0.5, 0.7, 0.95, 1.3, 1.7]

function createScene(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = canvas.clientWidth, h = canvas.clientHeight
  canvas.width = Math.max(1, w * dpr); canvas.height = Math.max(1, h * dpr)
  const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr)
  const noises = [...Array(6)].map((_, i) => makeNoise(11 + i * 7))
  const grain = ctx.createPattern(grainCanvas(220, 220, 14, 99), 'repeat')
  const sunX = w * 0.5, sunY = h * 0.66
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.95)
  skyGrad.addColorStop(0, rgba(SKY_TOP)); skyGrad.addColorStop(0.55, rgba(SKY_MID)); skyGrad.addColorStop(1, rgba(SKY_HOR))
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, h * 0.7)
  sunGrad.addColorStop(0, 'rgba(255,244,208,.9)'); sunGrad.addColorStop(0.4, 'rgba(248,232,190,.35)'); sunGrad.addColorStop(1, 'rgba(248,232,190,0)')
  const vig = ctx.createRadialGradient(w / 2, h * 0.5, h * 0.3, w / 2, h * 0.5, h * 0.85)
  vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(30,26,10,.22)')

  function draw(t, px, py) {
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = sunGrad; ctx.fillRect(0, 0, w, h)
    // god rays
    ctx.save(); ctx.globalCompositeOperation = 'lighter'
    for (let i = 0; i < 7; i++) {
      const ang = -Math.PI / 2 + (i - 3) * 0.16 + Math.sin(t * 0.0002 + i) * 0.02
      const len = h * 1.1, ww = 26 + 18 * Math.sin(t * 0.0004 + i * 1.7)
      ctx.save(); ctx.translate(sunX, sunY); ctx.rotate(ang)
      const rg = ctx.createLinearGradient(0, 0, 0, -len)
      rg.addColorStop(0, 'rgba(255,246,214,.10)'); rg.addColorStop(1, 'rgba(255,246,214,0)')
      ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(-ww, 0); ctx.lineTo(ww, 0); ctx.lineTo(ww * 3, -len); ctx.lineTo(-ww * 3, -len); ctx.closePath(); ctx.fill()
      ctx.restore()
    }
    ctx.restore()
    // clouds
    ctx.save(); ctx.globalAlpha = 0.5; ctx.filter = 'blur(18px)'
    for (let i = 0; i < 4; i++) {
      const cx = (w * (0.15 + i * 0.26) + t * 0.006 * (i % 2 ? 1 : -1)) % (w + 300) - 150, cy = h * (0.16 + 0.05 * i)
      ctx.fillStyle = 'rgba(255,252,240,.5)'; ctx.beginPath(); ctx.ellipse(cx, cy, 120, 26, 0, 0, 7); ctx.fill()
    }
    ctx.restore(); ctx.filter = 'none'
    // hills
    const step = 6
    for (let li = 0; li < 6; li++) {
      const baseY = h * BASES[li], depth = li / 5, par = px * (6 + depth * 22)
      const ridge = x => baseY - AMPS[li] * (fbm(noises[li], (x + par) * 0.004 * FREQS[li] * 4 + li * 10, 4) - 0.5) * 2 + py * depth * 10
      ctx.beginPath(); ctx.moveTo(0, h)
      for (let x = 0; x <= w + step; x += step) ctx.lineTo(x, ridge(x))
      ctx.lineTo(w, h); ctx.closePath()
      if (li < 4) { ctx.save(); ctx.filter = 'blur(12px)'; ctx.fillStyle = rgba(mix(SKY_HOR, HILL_TOP[li], 0.5), 0.5 - li * 0.09); ctx.fill(); ctx.restore(); ctx.filter = 'none' }
      const g = ctx.createLinearGradient(0, baseY - AMPS[li], 0, h)
      g.addColorStop(0, rgba(HILL_TOP[li])); g.addColorStop(1, rgba(HILL_BOT[li]))
      ctx.fillStyle = g; ctx.fill()
      ctx.save(); ctx.clip()
      ctx.strokeStyle = 'rgba(255,244,206,' + (0.16 - li * 0.02) + ')'; ctx.lineWidth = 3; ctx.filter = 'blur(2px)'
      ctx.beginPath(); for (let x = 0; x <= w + step; x += step) { x === 0 ? ctx.moveTo(x, ridge(x)) : ctx.lineTo(x, ridge(x)) } ctx.stroke(); ctx.filter = 'none'
      const vg = ctx.createLinearGradient(0, baseY, 0, h); vg.addColorStop(0, 'rgba(20,40,16,0)'); vg.addColorStop(1, 'rgba(16,32,12,' + (0.12 + depth * 0.18) + ')')
      ctx.fillStyle = vg; ctx.fillRect(0, baseY - AMPS[li], w, h)
      ctx.restore()
    }
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.5; ctx.fillStyle = grain; ctx.fillRect(0, h * 0.5, w, h * 0.5); ctx.restore()
    ctx.fillStyle = vig; ctx.fillRect(0, 0, w, h)
  }
  return draw
}

export default function HeroLanding({ onEnter }) {
  const scrollRef = useRef(null)
  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const contentRef = useRef(null)
  const overlayRef = useRef(null)
  const drawRef = useRef(null)
  const progress = useRef(0)
  const pointer = useRef({ x: 0, y: 0 })
  const eased = useRef({ x: 0, y: 0 })
  const rafRef = useRef(0)
  const enteredRef = useRef(false)
  const reduced = useRef(false)

  const applyScroll = useCallback(() => {
    const p = progress.current
    if (contentRef.current) {
      contentRef.current.style.transform = `translateY(${-p * 150}px)`
      contentRef.current.style.opacity = String(1 - clamp(p / 0.42))
    }
    // deepen to the app background so the reveal matches light OR dark theme
    if (overlayRef.current) overlayRef.current.style.opacity = String(clamp((p - 0.15) / 0.7))
    if (stageRef.current) {
      stageRef.current.style.transform = `translateY(${-p * 4}vh) scale(${1 + p * 0.14})`
      stageRef.current.style.opacity = String(1 - clamp((p - 0.82) / 0.16))
    }
    if (p >= 0.985 && !enteredRef.current) { enteredRef.current = true; onEnter() }
  }, [onEnter])

  useEffect(() => {
    reduced.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const canvas = canvasRef.current
    const scroller = scrollRef.current
    if (!canvas || !scroller) return

    drawRef.current = createScene(canvas)
    drawRef.current(0, 0, 0) // synchronous first frame

    const loop = t => {
      const tp = pointer.current
      eased.current.x += (tp.x - eased.current.x) * 0.06
      eased.current.y += (tp.y - eased.current.y) * 0.06
      drawRef.current?.(reduced.current ? 0 : t, eased.current.x, eased.current.y)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    const onScroll = () => {
      const max = scroller.scrollHeight - scroller.clientHeight
      progress.current = max > 0 ? clamp(scroller.scrollTop / max) : 0
      applyScroll()
    }
    const onPointer = e => {
      if (reduced.current) return
      pointer.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 }
    }
    const onResize = () => { drawRef.current = createScene(canvas); drawRef.current(0, eased.current.x, eased.current.y) }

    scroller.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onPointer)
    window.addEventListener('resize', onResize)
    applyScroll()
    return () => {
      cancelAnimationFrame(rafRef.current)
      scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('resize', onResize)
    }
  }, [applyScroll])

  const enter = () => {
    const scroller = scrollRef.current
    if (!scroller || reduced.current) return onEnter()
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
  }

  return (
    <div className="hero" ref={scrollRef}>
      <div className="hero-stage" ref={stageRef}>
        <canvas className="hero-scene" ref={canvasRef} aria-hidden="true" />

        <div className="hero-content" ref={contentRef}>
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

        <div className="hero-fade" ref={overlayRef} />
      </div>

      {/* scroll runway — generates the parallax descent */}
      <div className="hero-runway" />
    </div>
  )
}
