// ContextStudy — Format A. A tabbed study page (Study / In the Atlas / Go Deeper),
// matching the Bible Study Library study layout. Used for the interpretive-method
// topics, where the "In the Atlas" tab is what earns the pane its place.
//
// Sections carry a `tab` key; this groups them into panes. A tab renders only if
// it has at least one section. Labels default to Study / In the Atlas / Go Deeper
// and can be overridden per topic via `content.tabLabels`.

import { useState } from 'react'
import ContextBlocks from './ContextBlocks.jsx'

const TAB_ORDER = ['study', 'atlas', 'deeper']
const DEFAULT_LABELS = { study: 'Study', atlas: 'In the Atlas', deeper: 'Go Deeper' }

export default function ContextStudy({ topic, content }) {
  const labels = { ...DEFAULT_LABELS, ...(content.tabLabels || {}) }
  const byTab = TAB_ORDER.map((id) => ({
    id,
    label: labels[id],
    sections: content.sections.filter((s) => (s.tab || 'study') === id),
  })).filter((t) => t.sections.length > 0)

  const [active, setActive] = useState(byTab[0]?.id ?? 'study')
  const activeTab = byTab.find((t) => t.id === active) ?? byTab[0]
  const [t0, t1] = Array.isArray(content.title) ? content.title : [content.title, '']

  return (
    <article className="ctx-study">
      <header className="ctx-sp-head">
        <div className="ctx-eyebrow">{content.eyebrow || topic.kind}</div>
        <h1 className="ctx-sp-title">
          {t0}
          {t1 ? <span>{t1}</span> : null}
        </h1>
        {content.verse ? (
          <p className="ctx-sp-verse">
            &ldquo;{content.verse.text}&rdquo;
            <b>{content.verse.ref}</b>
          </p>
        ) : content.standfirst ? (
          <p className="ctx-sp-verse">{content.standfirst}</p>
        ) : null}
      </header>

      {byTab.length > 1 ? (
        <div className="ctx-tabs" role="tablist" aria-label="Sections">
          {byTab.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={t.id === active}
              onClick={() => setActive(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="ctx-pane">
        {activeTab.sections.map((s) => (
          <section key={s.id} className="ctx-section">
            <div className="ctx-section-head">
              <div className="ctx-eyebrow">{activeTab.label}</div>
              <div className="ctx-sh-title">{s.heading}</div>
              {s.sub ? <div className="ctx-sh-sub">{s.sub}</div> : null}
            </div>
            <ContextBlocks blocks={s.blocks} />
          </section>
        ))}
      </div>
    </article>
  )
}
