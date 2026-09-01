// ContextPane — the #/context surface. Teaches how to read what the atlas shows,
// drawing on Fee & Stuart and the BEMA project in the app's own voice.
//
// #/context           → the index (hero + grouped topic cards)
// #/context/<slug>     → one study, rendered by ContextStudy or ContextGuide
//                        depending on the topic's `format`
//
// Routing is hash-based and owned by Root.jsx; this component just takes `slug`.
// It shares the atlas shell: app-header + NavTabs + ThemeToggle from the other
// surfaces, and it scrolls in its own container (the shell locks document
// scroll).

import { useEffect, useState } from 'react'
import NavTabs from './NavTabs.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import ContextStudy from './ContextStudy.jsx'
import ContextGuide from './ContextGuide.jsx'
import { GROUPS, TOPICS, SOURCES, topicBySlug } from '../data/context/index.js'
import '../styles/context.css'

// Per-topic content modules, lazy. The registry (index.js) is excluded — it is a
// static import above, and letting the glob match it too triggers Vite's
// INEFFECTIVE_DYNAMIC_IMPORT notice.
const CONTENT = import.meta.glob(['../data/context/*.js', '!../data/context/index.js'])

function Index() {
  return (
    <div className="ctx-col">
      <div className="ctx-hero">
        <div className="ctx-eyebrow">Jesus's World · Context</div>
        <h1 className="ctx-hero-title">
          Reading the Gospels <span>Well</span>
        </h1>
        <p className="ctx-hero-desc">
          Short studies on the world behind the text and the craft of reading it — so the
          map, the timeline and the plan land the way they were meant to.
        </p>
        <p className="ctx-hero-verse">
          &ldquo;And beginning with Moses and all the Prophets, he interpreted to them in
          all the Scriptures the things concerning himself.&rdquo;
          <b>Luke 24:27</b>
        </p>
      </div>

      {GROUPS.map((g) => {
        const topics = TOPICS.filter((t) => t.group === g.id)
        if (!topics.length) return null
        return (
          <section key={g.id} className="ctx-group">
            <div className="ctx-group-head">
              <div className="ctx-eyebrow">{g.part}</div>
              <h2>{g.title}</h2>
              <p>{g.blurb}</p>
            </div>
            <div className="ctx-card-grid">
              {topics.map((t) => (
                <a
                  key={t.slug}
                  className="ctx-card"
                  href={`#/context/${t.slug}`}
                  style={{ '--card-accent': t.accent }}
                >
                  <span className="ctx-card-kind">{t.kind}</span>
                  <span className="ctx-card-name">{t.name}</span>
                  <span className="ctx-card-hook">{t.hook}</span>
                  <span className="ctx-card-meta">
                    <span className="ctx-card-fmt">
                      {t.format === 'guide' ? 'Guide' : 'Study'}
                    </span>
                    {(t.sources || []).map((k) =>
                      SOURCES[k] ? (
                        <span key={k} className="ctx-card-src">
                          {SOURCES[k].tag}
                        </span>
                      ) : null,
                    )}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function Missing({ slug }) {
  return (
    <div className="ctx-col">
      <div className="ctx-missing">
        <div className="ctx-eyebrow">Not found</div>
        <p>
          There&rsquo;s no context study at <code>{slug}</code> yet.
        </p>
        <a href="#/context">&larr; Back to Context</a>
      </div>
    </div>
  )
}

function Topic({ slug, scrollParent }) {
  const topic = topicBySlug(slug)
  const loader = CONTENT[`../data/context/${slug}.js`]
  const [content, setContent] = useState(null)

  useEffect(() => {
    if (!loader) return
    let alive = true
    loader().then((m) => {
      if (alive) setContent(m.default)
    })
    return () => {
      alive = false
    }
  }, [loader])

  if (!topic || !loader) return <Missing slug={slug} />
  if (!content) return <div className="ctx-col" />

  return (
    <div className="ctx-col">
      <a className="ctx-back" href="#/context">
        &larr; Context
      </a>
      {topic.format === 'guide' ? (
        <ContextGuide topic={topic} content={content} scrollParent={scrollParent} />
      ) : (
        <ContextStudy topic={topic} content={content} />
      )}
    </div>
  )
}

export default function ContextPane({ slug = null, theme = 'dark', onThemeChange }) {
  const [scrollEl, setScrollEl] = useState(null)

  return (
    <div className="ctx-page">
      <header className="app-header">
        <h1>Jesus&rsquo;s World</h1>
        <NavTabs current="context" />
        <ThemeToggle
          theme={theme}
          onToggle={() => onThemeChange?.(theme === 'dark' ? 'light' : 'dark')}
        />
      </header>

      <div className="ctx-scroll" ref={setScrollEl}>
        {slug ? (
          <Topic key={slug} slug={slug} scrollParent={scrollEl} />
        ) : (
          <Index />
        )}
      </div>
    </div>
  )
}
