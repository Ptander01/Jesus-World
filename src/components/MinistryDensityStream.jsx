import { useState, useMemo, useCallback } from "react";
import { densityStream } from "../lib/analysis.js";
import { useInView } from "../hooks/useViz.js";
import "../styles/visuals.css";

const W = 640, H = 240, PAD_X = 40, PAD_Y = 24, PAD_B = 34;

export default function MinistryDensityStream({ filter } = {}) {
  const [kind, setKind] = useState("miracles");
  const [hover, setHover] = useState(null); // band index
  const [ref, inView] = useInView();
  const d = useMemo(() => densityStream(kind, { filter }), [kind, filter]);

  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y - PAD_B;
  const n = d.bands.length;
  const maxTotal = Math.max(...d.bands.map((_, i) => d.series.reduce((a, s) => a + s.values[i], 0)), 1);
  const x = useCallback((i) => PAD_X + (i * innerW) / (n - 1), [innerW, n]);
  const y = useCallback((v) => PAD_Y + innerH - (v / maxTotal) * innerH, [innerH, maxTotal]);

  // cumulative stack per band
  const layers = useMemo(() => {
    return d.series.map((s, li) => {
      const top = d.bands.map((_, i) => d.series.slice(0, li + 1).reduce((a, ss) => a + ss.values[i], 0));
      const bot = d.bands.map((_, i) => d.series.slice(0, li).reduce((a, ss) => a + ss.values[i], 0));
      const topPts = top.map((v, i) => `${x(i)},${y(v)}`);
      const botPts = bot.map((v, i) => `${x(i)},${y(v)}`).reverse();
      return { ...s, path: `M${topPts.join("L")}L${botPts.join("L")}Z` };
    });
  }, [d, x, y]);

  // Clip reveal: derived straight from inView. The 0 -> W attribute change is what
  // the CSS width transition on .jw-stream-clip-rect animates.
  const clipW = inView ? W : 0;

  const bandTotal = (i) => d.series.reduce((a, s) => a + s.values[i], 0);

  return (
    <div className={`jw-viz${inView ? " in" : ""}`} ref={ref}>
      <div className="jw-card">
        <div className="jw-h">The Density Ribbon</div>
        <div className="jw-cap">
          {kind === "miracles" ? "Miracles" : "Parables"} flowing across AD 29-33, stacked by category.
          Hover a period to read its makeup. Built to sit under your timeline scrubber.
        </div>
        <div className="jw-toggle">
          <button className={kind === "miracles" ? "on" : ""} onClick={() => setKind("miracles")}>Miracles</button>
          <button className={kind === "parables" ? "on" : ""} onClick={() => setKind("parables")}>Parables</button>
        </div>

        <div className="jw-stream-wrap jw-stream">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Event density across the ministry timeline">
            <defs>
              <clipPath id="jw-stream-clip">
                <rect x="0" y="0" width={clipW} height={H} className="jw-stream-clip-rect" />
              </clipPath>
            </defs>
            {/* baseline */}
            <line x1={PAD_X} y1={PAD_Y + innerH} x2={W - PAD_X} y2={PAD_Y + innerH} stroke="var(--jw-border)" />
            <g clipPath="url(#jw-stream-clip)">
              {layers.map((l) => (
                <path
                  key={l.key}
                  className="jw-stream-area"
                  d={l.path}
                  fill={l.color}
                  fillOpacity={hover === null ? 0.82 : 0.9}
                  stroke={l.color}
                  strokeOpacity="0.9"
                  strokeWidth="1"
                />
              ))}
            </g>
            {/* hover guide */}
            {hover !== null && (
              <line className="jw-stream-guide on" x1={x(hover)} y1={PAD_Y} x2={x(hover)} y2={PAD_Y + innerH} />
            )}
            {/* x labels + hover zones */}
            {d.bands.map((b, i) => (
              <g key={b.key}>
                <text className={`jw-stream-xlbl${hover === i ? " on" : ""}`} x={x(i)} y={H - 12} textAnchor="middle">
                  {b.short ?? b.label}
                </text>
                <rect
                  x={i === 0 ? 0 : (x(i - 1) + x(i)) / 2}
                  y="0"
                  width={i === 0 ? x(0) + innerW / (n - 1) / 2 : i === n - 1 ? W - (x(i - 1) + x(i)) / 2 : (x(i + 1) - x(i - 1)) / 2}
                  height={H}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
              </g>
            ))}
          </svg>
        </div>

        <div className="jw-legend">
          {d.series.map((s) => (
            <div key={s.key} className="jw-lg"><span className="sw" style={{ background: s.color }} />{s.label}</div>
          ))}
        </div>

        <div className={`jw-tip${hover !== null ? " on" : ""}`} style={{ position: "static", marginTop: 14, maxWidth: "none", display: hover !== null ? "block" : "none" }}>
          {hover !== null && (
            <>
              <div className="tt">{d.bands[hover].label} period · {bandTotal(hover)} {kind}</div>
              <div className="tv">
                {d.series.filter((s) => s.values[hover] > 0).map((s) => `${s.values[hover]} ${s.label.toLowerCase()}`).join(" · ") || "None recorded."}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
