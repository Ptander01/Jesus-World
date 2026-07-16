// attestation.js
// Derives the display label + Gospel-Lens membership from an item's `gospels` array.
// Matches the convention already in your app: "SYNOPTICS" when in 2-3 synoptics,
// a single Gospel name when unique, "ALL FOUR" when in all four.
//
// gospels: array of "Matthew" | "Mark" | "Luke" | "John"

export const SYNOPTICS = ["Matthew", "Mark", "Luke"];
export const ALL_GOSPELS = ["Matthew", "Mark", "Luke", "John"];

export function attestationLabel(gospels = []) {
  const g = gospels.filter(Boolean);
  if (g.length === 4) return "ALL FOUR";
  if (g.length === 1) return g[0].toUpperCase();
  const onlySynoptic = g.every((x) => SYNOPTICS.includes(x));
  if (onlySynoptic && g.length >= 2) return "SYNOPTICS";
  return g.map((x) => x.slice(0, 4)).join(" · ").toUpperCase(); // e.g. mixed w/ John
}

// true if the item should show under a given Gospel-Lens selection
// lens: "Matthew" | "Mark" | "Luke" | "John" | "Synoptics" | "All"
export function inLens(gospels = [], lens = "All") {
  if (lens === "All") return true;
  if (lens === "Synoptics") return gospels.some((g) => SYNOPTICS.includes(g));
  return gospels.includes(lens);
}

// convenience flags
export const isUnique = (g = []) => g.length === 1;
export const isAllFour = (g = []) => g.length === 4;
