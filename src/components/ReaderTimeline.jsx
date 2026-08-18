import { useMemo, useState } from 'react'
import * as d3 from 'd3'
import journeyData from '../data/gospels-data.json'
import TimelineDefs from './TimelineDefs'
import { mat, bevelRect } from '../utils/timelineMaterial'

const M = mat('rtl')

const TW = 1200
const X0 = 62
const X1 = TW - 30

const BAND_Y = 15
const BAND_H = 13
const DAY_Y = 34          // the day-picker rail
const DAY_H = 9
const SVG_H = 50

const DOMAIN = journeyData.dateRange ?? [29, 33.5]
const xScale = d3.scaleLinear().domain(DOMAIN).range([X0, X1])

const PERIODS = journeyData.journeys.map(j => ({
  id: j.id, color: j.color, dr: j.dateRange, name: j.shortName,
  dashed: j.id === 'period-6',
}))

const YEAR_TICKS = [29, 30, 31, 32, 33]
const HINT_KEY = 'jw-gospels-tl-hint'

/**
 * The reader's orientation strip. Two rows doing two different jobs, because
 * one row cannot do both honestly:
 *
 *   AD   — the true chronological axis: the six period bands, and a marker for
 *          where the day you are reading actually falls in time.
 *   DAYS — an evenly spaced rail, one segment per reading day, 1–39.
 *
 * They are separate because the plan is wildly non-uniform in time: over half
 * the adjacent days sit within 12px of each other on the year axis, and days
 * 311–324 — the whole Passion Week — collapse onto a single point at AD 33.25.
 * Positioning the picker by year made the last third of the plan physically
 * unclickable. The year axis keeps the truth about *when*; the day rail gives
 * every day an equal, reachable target.
 */
