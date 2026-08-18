/**
 * Shared SVG material for the timeline surfaces.
 *
 * The panels get their tactility from CSS (`--lip-out`, `--glass-bg`), but SVG
 * can't take a box-shadow — so the same four ideas are rebuilt as paint servers
 * and filters here, and every timeline SVG renders one <TimelineDefs> and pulls
 * its refs from mat() (src/utils/timelineMaterial.js):
 *
 *   sheen  — face gradient: lit at the top, shadowed at the base (the glass)
 *   bevel  — stroke gradient: a bright top lip and a dark bottom lip (the edge)
 *   dome   — radial version of the sheen for round marks, off-centre highlight
 *   cast   — soft drop shadow that lifts a mark off its track
 *   groove — inner shadow, for the recessed tracks a raised mark sits in
 *
 * All the light values come through CSS custom properties (see tokens.css), so
 * the bevels invert correctly in the parchment theme instead of staying dark.
 *
 * `id` must be unique per SVG document fragment — ids are document-scoped, and
 * duplicates across inline SVGs would collide.
 */
export default function TimelineDefs({ id }) {
  return (
    <defs>
      <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="var(--sheen-hi)" />
        <stop offset="46%"  stopColor="var(--sheen-mid)" />
        <stop offset="100%" stopColor="var(--sheen-lo)" />
      </linearGradient>

      {/* Two transparent stops at the midpoint, each matching its own side, so
          the fade doesn't interpolate through a muddy grey band. */}
      <linearGradient id={`${id}-bevel`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="var(--bevel-hi)" />
        <stop offset="44%"  stopColor="var(--bevel-hi-0)" />
        <stop offset="56%"  stopColor="var(--bevel-lo-0)" />
        <stop offset="100%" stopColor="var(--bevel-lo)" />
      </linearGradient>

      <radialGradient id={`${id}-dome`} cx="36%" cy="26%" r="76%">
        <stop offset="0%"   stopColor="var(--sheen-hi)" />
        <stop offset="52%"  stopColor="var(--sheen-mid)" />
        <stop offset="100%" stopColor="var(--sheen-lo)" />
      </radialGradient>

      <filter id={`${id}-cast`} x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="1.2" stdDeviation="1.4"
          style={{ floodColor: 'var(--cast-shadow)' }} />
      </filter>

      {/* Inner shadow: offset the alpha, blur it, subtract the original, and
          flood what's left — the classic "punched into the surface" recipe. */}
      <filter id={`${id}-groove`} x="-30%" y="-80%" width="160%" height="260%">
        <feOffset in="SourceAlpha" dx="0" dy="1.1" result="off" />
        <feGaussianBlur in="off" stdDeviation="1.3" result="blur" />
        <feComposite in="SourceAlpha" in2="blur" operator="out" result="cut" />
        <feFlood style={{ floodColor: 'var(--groove-shadow)' }} result="col" />
        <feComposite in="col" in2="cut" operator="in" result="ring" />
        <feComposite in="ring" in2="SourceGraphic" operator="over" />
      </filter>
    </defs>
  )
}
