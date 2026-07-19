import { useState, useMemo } from "react";
import { makeFilter, BAND_ORDER, BAND_LABEL } from "../lib/analysis.js";
import CategoryPeriodHeatmap from "./CategoryPeriodHeatmap.jsx";
import GospelAttestationUpSet from "./GospelAttestationUpSet.jsx";
import MinistryDensityStream from "./MinistryDensityStream.jsx";
import GospelSignatureRadar from "./GospelSignatureRadar.jsx";
import NavTabs from "./NavTabs.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import "../styles/visuals.css";

const LENSES = ["All", "Synoptics", "Matthew", "Mark", "Luke", "John"];

// The Gospel Lens is owned by Root and shared with the atlas, so a selection made on
// the map still holds here. `bands` is still local — the timeline scrubber is App
// state and isn't reachable from this route yet.
export default function VisualsDemo({ lens = "All", onLensChange, theme = "dark", onThemeChange }) {
  const [bands, setBands] = useState([]); // empty = all periods
  const setLens = onLensChange ?? (() => {});

  const toggleBand = (b) =>
    setBands((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));

  // Heatmap / stream / UpSet: filter by Lens AND period.
  const filter = useMemo(() => makeFilter({ lens, bands }), [lens, bands]);
  // Radar: filtering the comparison by one Gospel is self-defeating, so the
  // Lens *isolates* a polygon instead; only the period filter applies to data.
  const radarFilter = useMemo(() => makeFilter({ bands }), [bands]);
  const isolate = lens !== "All" && lens !== "Synoptics" ? lens : null;

  return (
    <div className="jw-page">
      <header className="app-header">
        <h1>Jesus's World</h1>
        <NavTabs current="charts" />
        <ThemeToggle
          theme={theme}
          onToggle={() => onThemeChange?.(theme === "dark" ? "light" : "dark")}
        />
      </header>

      {/* The atlas shell locks scrolling (html, body, #root { overflow: hidden } in
          index.css), so this route scrolls in its own container rather than the
          document. IntersectionObserver still resolves against the viewport, so the
          scroll-triggered intro animations fire normally. */}
      <div className="jw-viz jw-scroll">
        <div className="jw-col">
          {/* editorial masthead */}
          <div className="jw-masthead">
            <div className="jw-kicker">The Patterns</div>
            <h2 className="jw-title">Four witnesses, one ministry</h2>
            <p className="jw-stand">
              Thirty-four miracles and thirty-four parables, cross-read by Gospel,
              period, and theme. Filter by witness or season of the ministry &mdash;
              the charts redraw to show what each lens leaves in the light.
            </p>
          </div>

          {/* control bar */}
          <div className="jw-controls">
            <div className="jw-ctl-lbl">Gospel Lens</div>
            <div className="jw-ctl-row">
              {LENSES.map((l) => (
                <button key={l} className={`jw-chip${lens === l ? " on" : ""}`} onClick={() => setLens(l)}>{l}</button>
              ))}
            </div>
            <div className="jw-ctl-lbl">Period</div>
            <div className="jw-ctl-row">
              {BAND_ORDER.map((b) => (
                <button key={b} className={`jw-chip${bands.includes(b) ? " on" : ""}`} onClick={() => toggleBand(b)}>{BAND_LABEL[b]}</button>
              ))}
              {bands.length > 0 && (
                <button className="jw-chip jw-chip--reset" onClick={() => setBands([])}>Reset</button>
              )}
            </div>
          </div>

          <CategoryPeriodHeatmap filter={filter} />
          <MinistryDensityStream filter={filter} />
          <GospelAttestationUpSet filter={filter} />
          <GospelSignatureRadar filter={radarFilter} isolate={isolate} />
        </div>
      </div>
    </div>
  );
}
