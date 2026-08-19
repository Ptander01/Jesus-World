// The Gospels vocabulary for what happened at a place.
//
// churchEvents carry BOTH an inherited Paul's-World `type` (founding /
// letter-received / support / leadership) and a purpose-built `category`
// (miracle / teaching / encounter / event). The types are leftovers: the
// crosswalk is near 1:1, but their names describe planting churches and
// receiving epistles, which is not what any of these 55 events are. Marker
// styling and legends key off `category` for that reason.
//
// `type` is kept in the data — it still drives nothing else, and re-deriving it
// would be busywork — but nothing user-facing should read it.
export const CATEGORY_CFG = {
  miracle:   { shape: 'diamond', color: '#c9a84c', size: 7, label: 'Miracle or sign' },
  teaching:  { shape: 'circle',  color: '#4A7C6F', size: 5, label: 'Teaching' },
  encounter: { shape: 'circle',  color: '#7B6FA0', size: 5, label: 'Encounter or calling' },
  event:     { shape: 'diamond', color: '#B85042', size: 6, label: 'Turning point' },
}

const FALLBACK = CATEGORY_CFG.event

/** Styling for a churchEvent. Falls back gracefully if `category` is missing. */
export function categoryOf(event) {
  return CATEGORY_CFG[event?.category] ?? FALLBACK
}

/** Legend rows, in the order they should read. */
export const CATEGORY_LEGEND = ['miracle', 'teaching', 'encounter', 'event'].map(k => ({
  shape: CATEGORY_CFG[k].shape,
  color: CATEGORY_CFG[k].color,
  size: CATEGORY_CFG[k].shape === 'diamond' ? 5 : 4,
  label: CATEGORY_CFG[k].label,
}))
