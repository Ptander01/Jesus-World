// ContextGuide — Format B. One continuous read with a sticky section rail. Used
// for the narrative background topics, which want to be read straight through.
//
// The rail is buttons, not anchor links: this app routes on window.location.hash,
// so a bare `#section` href would replace the route. Buttons scroll the target
// into view inside the pane's own scroll container instead.

import { useEffect, useRef, useState } from 'react'
import ContextBlocks from './ContextBlocks.jsx'

export default function ContextGuide({ topic, content, scrollParent = null }) {
  const [t0, t1] = Array.isArray(content.title) ? content.title : [content.title, '']
  const sections = content.sections || []
  const secRefs = useRef([])
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    const root = scrollParent
    const els = secRefs.current.filter(Boolean)
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = els.indexOf(e.target)
            if (i >= 0) setActiveIdx(i)
          }
        }
      },
      { root, rootMargin: '-12% 0px -78% 0px', threshold: 0 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [scrollParent, sections.length])

  const jump = (i) => {
    secRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <article className="ctx-guide">
      <header className="ctx-lf-head">
        <div className="ctx-eyebrow">{content.eyebrow || topic.kind}</div>
        <h1 className="ctx-lf-title">
          {t0}
          {t1 ? <span>{t1}</span> : null}
        </h1>
        {content.standfirst ? <p className="ctx-lf-standfirst">{content.standfirst}</p> : null}
      </header>

      <div className="ctx-lf-body">
        <nav className="ctx-lf-rail" aria-label="On this page">
          {sections.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={i === activeIdx ? 'on' : undefined}
              onClick={() => jump(i)}
            >
              {s.heading}
            </button>
          ))}
        </nav>

        <div className="ctx-lf-content">
          {sections.map((s, i) => (
            <section
              key={s.id}
              className="ctx-section"
              ref={(el) => {
                secRefs.current[i] = el
              }}
            >
              <div className="ctx-section-head">
                <div className="ctx-sh-title">{s.heading}</div>
                {s.sub ? <div className="ctx-sh-sub">{s.sub}</div> : null}
              </div>
              <ContextBlocks blocks={s.blocks} />
            </section>
          ))}
        </div>
      </div>
    </article>
  )
}
