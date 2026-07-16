// vizData.js — projects the canonical gospels-data.json into the flat shape the
// visuals expect (the shape the content drop's data/miracles.js and data/parables.js
// had). The drop's own data modules are deliberately NOT imported: gospels-data.json
// is the single source of truth for the map, timeline and play loop, and a second
// copy of the miracle list would drift out of sync with it silently.
//
// See src/data/MIRACLE-CROSSWALK.md for the merge and the counting rule.

import journeyData from '../data/gospels-data.json';

// The drop's 5-band model has no slot for period-6 (Resurrection), so `band` is
// derived from journeyId rather than stored. journeyId is what the map and timeline
// already run on, so deriving keeps the visuals in lockstep with them.
// `short` is for the density stream's SVG x-axis, which can't wrap text — the full
// period names ("Galilean Ministry") overflow and clip at the chart edges. The
// heatmap headers and tooltips use the full journey shortName instead.
const BANDS = {
  'period-1': { band: 'gold', short: 'Early' },
  'period-2': { band: 'teal', short: 'Galilean' },
  'period-3': { band: 'purple', short: 'Withdrawal' },
  'period-4': { band: 'orange', short: 'Judea' },
  'period-5': { band: 'red', short: 'Passion' },
  'period-6': { band: 'dawn', short: 'Risen' },   // no counterpart in the drop's 5-band model
};
const PERIOD_TO_BAND = Object.fromEntries(
  Object.entries(BANDS).map(([id, b]) => [id, b.band]),
);

export const MIRACLE_TYPES = journeyData.miracleTypes;
export const PARABLE_TOPICS = journeyData.parableTopics;

const bandOf = (journeyId) => PERIOD_TO_BAND[journeyId] ?? null;

// Band order/label/color are derived from the journeys themselves rather than
// hardcoded, so the charts stay keyed to the same six periods (and the same colors)
// the timeline renders. A hardcoded 5-band list silently drops period-6 events.
export const BAND_ORDER = journeyData.journeys.map((j) => bandOf(j.id)).filter(Boolean);
export const BAND_LABEL = Object.fromEntries(
  journeyData.journeys.map((j) => [bandOf(j.id), j.shortName]),
);
export const BAND_COLOR = Object.fromEntries(
  journeyData.journeys.map((j) => [bandOf(j.id), j.color]),
);
export const BAND_SHORT = Object.fromEntries(
  journeyData.journeys.map((j) => [bandOf(j.id), BANDS[j.id].short]),
);

export const MIRACLES = journeyData.churchEvents
  .filter((e) => e.category === 'miracle')
  .map((e) => ({
    id: e.id,
    name: e.label,
    summary: e.sublabel,
    ref: e.ref,
    type: e.miracleType,
    gospels: e.gospels,
    band: bandOf(e.journeyId),
    journeyId: e.journeyId,
    cityId: e.cityId,
    year: e.year,
    optional: e.optional === true,
  }));

export const PARABLES = journeyData.parables.map((p) => ({
  id: p.id,
  name: p.name,
  summary: p.lesson,
  ref: p.ref,
  topic: p.topic,
  gospels: p.gospels,
  band: bandOf(p.journeyId),
  journeyId: p.journeyId,
  cityId: p.occasion?.cityId ?? null,
  year: p.occasion?.year ?? null,
  optional: p.optional === true,
}));
