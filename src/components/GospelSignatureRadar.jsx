import { useState, useMemo } from "react";
import { gospelSignature } from "../lib/analysis.js";
import { useInView } from "../hooks/useViz.js";
import "../styles/visuals.css";

const SIZE = 340, CX = SIZE / 2, CY = SIZE / 2, R = 120;
// Axis labels sit at R+20 and are anchored start/end, so the long ones ("Forgiveness",
// "Discipleship", "Prayer") run past a tight 0 0 340 340 box at both sides. Pad the
// viewBox horizontally rather than pulling the labels in over the plot.
const PAD_X = 72;

export default function GospelSignatureRadar({ filter, isolate = null } = {}) {
  const [kind, setKind] = useState("parables");
  const [hover, setHover] = useState(null); // gospel key
  const [ref, inView] = useInView();
  const { axes, series } = useMemo(() => gospelSignature(kind, { filter }), [kind, filter]);
  const active = hover ?? isolate; // hover wins; otherwise the Lens can pre-isolate

  const n = axes.length;
  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const maxNorm = Math.max(...series.flatMap((s) => s.norm), 0.01);
  const pt = (i, rr) => [CX + Math.cos(angle(i)) * rr, CY + Math.sin(angle(i)) * rr];
  const polygon = (norm) => norm.map((v, i) => pt(i, (v / maxNorm) * R).join(",")).join(" ");
  const rings = [0.33, 0.66, 1];

  return (
    <div className={`jw-viz${inView ? " in" : ""}`} ref={ref}>
      <div className="jw-card">
        <div className="jw-h">Each Gospel's Fingerprint</div>
        <div className="jw-cap">
          The share of each Gospel's {kind} that falls in each category — shape, not size.
          Matthew leans kingdom; Luke spreads toward grace and prayer. Hover a Gospel to isolate it.
        </div>
        <div className="jw-toggle">
          <button className={kind === "parables" ? "on" : ""} onClick={() => setKind("parables")}>Parables</button>
          <button className={kind === "miracles" ? "on" : ""} onClick={() => setKind("miracles")}>Miracles</button>
        </div>

        <div className="jw-radar-wrap">
          <svg viewBox={`${-PAD_X} 0 ${SIZE + PAD_X * 2} ${SIZE}`} className="jw-radar" role="img" aria-label="Gospel emphasis radar">
            {/* rings */}
            {rings.map((r, i) => (
              <polygon
                key={i}
                className="jw-radar-ring"
                points={axes.map((_, ai) => pt(ai, R * r).join(",")).join(" ")}
              />
            ))}
            {/* axes + labels */}
            {axes.map((a, i) => {
              const [ex, ey] = pt(i, R);
              const [lx, ly] = pt(i, R + 20);
              return (
                <g key={a.key}>
                  <line className="jw-radar-axis" x1={CX} y1={CY} x2={ex} y2={ey} />
                  <text
                    className="jw-radar-axlbl"
                    x={lx}
                    y={ly}
                    textAnchor={Math.abs(lx - CX) < 8 ? "middle" : lx > CX ? "start" : "end"}
                    dominantBaseline="middle"
                  >
                    {a.label.replace(/ &.*/, "")}
                  </text>
                </g>
              );
            })}
            {/* polygons — skip any Gospel with no events of this kind (e.g. John has no parables) */}
            {series.filter((s) => s.total > 0).map((s, i) => {
              const cls =
                "jw-radar-poly" +
                (active === null ? "" : active === s.gospel ? " lifted" : " faded");
              return (
                <polygon
                  key={s.gospel}
                  className={cls}
                  points={polygon(s.norm)}
                  fill={s.color}
                  stroke={s.color}
                  style={{ "--i": i, transitionDelay: `${i * 90}ms` }}
                />
              );
            })}
          </svg>

          <div className="jw-radar-legend">
            {series.map((s) => (
              <div
                key={s.gospel}
                className={`jw-radar-chip${active === s.gospel ? " on" : ""}`}
                style={{ color: active === s.gospel ? s.color : undefined, opacity: s.total === 0 ? 0.4 : 1 }}
                onMouseEnter={() => s.total > 0 && setHover(s.gospel)}
                onMouseLeave={() => setHover(null)}
              >
                <span className="sw" style={{ background: s.color }} />
                {s.gospel} · {s.total}
              </div>
            ))}
          </div>
          {series.some((s) => s.total === 0) && (
            <div style={{ fontSize: 12, fontStyle: "italic", color: "var(--jw-muted)", textAlign: "center", marginTop: 4 }}>
              John records no parables — his teaching comes as extended discourse instead.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
