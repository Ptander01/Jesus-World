// JerusalemDiagram.jsx — an artistic, schematic reconstruction of Jerusalem and its
// immediate environs for the Passion Week reader. Unlike MapView, this is NOT a
// geographic projection: positions are hand-placed for legibility and composition,
// the way an illustrated study-Bible map is drawn rather than surveyed. It exists
// because the regional map puts six of the week's most consequential scenes (the
// temple, the supper, the arrest, the cross, the tomb, Thomas) on the exact same
// pin — "Jerusalem" — so the map never moves when the story does. This spreads
// them across the real, if schematic, geography of one crowded week in one city.
//
// `activeSite` (a key into SITES) gets the glow-pulse; everything else stays lit
// but quiet, so the whole scene remains legible while one place carries the beat.

const VB_W = 1200
const VB_H = 700

// kind: 'zone' (large hatched hill — no number, e.g. the Temple Mount), 'pin'
// (numbered circle), 'special' (numbered circle + dashed halo, for the week's two
// most dramatic single-point scenes), or 'edge' (off to the side, arrow-flagged —
// Bethphage and Bethany sit outside this diagram's frame entirely).
// This sits behind scrolling prose (see reading.css .rd-map-scrim), which fully
// hides everything left of roughly x=700 and stays heavy past that until ~x=900 —
// unlike the Philippi reference (a standalone page), every site here has to live
// inside that right-hand readable band or it simply never renders visibly, active
// glow or not. The whole composition is deliberately compressed into x:640-1180.
const SITES = {
  'temple-mount': {
    kind: 'zone', x: 850, y: 190, rx: 190, ry: 90,
    label: 'THE TEMPLE MOUNT', sub: "Herod's sanctuary, rebuilt from 20 BC",
  },
  'mount-of-olives': {
    kind: 'zone', x: 1090, y: 360, rx: 110, ry: 130,
    label: 'OLIVET', sub: 'A ridge over the Kidron, facing the temple',
  },
  antonia: {
    kind: 'pin', n: 1, x: 940, y: 320,
    label: 'Antonia Fortress', sub: "Pilate's judgment hall (tradition)",
  },
  'upper-room': {
    kind: 'pin', n: 2, x: 760, y: 430,
    label: 'The Upper Room', sub: 'A borrowed room, Mount Zion',
  },
  gethsemane: {
    kind: 'special', n: 3, x: 1045, y: 490,
    label: 'Gethsemane', sub: 'The oil press, at the foot of Olivet',
  },
  golgotha: {
    kind: 'special', n: 4, x: 700, y: 560,
    label: 'Golgotha', sub: 'Outside the wall, beside a road',
  },
  'garden-tomb': {
    kind: 'pin', n: 5, x: 745, y: 632,
    label: 'The Garden Tomb', sub: 'A new tomb, cut from rock',
  },
  bethphage: {
    kind: 'edge', x: 1170, y: 240,
    label: 'BETHPHAGE', sub: 'Over the ridge, on the Jericho road',
  },
  bethany: {
    kind: 'edge', x: 1170, y: 550,
    label: 'BETHANY', sub: 'Two miles east — Lazarus’s village',
  },
}

// City wall — an approximate rectangle enclosing the Upper City / Mount Zion side,
// abutting the temple to its northeast. Corner posts echo the reference sketch's
// walled-colony treatment.
const WALL = { x: 665, y: 300, w: 300, h: 210 }

function CornerPosts({ x, y, w, h }) {
  const s = 14
  const pts = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]
  return (
    <>
      {pts.map(([px, py], i) => (
        <rect key={i} x={px - s / 2} y={py - s / 2} width={s} height={s}
          className="jrs-post" />
      ))}
    </>
  )
}

