import { LOOKUP } from '../../data/options.js'

// Golu dimensions (world units; a Bommai is ~1 unit tall).
export const GOLU = {
  steps: 9,
  W: 10.4, // width of every step
  H: 0.62, // rise
  D: 0.95, // run
  Z0: 0, // front edge of step 1
}
GOLU.top = (k) => k * GOLU.H
GOLU.front = (k) => GOLU.Z0 - (k - 1) * GOLU.D
GOLU.standZ = (k) => GOLU.front(k) - GOLU.D * 0.52
GOLU.backZ = GOLU.front(GOLU.steps) - GOLU.D
GOLU.center = (k) => [0, GOLU.top(k), GOLU.standZ(k)]

const USABLE = GOLU.W - 0.9
const BASE_W = 0.86
const MIN_SCALE = 0.62

function hash(str = '') {
  let h = 7
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

const widthOf = (b) => BASE_W + (LOOKUP.accessory[b.accessory]?.hold === 'ground' ? 0.34 : 0)

// Lays out each open step: the newest Bommai takes centre stage and everyone else shuffles
// outwards. When a step gets crowded, spacing compresses (down to MIN_SCALE) before overlapping.
export function computeLayout(bommais) {
  const byStep = new Map()
  for (const b of bommais) {
    if (!byStep.has(b.step)) byStep.set(b.step, [])
    byStep.get(b.step).push(b)
  }
  const out = new Map()
  for (const [step, list] of byStep) {
    const newestFirst = [...list].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    const left = []
    const right = []
    newestFirst.forEach((b, i) => (i % 2 === 0 ? left.unshift(b) : right.push(b)))
    // left already ends with newest (index 0) — centre it by moving it to the join
    const row = [...left, ...right]
    const total = row.reduce((s, b) => s + widthOf(b), 0)
    const scale = Math.max(MIN_SCALE, Math.min(1, USABLE / total))
    // sparse steps breathe: spread out up to ~2x, leaving the ends free for newcomers
    const spread = Math.max(1, Math.min(2.1, (USABLE * 0.78) / (total * scale)))
    // nudge each sparse step's centre a little so rows don't stack into columns
    const drift = spread > 1.2 ? ((step * 37) % 7 - 3) * 0.28 : 0
    let x = (-total * scale * spread) / 2 + drift
    row.forEach((b, i) => {
      const w = widthOf(b) * scale * spread
      // ground accessories sit on the +x side, so shift the doll left within its cell
      const extra = (widthOf(b) - BASE_W) * scale
      const jitter = spread > 1.2 ? (((hash(b.id) % 100) / 100) - 0.5) * 0.35 : 0
      out.set(b.id, { step, x: x + w / 2 - extra / 2 + jitter, y: GOLU.top(step), z: GOLU.standZ(step) + (i % 2 ? 0.05 : -0.02) })
      x += w
    })
  }
  return out
}

export function nextSlotPreview(bommais, step, draft) {
  const fake = { ...draft, id: '__draft__', step, created_at: '9999' }
  return computeLayout([...bommais.filter((b) => b.step === step), fake]).get('__draft__')
}
