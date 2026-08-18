// NavTabs — the app-shell mode switcher (Atlas / Charts / Reader), rendered in the
// header of each surface so every mode is one click from the others. Routes are
// hash-based (see Root.jsx); `current` marks the active surface.
// "Reader" is the curated Passion Week essay; "Gospels" is the full 39-day
// chronological read-through. Different jobs, so both get a tab rather than one
// hiding behind the other.
const MODES = [
  { key: 'atlas', label: 'Atlas', hash: '' },
  { key: 'charts', label: 'Charts', hash: '/visuals' },
  { key: 'reader', label: 'Reader', hash: '/read' },
  { key: 'gospels', label: 'Gospels', hash: '/gospels' },
]

export default function NavTabs({ current }) {
  return (
    <nav className="nav-tabs" aria-label="App sections">
      {MODES.map((m) => (
        <a
          key={m.key}
          href={`#${m.hash}`}
          className={`nav-tab${current === m.key ? ' nav-tab--on' : ''}`}
          aria-current={current === m.key ? 'page' : undefined}
        >
          {m.label}
        </a>
      ))}
    </nav>
  )
}
