import { useState, useMemo } from "react";
import { gospelIntersections } from "../lib/analysis.js";
import { useInView } from "../hooks/useViz.js";
import "../styles/visuals.css";

// UpSet-style attestation plot. A 4-way Venn is unreadable; this shows each
// COMBINATION of Gospels as a bar, with a dot-matrix below marking membership.
// The honest way to see the synoptic problem: tall bars for "Luke alone" and
// "all three Synoptics", a lone sliver for "all four".
export default function GospelAttestationUpSet({ filter } = {}) {
  const [hover, setHover] = useState(null);
  const [ref, inView] = useInView();
  const data = useMemo(() => gospelIntersections({ filter }), [filter]);
  const combos = data.combos;

  return (
    <div className={`jw-viz${inView ? " in" : ""}`} ref={ref}>
      <div className="jw-card">
        <div className="jw-h">Who Records It</div>
        <div className="jw-cap">
          Every miracle and parable ({data.total}), grouped by which Gospels attest it.
          Each bar is a combination; the dots below show which Gospels are in it.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "84px 1fr", gap: 12, opacity: combos.length ? 1 : 0.4 }}>
          {combos.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: "20px 0", textAlign: "center", fontStyle: "italic", color: "var(--jw-muted)" }}>
              No events match the current filter.
            </div>
          )}
          <div />
          <div className="jw-up-bars">
            {combos.map((c, i) => {
              const active = hover === i;
              return (
                <div
                  key={c.key}
                  className={`jw-up-col${active ? " active" : ""}`}
                  style={{ "--i": i }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                >
                  <div className="jw-up-val">{c.count}</div>
                  <div
                    className="jw-up-bar"
                    style={{
                      height: `${(c.count / data.max) * 100}%`,
                      background: c.combo.length === 1
                        ? data.gospels.find((g) => g.key === c.combo[0]).color
                        : "var(--jw-accent)",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* gospel row labels */}
          <div className="jw-up-gospels">
            {data.gospels.map((g) => (
              <div key={g.key} className="jw-up-glbl" style={{ color: g.color }}>{g.key}</div>
            ))}
          </div>
          {/* membership dot matrix */}
          <div className="jw-up-matrix">
            {combos.map((c, i) => (
              <div
                key={c.key}
                className={`jw-up-mcol${hover === i ? " active" : ""}`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                {data.gospels.map((g) => {
                  const on = c.combo.includes(g.key);
                  return (
                    <div
                      key={g.key}
                      className={`jw-up-dot${on ? " on" : ""}`}
                      style={on ? { background: g.color, borderColor: g.color } : undefined}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className={`jw-tip${hover !== null ? " on" : ""}`} style={{ position: "static", marginTop: 16, maxWidth: "none", display: hover !== null ? "block" : "none" }}>
          {hover !== null && (
            <>
              <div className="tt">{combos[hover].combo.join(" + ")} · {combos[hover].count}</div>
              <div className="tx">e.g. {combos[hover].examples.join(", ")}{combos[hover].count > combos[hover].examples.length ? "…" : ""}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
