import React, { useState, useMemo } from "react";
import { categoryPeriodMatrix } from "../lib/analysis.js";
import { useInView } from "../hooks/useViz.js";
import "../styles/visuals.css";

// Category × Period heatmap. Reveals *when* each kind of event clusters —
// e.g. healings pile into the Galilean period, parables into the Journey.
export default function CategoryPeriodHeatmap({ filter } = {}) {
  const [kind, setKind] = useState("miracles");
  const [hover, setHover] = useState(null); // {r, c}
  const [ref, inView] = useInView();
  const m = useMemo(() => categoryPeriodMatrix(kind, { filter }), [kind, filter]);

  const cols = m.cols.length;
  const gridCols = `130px repeat(${cols}, 1fr) 46px`;
  // Sequential ramp: magnitude is ONE hue (the accent gold), light -> dark.
  // Category identity lives in the row-label dot, not the cells — so the eye
  // reads the matrix as intensity, not as seven competing hues.
  const alpha = (v) => (v === 0 ? 0.05 : 0.18 + 0.82 * (v / m.max));

  return (
    <div className={`jw-viz${inView ? " in" : ""}`} ref={ref}>
      <div className="jw-card">
        <div className="jw-h">When It Happened</div>
        <div className="jw-cap">
          {kind === "miracles" ? "Miracles" : "Parables"} by type across the ministry's {cols} periods.
          Darker = more. Watch the weight shift as the cross nears.
        </div>

        <div className="jw-toggle">
          <button className={kind === "miracles" ? "on" : ""} onClick={() => setKind("miracles")}>Miracles</button>
          <button className={kind === "parables" ? "on" : ""} onClick={() => setKind("parables")}>Parables</button>
        </div>

        <div className="jw-hm" style={{ gridTemplateColumns: gridCols, opacity: m.total === 0 ? 0.4 : 1 }}>
          {m.total === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: "18px 0", textAlign: "center", fontStyle: "italic", color: "var(--jw-muted)" }}>
              No {kind} match the current filter.
            </div>
          )}
          {/* header row */}
          <div />
          {m.cols.map((c) => (
            <div key={c.key} className="jw-hm-collbl">{c.label}</div>
          ))}
          <div className="jw-hm-collbl">Σ</div>

          {/* body */}
          {m.rows.map((row, r) => (
            <React.Fragment key={row.key}>
              <div className="jw-hm-rowlbl" style={hover && hover.r === r ? { color: row.color } : undefined}>
                {row.label}
                <span className="jw-hm-dot" style={{ background: row.color }} />
              </div>
              {m.cols.map((col, c) => {
                const v = m.cells[r][c];
                const isHot = hover && hover.r === r && hover.c === c;
                const isAxis = hover && (hover.r === r || hover.c === c);
                const cls = "jw-hm-cell" + (isHot ? " hot" : "") + (hover && !isAxis ? " dim" : "");
                return (
                  <div
                    key={col.key}
                    className={cls}
                    style={{
                      "--i": r * cols + c,
                      background: `color-mix(in srgb, var(--jw-accent) ${Math.round(alpha(v) * 100)}%, transparent)`,
                      color: v === 0 ? "var(--jw-muted)" : alpha(v) > 0.5 ? "var(--jw-bg)" : "var(--jw-cream)",
                    }}
                    onMouseEnter={() => setHover({ r, c, v, row, col })}
                    onMouseLeave={() => setHover(null)}
                  >
                    {v || ""}
                  </div>
                );
              })}
              <div className="jw-hm-totlbl">{m.rowTotals[r]}</div>
            </React.Fragment>
          ))}

          {/* column totals */}
          <div className="jw-hm-rowlbl" style={{ color: "var(--jw-accent-dim)", fontFamily: "var(--jw-display)", fontSize: 10 }}>
            TOTAL
          </div>
          {m.colTotals.map((t, i) => (
            <div key={i} className="jw-hm-totlbl">{t}</div>
          ))}
          <div className="jw-hm-totlbl" style={{ color: "var(--jw-accent)" }}>{m.total}</div>
        </div>

        <div className={`jw-tip${hover ? " on" : ""}`} style={{ position: "static", marginTop: 16, maxWidth: "none", display: hover ? "block" : "none" }}>
          {hover && (
            <>
              <div className="tt">{hover.row.label} · {hover.col.label}</div>
              <div className="tv">
                {hover.v === 0
                  ? `No ${hover.row.label.toLowerCase()} recorded in the ${hover.col.label} period.`
                  : `${hover.v} of ${m.rowTotals[hover.r]} ${hover.row.label.toLowerCase()} — ${Math.round((hover.v / m.colTotals[hover.c]) * 100)}% of everything in the ${hover.col.label} period.`}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
