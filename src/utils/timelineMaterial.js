/**
 * Helpers for the timeline's shared SVG material.
 *
 * The paint servers and filters themselves are emitted by <TimelineDefs> in
 * src/components/TimelineDefs.jsx; this module holds the plain functions that
 * reference and lay them out, so the component file stays a component file.
 */

/** Ref strings for the paint servers and filters a <TimelineDefs id> emits. */
export function mat(id) {
  return {
    sheen:  `url(#${id}-sheen)`,
    bevel:  `url(#${id}-bevel)`,
    dome:   `url(#${id}-dome)`,
    cast:   `url(#${id}-cast)`,
    groove: `url(#${id}-groove)`,
  }
}

/**
 * Shrinks a rect so a bevel stroke drawn on it sits just inside the shape's own
 * outline rather than doubling it. Mirrors the CSS lip's `inset 0 ±1px 0`.
 */
export const BEVEL_INSET = 0.6

export function bevelRect({ x, y, w, h, rx }, inset = BEVEL_INSET) {
  return {
    x: x + inset,
    y: y + inset,
    w: Math.max(0, w - inset * 2),
    h: Math.max(0, h - inset * 2),
    rx: Math.max(0, rx - inset),
  }
}
