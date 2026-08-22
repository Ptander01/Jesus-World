// Lookup for the schematic town plans. Kept out of SitePlan.jsx for the same
// reason mat()/bevelRect() live in utils/timelineMaterial.js — a component file
// that also exports helpers breaks react-refresh.
import sitePlans from '../data/site-plans.json'

export const PLAN_BY_ID = Object.fromEntries(sitePlans.plans.map(p => [p.id, p]))
export const hasSitePlan = id => !!PLAN_BY_ID[id]
