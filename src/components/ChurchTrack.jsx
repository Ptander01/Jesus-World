import { useMemo, useState, useEffect, useRef } from 'react'
import journeyData from '../data/gospels-data.json'
import { buildStopLayout, STOP_MARGIN_X } from '../utils/stopLayout'
import TimelineDefs from './TimelineDefs'
import { mat } from '../utils/timelineMaterial'

const TRACK_Y = 28   // vertical center of SVG
const SVG_H   = 56

// founding → gold diamond; letter-received → teal diamond; support → gold circle; leadership → purple circle
const EVENT_CFG = {
  founding:          { shape: 'diamond', color: '#c9a84c', size: 8  },
  'letter-received': { shape: 'diamond', color: '#4A7C6F', size: 7  },
  support:           { shape: 'circle',  color: '#c9a84c', size: 5  },
  leadership:        { shape: 'circle',  color: '#7B6FA0', size: 5  },
}

const cityById = Object.fromEntries(journeyData.cities.map(c => [c.id, c]))

export default function ChurchTrack({ journey, churchId, events, timelineYear }) {
  const [hoveredId, setHoveredId]   = useState(null)
  const [pulsing, setPulsing]       = useState(new Set())
  const prevYearRef                  = useRef(null)
  const pulsedRef                    = useRef(new Set())

  const { totalWidth, xFromYear } = useMemo(
    () => buildStopLayout(journey),
    [journey]
  )

  // Several church tracks are on screen at once, so the material defs need a
  // per-instance id — SVG ids are document-scoped and would otherwise collide.
  const defsId = `ct-${churchId}`
  const P = useMemo(() => mat(defsId), [defsId])

  useEffect(() => {
    if (timelineYear === null || timelineYear === undefined) {
      prevYearRef.current = null
      pulsedRef.current.clear()
      return
    }
    const prev = prevYearRef.current
    prevYearRef.current = timelineYear

    if (prev === null) return

    // Scrubbing backward — reset pulse tracking for events now in the future
    if (timelineYear < prev) {
      events.forEach(ev => { if (ev.year > timelineYear) pulsedRef.current.delete(ev.id) })
      return
    }

    const newlyCrossed = events.filter(ev =>
      ev.year > prev && ev.year <= timelineYear && !pulsedRef.current.has(ev.id)
    )
    if (!newlyCrossed.length) return

    setPulsing(p => {
      const next = new Set(p)
      newlyCrossed.forEach(ev => next.add(ev.id))
      return next
    })
    newlyCrossed.forEach(ev => {
      pulsedRef.current.add(ev.id)
      setTimeout(() => {
        setPulsing(p => { const next = new Set(p); next.delete(ev.id); return next })
      }, 700)
    })
  }, [timelineYear, events])

  const churchName = cityById[churchId]?.name
    ?? (churchId.charAt(0).toUpperCase() + churchId.slice(1))

  return (
    <div className="ct-track-scroll">
      <svg width={totalWidth} height={SVG_H} style={{ display: 'block' }}>
        <TimelineDefs id={defsId} />

        {/* Track line */}
        <line
          x1={STOP_MARGIN_X} x2={totalWidth - STOP_MARGIN_X}
          y1={TRACK_Y} y2={TRACK_Y}
          stroke="#c9a84c" strokeWidth={1} strokeOpacity={0.15} strokeDasharray="4 4"
        />

        {/* Church name */}
        <text
          x={STOP_MARGIN_X} y={TRACK_Y - 10}
          fontFamily="Cinzel, serif" fontSize={11}
          letterSpacing={2} fill="#7a6430"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {churchName.toUpperCase()}
        </text>

        {/* Event markers */}
        {events.map((ev, i) => {
          const cx  = xFromYear(ev.year)
          const cfg = EVENT_CFG[ev.type] ?? EVENT_CFG['letter-received']
          const above   = i % 2 === 0
          const hovered = hoveredId === ev.id

          const labelY = above
            ? TRACK_Y - cfg.size - 5
            : TRACK_Y + cfg.size + 12

          return (
            <g
              key={ev.id}
              onMouseEnter={() => setHoveredId(ev.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ cursor: 'default' }}
            >
              {/* Vertical connector tick */}
              <line
                x1={cx} x2={cx}
                y1={TRACK_Y - cfg.size - 1}
                y2={TRACK_Y + cfg.size + 1}
                stroke={cfg.color}
                strokeWidth={0.5}
                strokeOpacity={0.3}
                style={{ pointerEvents: 'none' }}
              />

              {/* Marker shape — coloured body under a sheen/bevel pass */}
              {cfg.shape === 'diamond' ? (
                <g className={pulsing.has(ev.id) ? 'ct-marker-pulse' : undefined} filter={P.cast}>
                  <polygon
                    points={`${cx},${TRACK_Y - cfg.size} ${cx + cfg.size},${TRACK_Y} ${cx},${TRACK_Y + cfg.size} ${cx - cfg.size},${TRACK_Y}`}
                    fill={cfg.color}
                    fillOpacity={hovered ? 0.45 : 0.18}
                    stroke={cfg.color}
                    strokeWidth={1.2}
                    strokeOpacity={hovered ? 1 : 0.8}
                  />
                  <polygon
                    points={`${cx},${TRACK_Y - cfg.size} ${cx + cfg.size},${TRACK_Y} ${cx},${TRACK_Y + cfg.size} ${cx - cfg.size},${TRACK_Y}`}
                    fill={P.sheen} stroke={P.bevel} strokeWidth={0.9}
                    style={{ pointerEvents: 'none' }}
                  />
                </g>
              ) : (
                <g className={pulsing.has(ev.id) ? 'ct-marker-pulse' : undefined} filter={P.cast}>
                  <circle
                    cx={cx} cy={TRACK_Y} r={cfg.size}
                    fill={cfg.color}
                    fillOpacity={hovered ? 0.45 : 0.18}
                    stroke={cfg.color}
                    strokeWidth={1.2}
                    strokeOpacity={hovered ? 1 : 0.8}
                  />
                  <circle cx={cx} cy={TRACK_Y} r={cfg.size} fill={P.dome}
                    style={{ pointerEvents: 'none' }} />
                  <circle cx={cx} cy={TRACK_Y} r={Math.max(0.5, cfg.size - 0.6)}
                    fill="none" stroke={P.bevel} strokeWidth={1}
                    style={{ pointerEvents: 'none' }} />
                </g>
              )}

              {/* Primary label */}
              <text
                x={cx} y={labelY}
                textAnchor="middle"
                fontFamily="Cormorant Garamond, Georgia, serif"
                fontStyle="italic"
                fontSize={11}
                fill={hovered ? 'var(--cream)' : 'var(--cream-dim)'}
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {ev.label}
              </text>

              {/* Sublabel — shown on hover */}
              {hovered && (
                <text
                  x={cx}
                  y={above ? labelY - 11 : labelY + 11}
                  textAnchor="middle"
                  fontFamily="Cormorant Garamond, Georgia, serif"
                  fontStyle="italic"
                  fontSize={10}
                  fill="var(--muted)"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {ev.sublabel}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
