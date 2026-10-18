import { spotsOnStep, centreOut } from '../../data/options.js'
import { standsOffCentre } from '../bommai/build.js'
import { MathUtils } from 'three'

// Golu dimensions (world units; a Bommai is ~1 unit tall).
export const GOLU = {
  steps: 9,
  W: 14.2, // width of the bottom step; each step up is TAPER narrower (step 7: 10.6, step 9: 9.4)
  TAPER: 0.6,
  H: 0.62, // rise
  D: 0.95, // run
  Z0: 0, // front edge of step 1
}
GOLU.width = (k) => GOLU.W - (k - 1) * GOLU.TAPER
GOLU.top = (k) => k * GOLU.H
GOLU.front = (k) => GOLU.Z0 - (k - 1) * GOLU.D
GOLU.standZ = (k) => GOLU.front(k) - GOLU.D * 0.52
GOLU.backZ = GOLU.front(GOLU.steps) - GOLU.D
GOLU.center = (k) => [0, GOLU.top(k), GOLU.standZ(k)]

// Each community step has spotsOnStep(k) fixed spots (more on the lower, wider steps). Spots are
// evenly spaced, but never further apart than MAX_GAP, so the few spots on the upper steps sit
// together in the middle. Rows that predate spots get one centre-out in join order (the same order
// the slots migration uses).
const MAX_GAP = 1.35
const GROUND_EXTRA = 0.34 // a pet or plant stands to the doll's left

const gap = (step) => Math.min((GOLU.width(step) - 0.9) / spotsOnStep(step), MAX_GAP)
export const slotX = (step, slot) => (slot - (spotsOnStep(step) - 1) / 2) * gap(step)
export const slotPos = (step, slot) => ({ step, slot, x: slotX(step, slot), y: GOLU.top(step), z: GOLU.standZ(step) + (slot % 2 ? 0.05 : -0.02) })

// id -> slot for every Bommai, filling in spots for rows without one (or with a clashing one).
export function resolveSlots(bommais) {
  const taken = new Map() // step -> Set(slot)
  const out = new Map()
  const used = (step) => taken.get(step) || taken.set(step, new Set()).get(step)
  const sorted = [...bommais].sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
  const pending = []
  for (const b of sorted) {
    if (Number.isInteger(b.slot) && b.slot >= 0 && b.slot < spotsOnStep(b.step) && !used(b.step).has(b.slot)) {
      used(b.step).add(b.slot)
      out.set(b.id, b.slot)
    } else pending.push(b)
  }
  for (const b of pending) {
    const free = centreOut(spotsOnStep(b.step)).find((s) => !used(b.step).has(s))
    if (free === undefined) continue // more rows than spots: not drawn
    used(b.step).add(free)
    out.set(b.id, free)
  }
  return out
}

// Where every Bommai stands: { step, slot, x, y, z }.
export function computeLayout(bommais) {
  const slots = resolveSlots(bommais)
  const out = new Map()
  for (const b of bommais) {
    const slot = slots.get(b.id)
    if (slot === undefined) continue
    const p = slotPos(b.step, slot)
    // something set down beside the pedestal (an item or a pet) takes the doll's left, so shift the doll right within its spot
    if (standsOffCentre(b)) p.x -= GROUND_EXTRA / 2
    out.set(b.id, p)
  }
  return out
}

// Free spots on a step, treating `ignoreId`'s own spot as free (it is being moved).
export function freeSlots(bommais, step, ignoreId) {
  const slots = resolveSlots(bommais)
  const taken = new Set(bommais.filter((b) => b.step === step && b.id !== ignoreId).map((b) => slots.get(b.id)))
  return Array.from({ length: spotsOnStep(step) }, (_, i) => i).filter((i) => !taken.has(i))
}

// Which step the pointer is over: { step, point } or null. Counts a step's top, its front (riser),
// and the space above the top step where the traditional pieces stand (so aiming at them reads as
// "the top steps"). `point` is where to hang the doll: on the step's top, under the pointer.
export function pickStep(ray) {
  const { origin: o, direction: d } = ray
  const half = (k) => GOLU.width(k) / 2 - 0.1
  let best = null
  const consider = (t, step) => {
    if (t > 0 && (!best || t < best.t)) best = { t, step }
  }
  for (let k = 1; k <= GOLU.steps; k++) {
    const top = GOLU.top(k)
    const front = GOLU.front(k)
    if (Math.abs(d.y) > 1e-6) {
      const t = (top - o.y) / d.y
      const x = o.x + d.x * t
      const z = o.z + d.z * t
      if (Math.abs(x) <= half(k) && z <= front + 0.05 && z >= front - GOLU.D - 0.05) consider(t, k)
    }
    if (Math.abs(d.z) > 1e-6) {
      const t = (front - o.z) / d.z
      const x = o.x + d.x * t
      const y = o.y + d.y * t
      if (Math.abs(x) <= half(k) && y <= top && y >= GOLU.top(k - 1)) consider(t, k)
    }
  }
  // above the top step, in front of the backdrop
  if (Math.abs(d.z) > 1e-6) {
    const t = (GOLU.backZ + 0.3 - o.z) / d.z
    const x = o.x + d.x * t
    const y = o.y + d.y * t
    if (Math.abs(x) <= half(GOLU.steps) && y >= GOLU.top(GOLU.steps) && y <= GOLU.top(GOLU.steps) + 2.4) consider(t, GOLU.steps)
  }
  if (!best) return null
  const p = o.clone().addScaledVector(d, best.t)
  // hang over the step's top surface, not wherever on the riser/backdrop the ray landed
  p.y = GOLU.top(best.step)
  p.z = MathUtils.clamp(p.z, GOLU.front(best.step) - GOLU.D * 0.8, GOLU.front(best.step) - GOLU.D * 0.25)
  return { step: best.step, point: p }
}
