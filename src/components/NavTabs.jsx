// NavTabs — the app-shell mode switcher (Atlas / Charts / Reader), rendered in the
// header of each surface so every mode is one click from the others. Routes are
// hash-based (see Root.jsx); `current` marks the active surface.
const MODES = [
  { key: 'atlas', label: 'Atlas', hash: '' },
  { key: 'charts', label: 'Charts', hash: '/visuals' },
  { key: 'reader', label: 'Reader', hash: '/read' },
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
