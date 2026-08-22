import { useMemo } from 'react'
import { PLAN_BY_ID } from '../lib/sitePlans.js'

// Town plans cannot live on the map. A viewBox unit is 428 m at this
// projection, so Capernaum's 300 m of shore is 22 px wide even at the k=32
// ceiling, and a readable plan would want about k=430 — where the basemap, the
// hillshade and the contours are all an order of magnitude past their own
// resolution. So a plan is drawn at its own scale, and earns the right to be
// drawn large by carrying a metre scale bar and its true footprint on its face.
export default function SitePlan({ cityId, onClose }) {
  const plan = cityId ? PLAN_BY_ID[cityId] : null

  const geom = useMemo(() => {
    if (!plan) return null
    const [W, H] = plan.footprint
    const PAD = 28
    return { W, H, PAD, vb: `${-W / 2 - PAD} ${-H / 2 - PAD} ${W + PAD * 2} ${H + PAD * 2}` }
  }, [plan])

  if (!plan) return null
  const { W, H, vb } = geom
  // A round number of metres that fits comfortably under the plan
  const barM = W > 350 ? 100 : 50

  return (
    <aside className="sp" role="dialog" aria-label={`Schematic plan of ${plan.name}`}>
      <header className="sp-head">
        <div>
          <h2 className="sp-title">{plan.name}</h2>
          <p className="sp-modern">{plan.modern}</p>
        </div>
        <button className="sp-close" onClick={onClose}>Close ×</button>
      </header>

      <div className="sp-facts">
        <span><b>{plan.footprint[0]} × {plan.footprint[1]} m</b></span>
        <span>{plan.hectares} hectares</span>
        <span>{plan.people}</span>
      </div>

      <svg className="sp-svg" viewBox={vb} preserveAspectRatio="xMidYMid meet" role="img"
        aria-label={`${plan.name}: ${plan.footprint[0]} by ${plan.footprint[1]} metres`}>
        <defs>
          <pattern id="sp-hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="7" className="sp-hatch-line" />
          </pattern>
        </defs>

        {/* The lake edge, where there is one — these are shore towns and the
            water is why they existed at all */}
        {plan.shore && (
          <rect className="sp-water"
            x={plan.shore === 'east' ? W / 2 - 6 : -W / 2 - 28}
            y={plan.shore === 'south' ? H / 2 - 6 : -H / 2 - 28}
            width={plan.shore === 'east' ? 40 : W + 56}
            height={plan.shore === 'south' ? 40 : H + 56} />
        )}

        <rect className="sp-extent" x={-W / 2} y={-H / 2} width={W} height={H} rx={6} />

        <g className="sp-streets">
          {plan.streets.map((s, i) => (
            <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
          ))}
        </g>

        <g className="sp-blocks">
          {plan.blocks.map((b, i) => (
            <rect key={i} x={b.x - b.w / 2} y={b.y - b.h / 2} width={b.w} height={b.h}
              transform={`rotate(${b.r} ${b.x} ${b.y})`} />
          ))}
        </g>

        <g className="sp-landmarks">
          {plan.landmarks.map(l => (
            <g key={l.id} className={`sp-lm sp-lm--${l.kind}`}>
              <rect x={l.x - l.w / 2} y={l.y - l.h / 2} width={l.w} height={l.h} rx={2} />
              <text x={l.x} y={l.y - l.h / 2 - 5} textAnchor="middle">{l.label}</text>
              <text x={l.x} y={l.y + l.h / 2 + 9} textAnchor="middle" className="sp-lm-sub">{l.sub}</text>
            </g>
          ))}
        </g>

        {/* Scale bar in real metres — the whole point of drawing it this large */}
        <g className="sp-scale" transform={`translate(${-W / 2},${H / 2 + 16})`}>
          <line x1={0} y1={0} x2={barM} y2={0} />
          <line x1={0} y1={-4} x2={0} y2={4} />
          <line x1={barM} y1={-4} x2={barM} y2={4} />
          <text x={barM / 2} y={-7} textAnchor="middle">{barM} m</text>
        </g>
      </svg>

      <p className="sp-basis">
        <span className="sp-tag">Schematic</span>
        {plan.basis}
      </p>
    </aside>
  )
}
