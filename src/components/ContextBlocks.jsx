// ContextBlocks — the one block renderer both Context formats share.
//
// A section's `blocks` array is a list of typed objects; this walks them. Prose
// strings run through fmt(), a two-token inline formatter: **bold** and
// _italic_. Nothing heavier — the content is data, not markup.
//
// Cross-link hrefs (`xlinks`) are full route hashes like `#/gospels/324`. Never
// emit a bare `#anchor` — this app routes on window.location.hash and a fragment
// link would blow away the current route.

function fmt(text) {
  if (typeof text !== 'string') return text
  return text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={i}>{p.slice(2, -2)}</strong>
    if (/^_[^_]+_$/.test(p)) return <em key={i}>{p.slice(1, -1)}</em>
    return p
  })
}

function Para({ text }) {
  return <p className="ctx-p">{fmt(text)}</p>
}

function Sub({ text }) {
  return <h3 className="ctx-sub">{fmt(text)}</h3>
}

function List({ items = [] }) {
  return (
    <ul className="ctx-list">
      {items.map((it, i) => (
        <li key={i}>{fmt(it)}</li>
      ))}
    </ul>
  )
}

function Verse({ text, ref: reference }) {
  return (
    <div className="ctx-verse">
      <div className="ctx-verse-t">{text}</div>
      {reference ? <div className="ctx-verse-r">{reference}</div> : null}
    </div>
  )
}

function Callout({ label, text }) {
  const paras = Array.isArray(text) ? text : [text]
  return (
    <div className="ctx-callout">
      {label ? <div className="ctx-callout-l">{label}</div> : null}
      {paras.map((p, i) => (
        <p key={i}>{fmt(p)}</p>
      ))}
    </div>
  )
}

function Example({ heading, text, refs }) {
  const paras = Array.isArray(text) ? text : [text]
  return (
    <div className="ctx-example">
      <div className="ctx-example-l">Worked example</div>
      {heading ? <h3>{heading}</h3> : null}
      {paras.map((p, i) => (
        <p key={i}>{fmt(p)}</p>
      ))}
      {refs ? <p className="ctx-example-refs">{refs}</p> : null}
    </div>
  )
}

function Compare({ items = [] }) {
  return (
    <div className="ctx-compare">
      {items.map((it, i) => (
        <div key={i}>
          <div className="ctx-compare-l">{it.label}</div>
          <p>{fmt(it.text)}</p>
        </div>
      ))}
    </div>
  )
}

function XLinks({ items = [] }) {
  return (
    <div className="ctx-xlinks">
      {items.map((it, i) => (
        <a key={i} className="ctx-xlink" href={it.href}>
          {it.label}
        </a>
      ))}
    </div>
  )
}

function Sources({ items = [] }) {
  return (
    <ul className="ctx-sources">
      {items.map((it, i) => (
        <li key={i}>
          <span className="ctx-src-tag">{it.tag}</span>
          <span className="ctx-src-body">{fmt(it.text)}</span>
        </li>
      ))}
    </ul>
  )
}

function Honesty({ text }) {
  const paras = Array.isArray(text) ? text : [text]
  return (
    <div className="ctx-honesty">
      <div className="ctx-honesty-l">Where readers differ</div>
      {paras.map((p, i) => (
        <p key={i}>{fmt(p)}</p>
      ))}
    </div>
  )
}

function Draft({ points = [] }) {
  return (
    <div className="ctx-draft">
      <div className="ctx-draft-l">Draft in progress · planned outline</div>
      <ul>
        {points.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    </div>
  )
}

export default function ContextBlocks({ blocks = [] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'p':
            return <Para key={i} text={b.text} />
          case 'h':
            return <Sub key={i} text={b.text} />
          case 'list':
            return <List key={i} items={b.items} />
          case 'verse':
            return <Verse key={i} text={b.text} ref={b.ref} />
          case 'callout':
            return <Callout key={i} label={b.label} text={b.text} />
          case 'example':
            return <Example key={i} heading={b.heading} text={b.text} refs={b.refs} />
          case 'compare':
            return <Compare key={i} items={b.items} />
          case 'xlinks':
            return <XLinks key={i} items={b.items} />
          case 'sources':
            return <Sources key={i} items={b.items} />
          case 'honesty':
            return <Honesty key={i} text={b.text} />
          case 'draft':
            return <Draft key={i} points={b.points} />
          default:
            return null
        }
      })}
    </>
  )
}