export default function JerusalemDiagram({ activeSite }) {
  const zones = Object.entries(SITES).filter(([, s]) => s.kind === 'zone')
  const pins = Object.entries(SITES).filter(([, s]) => s.kind === 'pin' || s.kind === 'special')
  const edges = Object.entries(SITES).filter(([, s]) => s.kind === 'edge')

  return (
    <svg className="jrs" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid slice"
      role="img" aria-label="Schematic reconstruction of Jerusalem during Passion Week">
      <defs>
        <pattern id="jrs-hatch" width="9" height="9" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="9" className="jrs-hatch-line" />
        </pattern>
        <filter id="jrs-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ── Kidron Valley — the corridor between the walled city and Olivet ── */}
      <g className="jrs-valley-label">
        <line x1="965" y1="300" x2="1000" y2="600" className="jrs-valley-line" />
        <text x="978" y="450" transform="rotate(80 978 450)" textAnchor="middle">
          KIDRON VALLEY
        </text>
      </g>

      {/* ── Hatched highland zones ── */}
      {zones.map(([id, s]) => (
        <g key={id} className={`jrs-zone${activeSite === id ? ' jrs-zone--on' : ''}`}>
          <ellipse cx={s.x} cy={s.y} rx={s.rx} ry={s.ry} className="jrs-zone-wash" />
          <ellipse cx={s.x} cy={s.y} rx={s.rx} ry={s.ry} className="jrs-zone-hatch" />
          {id === 'temple-mount' && (
            <rect x={s.x - 130} y={s.y - 45} width="260" height="90" className="jrs-sanctuary" />
          )}
          <text x={s.x} y={id === 'temple-mount' ? s.y + 5 : s.y - 4} textAnchor="middle" className="jrs-zone-label">
            {s.label}
          </text>
          <text x={s.x} y={(id === 'temple-mount' ? s.y + 5 : s.y - 4) + 20} textAnchor="middle" className="jrs-zone-sub">
            {s.sub}
          </text>
        </g>
      ))}

      {/* ── City wall — label sits inside, near the top: below the wall is where
          Golgotha and the Garden Tomb crowd in (both traditionally just outside
          the walls), and the two collided there. ── */}
      <rect x={WALL.x} y={WALL.y} width={WALL.w} height={WALL.h} className="jrs-wall" />
      <CornerPosts {...WALL} />
      <text x={WALL.x + 14} y={WALL.y + 22} className="jrs-wall-label">
        THE UPPER CITY
      </text>

      {/* ── Numbered pins + the two special (dashed) dramatic sites ── */}
      {pins.map(([id, s]) => {
        const on = activeSite === id
        const special = s.kind === 'special'
        return (
          <g key={id} className={`jrs-pin${on ? ' jrs-pin--on' : ''}${special ? ' jrs-pin--special' : ''}`}>
            {special && <rect x={s.x - 22} y={s.y - 22} width="44" height="44" className="jrs-special-box" />}
            <circle cx={s.x} cy={s.y} r={special ? 15 : 12} className="jrs-pin-dot"
              filter={on ? 'url(#jrs-glow)' : undefined} />
            <text x={s.x} y={s.y + 4} textAnchor="middle" className="jrs-pin-n">{s.n}</text>
            <text x={s.x} y={s.y - (special ? 34 : 22)} textAnchor="middle" className="jrs-pin-label">
              {special && <tspan className="jrs-pin-ast">✦ </tspan>}
              {s.label}
            </text>
            <text x={s.x} y={s.y - (special ? 34 : 22) + 16} textAnchor="middle" className="jrs-pin-sub">
              {s.sub}
            </text>
          </g>
        )
      })}

      {/* ── Edge markers — Bethphage and Bethany sit outside this frame ── */}
      {edges.map(([id, s]) => {
        const on = activeSite === id
        return (
          <g key={id} className={`jrs-edge${on ? ' jrs-edge--on' : ''}`}>
            <line x1={s.x - 70} y1={s.y} x2={s.x - 8} y2={s.y} className="jrs-edge-line" />
            <path d={`M ${s.x - 8} ${s.y} l -10 -6 l 0 12 z`} className="jrs-edge-arrow" />
            <text x={s.x - 78} y={s.y - 8} textAnchor="end" className="jrs-edge-label">{s.label}</text>
            <text x={s.x - 78} y={s.y + 10} textAnchor="end" className="jrs-edge-sub">{s.sub}</text>
          </g>
        )
      })}

      {/* ── Compass rose — no title card: the reader's own hero header ("The Last
          Week" / "Jerusalem · AD 33") already names the scene; a second title
          floating over the map would only compete with it for the same corner. ── */}
      <g className="jrs-compass" transform={`translate(${VB_W - 60}, 60)`}>
        <circle r="34" className="jrs-compass-ring" />
        <path d="M 0 -27 L 5 -5 L 0 -11 L -5 -5 Z" className="jrs-compass-n" />
        <line x1="0" y1="5" x2="0" y2="27" className="jrs-compass-tick" />
        <line x1="-27" y1="0" x2="-5" y2="0" className="jrs-compass-tick" />
        <line x1="5" y1="0" x2="27" y2="0" className="jrs-compass-tick" />
        <text x="0" y="-38" textAnchor="middle" className="jrs-compass-label">N</text>
      </g>
    </svg>
  )
}