export default function ReaderTimeline({ days, activeDay, year, onPickDay }) {
  const [hover, setHover] = useState(null)
  const [hintDone, setHintDone] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem(HINT_KEY) === '1'
  )

  const n = days.length
  const step = (X1 - X0) / Math.max(1, n - 1)
  const dayX = i => X0 + i * step

  const activeIdx = useMemo(() => days.findIndex(d => d.day === activeDay), [days, activeDay])
  const markerX = year == null ? null : xScale(Math.min(Math.max(year, DOMAIN[0]), DOMAIN[1]))

  function pick(i) {
    if (!hintDone) {
      setHintDone(true)
      try { localStorage.setItem(HINT_KEY, '1') } catch { /* private mode — hint just returns next session */ }
    }
    onPickDay?.(days[i].day)
  }

  const hovered = hover == null ? null : days[hover]

  return (
    <div className="gr-timeline">
      {/* Tooltip is HTML, not SVG: the strip stretches with preserveAspectRatio
          ="none", which would squash proportional text, and this way the pill
          reuses the same glass/lip tokens as the rest of the chrome. */}
      {hovered && (
        <div
          className="gr-tl-tip"
          style={{ left: `${(dayX(hover) / TW) * 100}%` }}
          role="presentation"
        >
          <span className="gr-tl-tip-n">Day {hover + 1}</span>
          <span className="gr-tl-tip-cite">{hovered.cite.replace(/ \| /g, ' · ')}</span>
        </div>
      )}

      <svg viewBox={`0 0 ${TW} ${SVG_H}`} preserveAspectRatio="none" className="gr-tl-svg">
        <TimelineDefs id="rtl" />

        <text className="gr-tl-rowlabel" x={30} y={BAND_Y + BAND_H / 2 + 3.5} textAnchor="middle">AD</text>
        <text className="gr-tl-rowlabel" x={30} y={DAY_Y + DAY_H / 2 + 3.5} textAnchor="middle">DAYS</text>

        {/* ── the year axis ── */}
        {PERIODS.map(p => {
          const x1 = xScale(Math.max(DOMAIN[0], p.dr[0]))
          const x2 = Math.max(xScale(Math.min(DOMAIN[1], p.dr[1])), x1 + 6)
          const on = year != null && year >= p.dr[0] && year <= p.dr[1]
          const bev = bevelRect({ x: x1, y: BAND_Y, w: x2 - x1, h: BAND_H, rx: 4 })
          return (
            <g key={p.id}>
              <title>{p.name} · AD {p.dr[0]}–{p.dr[1]}</title>
              <rect x={x1} y={BAND_Y} width={x2 - x1} height={BAND_H} rx={4}
                fill={p.color} fillOpacity={on ? 0.62 : 0.16}
                stroke={p.dashed ? p.color : 'none'}
                strokeDasharray={p.dashed ? '4 3' : undefined}
                strokeOpacity={0.5} strokeWidth={p.dashed ? 1 : 0}
                vectorEffect="non-scaling-stroke"
                filter={on ? M.cast : M.groove} />
              <rect x={bev.x} y={bev.y} width={bev.w} height={bev.h} rx={bev.rx}
                fill={M.sheen} stroke={M.bevel} strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                opacity={on ? 1 : 0.4} pointerEvents="none" />
            </g>
          )
        })}

        {YEAR_TICKS.map(y => (
          <g key={y}>
            <line x1={xScale(y)} x2={xScale(y)} y1={BAND_Y - 4} y2={BAND_Y - 1}
              stroke="var(--border-lt)" strokeWidth={1}
              vectorEffect="non-scaling-stroke" shapeRendering="crispEdges" />
            <text className="gr-tl-year" x={xScale(y)} y={BAND_Y - 6} textAnchor="middle">{y}</text>
          </g>
        ))}

        {markerX != null && (
          <g pointerEvents="none">
            <line x1={markerX} x2={markerX} y1={BAND_Y - 2} y2={BAND_Y + BAND_H + 2}
              stroke="var(--accent)" strokeWidth={1} strokeOpacity={0.75}
              strokeDasharray="3 2" vectorEffect="non-scaling-stroke"
              shapeRendering="crispEdges" />
            <circle cx={markerX} cy={BAND_Y + BAND_H / 2} r={5}
              fill="var(--accent)" fillOpacity={0.92}
              stroke="var(--bg)" strokeWidth={1.4} filter={M.cast} />
            <circle cx={markerX} cy={BAND_Y + BAND_H / 2} r={5} fill={M.dome} />
            <circle cx={markerX} cy={BAND_Y + BAND_H / 2} r={4.4}
              fill="none" stroke={M.bevel} strokeWidth={1}
              vectorEffect="non-scaling-stroke" />
          </g>
        )}

        {/* ── the day rail: a recessed groove the ticks sit in, so it reads as a
              control rather than as more axis furniture ── */}
        <rect x={X0 - 6} y={DAY_Y} width={X1 - X0 + 12} height={DAY_H} rx={4}
          fill="var(--well-bg)" filter={M.groove} pointerEvents="none" />

        {days.map((d, i) => {
          const x = dayX(i)
          const on = i === activeIdx
          const hot = i === hover
          return (
            <g key={d.day}
              className="gr-tl-tick"
              onClick={() => pick(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(h => (h === i ? null : h))}
            >
              <title>Day {i + 1} · {d.cite.replace(/ \| /g, ' · ')}</title>
              {/* Full-height hit target — the tick itself is 1px wide */}
              <rect x={x - step / 2} y={DAY_Y - 3} width={step} height={DAY_H + 6} fill="transparent" />
              <line x1={x} x2={x} y1={DAY_Y + 2} y2={DAY_Y + DAY_H - 2}
                stroke={on ? 'var(--accent)' : 'var(--cream-dim)'}
                strokeWidth={on ? 2.2 : 1}
                strokeOpacity={on ? 1 : (hot ? 0.95 : 0.45)}
                vectorEffect="non-scaling-stroke" shapeRendering="crispEdges" />
            </g>
          )
        })}

        {/* The day you're on, echoed as a knob on the rail */}
        {activeIdx >= 0 && (
          <g pointerEvents="none">
            <circle cx={dayX(activeIdx)} cy={DAY_Y + DAY_H / 2} r={4.6}
              fill="var(--accent)" fillOpacity={0.95}
              stroke="var(--bg)" strokeWidth={1.3} filter={M.cast} />
            <circle cx={dayX(activeIdx)} cy={DAY_Y + DAY_H / 2} r={4.6} fill={M.dome} />
            <circle cx={dayX(activeIdx)} cy={DAY_Y + DAY_H / 2} r={4}
              fill="none" stroke={M.bevel} strokeWidth={1}
              vectorEffect="non-scaling-stroke" />
          </g>
        )}
      </svg>

      {!hintDone && (
        <span className="gr-tl-hint" aria-hidden="true">Click any day below to jump</span>
      )}
    </div>
  )
}
