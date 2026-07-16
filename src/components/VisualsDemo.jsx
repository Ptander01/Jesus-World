import { useState, useMemo } from "react";
import { makeFilter, BAND_ORDER, BAND_LABEL } from "../lib/analysis.js";
import CategoryPeriodHeatmap from "./CategoryPeriodHeatmap.jsx";
import GospelAttestationUpSet from "./GospelAttestationUpSet.jsx";
import MinistryDensityStream from "./MinistryDensityStream.jsx";
import GospelSignatureRadar from "./GospelSignatureRadar.jsx";
import "../styles/visuals.css";

const LENSES = ["All", "Synoptics", "Matthew", "Mark", "Luke", "John"];

// Live harness: a Gospel Lens + period filter drive all four visuals at once.
// Wire `lens`/`bands` to your real timeline + Lens state to replace this shell.
export default function VisualsDemo() {
  const [lens, setLens] = useState("All");
  const [bands, setBands] = useState([]); // empty = all periods

  const toggleBand = (b) =>
    setBands((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));

  // Heatmap / stream / UpSet: filter by Lens AND period.
  const filter = useMemo(() => makeFilter({ lens, bands }), [lens, bands]);
  // Radar: filtering the comparison by one Gospel is self-defeating, so the
  // Lens *isolates* a polygon instead; only the period filter applies to data.
  const radarFilter = useMemo(() => makeFilter({ bands }), [bands]);
  const isolate = lens !== "All" && lens !== "Synoptics" ? lens : null;

  const chip = (on) => ({
    fontFamily: "var(--jw-display)", fontSize: 10, letterSpacing: 1.5,
    textTransform: "uppercase", padding: "7px 14px", borderRadius: 18, cursor: "pointer",
    border: "1px solid " + (on ? "var(--jw-accent)" : "var(--jw-border-lt)"),
    background: on ? "var(--jw-accent)" : "var(--jw-surface-2)",
    color: on ? "var(--jw-bg)" : "var(--jw-cream-dim)",
    fontWeight: on ? 600 : 400,
  });

  // The atlas shell locks scrolling (html, body, #root { overflow: hidden } in
  // index.css), so this route scrolls in its own container rather than the document.
  // IntersectionObserver still resolves against the viewport, so the scroll-triggered
  // intro animations fire normally.
  return (
    <div className="jw-viz" style={{ background: "var(--jw-bg)", height: "100%", overflowY: "auto", padding: "32px 20px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 }}>
        {/* control bar */}
        <div style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--jw-bg)", padding: "10px 0", borderBottom: "1px solid var(--jw-border)" }}>
          <div style={{ fontFamily: "var(--jw-display)", fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "var(--jw-accent-dim)", marginBottom: 8 }}>Gospel Lens</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
            {LENSES.map((l) => (
              <button key={l} style={chip(lens === l)} onClick={() => setLens(l)}>{l}</button>
            ))}
          </div>
          <div style={{ fontFamily: "var(--jw-display)", fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "var(--jw-accent-dim)", marginBottom: 8 }}>Period</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {BAND_ORDER.map((b) => (
              <button key={b} style={chip(bands.includes(b))} onClick={() => toggleBand(b)}>{BAND_LABEL[b]}</button>
            ))}
            {bands.length > 0 && (
              <button style={{ ...chip(false), borderStyle: "dashed" }} onClick={() => setBands([])}>Reset</button>
            )}
          </div>
        </div>

        <CategoryPeriodHeatmap filter={filter} />
        <MinistryDensityStream filter={filter} />
        <GospelAttestationUpSet filter={filter} />
        <GospelSignatureRadar filter={radarFilter} isolate={isolate} />
      </div>
    </div>
  );
}
