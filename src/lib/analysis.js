// analysis.js
// Derived cross-tabulations for the advanced visuals — beyond simple sums.
// Every function accepts an optional { filter } predicate so the visuals can
// react live to the Gospel Lens and/or the timeline. Pure; safe in render.

// Data comes from vizData.js, which projects the canonical gospels-data.json — not
// from a standalone copy of the miracle/parable lists. Band metadata is derived from
// the app's six ministry periods there; see src/data/MIRACLE-CROSSWALK.md.
import {
  MIRACLES, MIRACLE_TYPES, PARABLES, PARABLE_TOPICS,
  BAND_ORDER, BAND_LABEL, BAND_COLOR, BAND_SHORT,
} from "./vizData.js";
import { inLens } from "./attestation.js";

const GOSPEL_ORDER = ["Matthew", "Mark", "Luke", "John"];
const GOSPEL_COLOR = { Matthew: "#c98a3c", Mark: "#9a6b8a", Luke: "#5a9e8a", John: "#6b8cba" };

const PASS = () => true;

// Compose a predicate from a Gospel Lens value and/or a set of timeline bands.
//   lens : "All" | "Synoptics" | "Matthew" | "Mark" | "Luke" | "John"
//   bands: null (all) | array of band keys
export function makeFilter({ lens = "All", bands = null } = {}) {
  return (item) =>
    inLens(item.gospels, lens) && (!bands || bands.length === 0 || bands.includes(item.band));
}

function pick(kind) {
  return kind === "miracles"
    ? { items: MIRACLES, dict: MIRACLE_TYPES, keyOf: (x) => x.type }
    : { items: PARABLES, dict: PARABLE_TOPICS, keyOf: (x) => x.topic };
}

// CATEGORY × PERIOD heatmap matrix
export function categoryPeriodMatrix(kind = "miracles", { filter = PASS } = {}) {
  const { items, dict, keyOf } = pick(kind);
  const data = items.filter(filter);
  const rowKeys = Object.keys(dict);
  const cells = rowKeys.map((rk) =>
    BAND_ORDER.map((b) => data.filter((x) => keyOf(x) === rk && x.band === b).length)
  );
  const flat = cells.flat();
  return {
    rows: rowKeys.map((k) => ({ key: k, label: dict[k].label, color: dict[k].color })),
    cols: BAND_ORDER.map((b) => ({ key: b, label: BAND_LABEL[b], color: BAND_COLOR[b] })),
    cells,
    rowTotals: cells.map((r) => r.reduce((a, b) => a + b, 0)),
    colTotals: BAND_ORDER.map((_, ci) => cells.reduce((a, r) => a + r[ci], 0)),
    max: flat.length ? Math.max(...flat) : 0,
    total: data.length,
  };
}

// GOSPEL-SET INTERSECTIONS (UpSet-style)
export function gospelIntersections({ filter = PASS } = {}) {
  const items = [...MIRACLES, ...PARABLES].filter(filter);
  const map = {};
  items.forEach((it) => {
    const combo = GOSPEL_ORDER.filter((g) => it.gospels.includes(g));
    const key = combo.join("+") || "—";
    if (!map[key]) map[key] = { combo, key, count: 0, examples: [] };
    map[key].count += 1;
    if (map[key].examples.length < 5) map[key].examples.push(it.name);
  });
  const combos = Object.values(map).sort((a, b) => b.count - a.count || a.combo.length - b.combo.length);
  return {
    combos,
    gospels: GOSPEL_ORDER.map((g) => ({ key: g, color: GOSPEL_COLOR[g] })),
    max: combos.length ? Math.max(...combos.map((c) => c.count)) : 0,
    total: items.length,
  };
}

// GOSPEL × CATEGORY normalized emphasis fingerprint (radar)
export function gospelSignature(kind = "parables", { filter = PASS } = {}) {
  const { items, dict, keyOf } = pick(kind);
  const data = items.filter(filter);
  const axes = Object.keys(dict).map((k) => ({ key: k, label: dict[k].label, color: dict[k].color }));
  const series = GOSPEL_ORDER.map((g) => {
    const gItems = data.filter((x) => x.gospels.includes(g));
    const raw = axes.map((a) => gItems.filter((x) => keyOf(x) === a.key).length);
    const total = raw.reduce((a, b) => a + b, 0) || 1;
    return { gospel: g, color: GOSPEL_COLOR[g], raw, norm: raw.map((v) => v / total), total: gItems.length };
  });
  return { axes, series };
}

// per-band stacked series for the density stream
export function densityStream(kind = "miracles", { filter = PASS } = {}) {
  const { items, dict, keyOf } = pick(kind);
  const data = items.filter(filter);
  const rowKeys = Object.keys(dict);
  return {
    bands: BAND_ORDER.map((b) => ({ key: b, label: BAND_LABEL[b], short: BAND_SHORT[b], color: BAND_COLOR[b] })),
    series: rowKeys.map((rk) => ({
      key: rk,
      label: dict[rk].label,
      color: dict[rk].color,
      values: BAND_ORDER.map((b) => data.filter((x) => keyOf(x) === rk && x.band === b).length),
    })),
    max: Math.max(1, ...BAND_ORDER.map((b) => data.filter((x) => x.band === b).length)),
  };
}

export { BAND_ORDER, BAND_LABEL, BAND_COLOR, BAND_SHORT, GOSPEL_ORDER, GOSPEL_COLOR };
