import { useMemo } from 'react'
import * as d3 from 'd3'
import journeyData from '../data/gospels-data.json'
import TimelineDefs from './TimelineDefs'
import { mat, bevelRect } from '../utils/timelineMaterial'

const M = mat('rtl')

const TW = 1200
const BAND_Y = 14
const BAND_H = 13
const TICK_Y = BAND_Y + BAND_H + 4
const SVG_H = 46

const DOMAIN = journeyData.dateRange ?? [29, 33.5]
const xScale = d3.scaleLinear().domain(DOMAIN).range([54, TW - 30])

const PERIODS = journeyData.journeys.map(j => ({
  id: j.id, color: j.color, dr: j.dateRange, name: j.shortName,
  dashed: j.id === 'period-6',
}))

const YEAR_TICKS = [29, 30, 31, 32, 33]

/**
 * The reader's orientation strip: where in the ministry the day you're reading
 * falls. Deliberately not the atlas TimelineBar — that one owns journey toggles,
 * a 4-state disclosure system and a detail mode, none of which mean anything
 * here. This is the same *material* (TimelineDefs) at a glance-sized scale.
 *
 * Each of the 39 days is a tick; the active one is a gold marker. Ticks are
 * click targets, so the timeline doubles as a scrubbable day picker.
 */
export default function ReaderTimeline({ days, activeDay, year, onPickDay }) {
  const ticks = useMemo(
    () => days.map(d => ({ day: d.day, x: xScale(Math.min(Math.max(d.year, DOMAIN[0]), DOMAIN[1])) })),
    [days]
  )
  const markerX = year == null ? null : xScale(Math.min(Math.max(year, DOMAIN[0]), DOMAIN[1]))

  return (
    <div className="gr-timeline">
      <svg viewBox={`0 0 ${TW} ${SVG_H}`} preserveAspectRatio="none" className="gr-tl-svg">
        <TimelineDefs id="rtl" />

        <text x={26} y={BAND_Y + BAND_H / 2 + 3.5} textAnchor="middle"
          fontFamily="Cinzel, serif" fontSize={9} letterSpacing={1} fill="var(--muted)"
        >AD</text>

        {/* Period bands — the same six the atlas uses, as cut grooves with a
            raised, bevelled inlay so they read as the atlas's own material */}
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
                filter={on ? M.cast : M.groove}
              />
              <rect x={bev.x} y={bev.y} width={bev.w} height={bev.h} rx={bev.rx}
                fill={M.sheen} stroke={M.bevel} strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                opacity={on ? 1 : 0.4} pointerEvents="none" />
            </g>
          )
        })}

        {/* Year ticks */}
        {YEAR_TICKS.map(y => (
          <g key={y}>
            <line x1={xScale(y)} x2={xScale(y)} y1={BAND_Y - 4} y2={BAND_Y - 1}
              stroke="var(--border-lt)" strokeWidth={1}
              vectorEffect="non-scaling-stroke" shapeRendering="crispEdges" />
            <text x={xScale(y)} y={BAND_Y - 6} textAnchor="middle"
              fontFamily="Cinzel, serif" fontSize={9.5} fill="var(--muted)">{y}</text>
          </g>
        ))}

        {/* One tick per reading day — also the day picker */}
        {ticks.map(t => (
          <g key={t.day} className="gr-tl-tick" onClick={() => onPickDay?.(t.day)}>
            <title>Day {t.day}</title>
            <rect x={t.x - 4} y={TICK_Y - 2} width={8} height={10} fill="transparent" />
            <line x1={t.x} x2={t.x} y1={TICK_Y} y2={TICK_Y + 5}
              stroke={t.day === activeDay ? 'var(--accent)' : 'var(--border-lt)'}
              strokeWidth={t.day === activeDay ? 1.6 : 1}
              strokeOpacity={t.day === activeDay ? 1 : 0.7}
              vectorEffect="non-scaling-stroke" shapeRendering="crispEdges" />
          </g>
        ))}

        {/* Where you are */}
        {markerX != null && (
          <g pointerEvents="none">
            <line x1={markerX} x2={markerX} y1={BAND_Y - 2} y2={TICK_Y + 6}
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
      </svg>
    </div>
  )
}
