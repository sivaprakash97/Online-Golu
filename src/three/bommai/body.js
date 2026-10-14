import { VoxelGrid } from '../voxel/mesher.js'
import { shade, patterned, GOLD, WHITE } from './look.js'

// Body, legs and clothes in body-local voxels: y = 0 is the top of the stand, the doll faces +z.
// Standing, the hips are at y = 12 and the shoulders at y = 24; seated, everything sits 3 lower.

export const STAND_HIP = 12
export const SIT_HIP = 9
export const TORSO_H = 12
export const ARM_LEN = 11

const BUILD = {
  slim: { hw: 5, hd: 3, lw: 4 },
  regular: { hw: 6, hd: 3, lw: 4 },
  round: { hw: 7, hd: 4, lw: 5 },
}
export const bodyDims = (look, sitting) => {
  const b = BUILD[look.body.id] || BUILD.regular
  const hip = sitting ? SIT_HIP : STAND_HIP
  return { ...b, hip, top: hip + TORSO_H }
}

// one leg column per side: doll's left is +x
const legXs = (lw) => [
  [1, 1 + lw],
  [-1 - lw, -1],
]

function standingLegs(g, look, d) {
  const { hw, hd, hip, lw } = d
  const o = look.outfit
  const b = o.bottom
  const legColor = b === 'pants' ? look.pants : look.skin
  for (const [x0, x1] of legXs(lw)) {
    // shoes / bare feet
    if (look.shoes) {
      g.box(x0, 0, -2, x1, 3, 4, (x, y, z) => (y === 0 ? look.sole : z === 3 && y === 1 && x === x0 + 1 ? shade(look.shoes, -0.15) : look.shoes))
    } else {
      g.box(x0, 0, -2, x1, 2, 3, look.skin)
      g.box(x0, 2, -2, x1, 3, 2, look.skin)
    }
    g.box(x0, 3, -2, x1, hip, 2, legColor)
    if (b === 'pants') g.box(x0, 3, -2, x1, 4, 2, shade(look.pants, -0.1)) // turned-up hem
    if (b === 'shorts') {
      g.box(x0, hip - 4, -2, x1, hip, 2, look.pants)
      g.box(x0 - (x0 < 0 ? 0 : 0), hip - 4, -2, x1, hip - 3, 2, shade(look.pants, -0.08))
    }
    if (!look.shoes) g.box(x0, 3, -2, x1, 4, 2, (x, y, z) => (b === 'pants' ? undefined : GOLD)) // anklet
  }
  // close the gap between the legs at the hips
  if (b === 'pants' || b === 'shorts') g.box(-1, hip - 3, -2, 1, hip, 2, look.pants)
  void hw
  void hd
}

// stepped A-line skirt: tiers widen going down
function tieredSkirt(g, look, d, tiers, base, pattern, border = GOLD) {
  const { hw, hd } = d
  const paint = patterned(pattern, base)
  for (const [y0, y1, grow] of tiers) {
    g.box(-hw - grow, y0, -hd - grow, hw + grow, y1, hd + grow, paint)
  }
  const [y0, , grow] = tiers[tiers.length - 1]
  g.box(-hw - grow, y0, -hd - grow, hw + grow, y0 + 1, hd + grow, border)
}

function lower(g, look, d) {
  const { hw, hd, hip } = d
  const o = look.outfit
  const b = o.bottom
  if (b === 'saree') {
    tieredSkirt(g, look, d, [[hip - 4, hip, 1], [2, hip - 4, 2]], look.main, 'butta')
    // pleats down the front
    for (const x of [-2, 0, 2]) g.box(x, 3, hd + 2, x + 1, hip - 4, hd + 3, shade(look.main, -0.1))
    g.box(-hw - 2, 3, -hd - 2, hw + 2, 4, hd + 2, GOLD)
  } else if (b === 'skirt') {
    tieredSkirt(g, look, d, [[hip - 3, hip, 1], [6, hip - 3, 2], [2, 6, 3]], look.main, 'butta')
    g.box(-hw - 2, 6, -hd - 2, hw + 2, 7, hd + 2, GOLD)
  } else if (b === 'dhoti') {
    g.box(-hw, 3, -hd, hw, hip, hd, (x, y) => (y === 4 || y === 5 ? GOLD : look.pants))
    g.box(-1, 3, hd, 1, hip - 1, hd + 1, shade(look.pants, -0.06)) // front fold
  } else if (b === 'dress') {
    tieredSkirt(g, look, d, [[hip - 3, hip, 1], [6, hip - 3, 2]], look.main, look.pattern || 'polka', shade(look.main, -0.12))
  }
}

function tunic(g, look, d) {
  const o = look.outfit
  if (!o.topLength || o.topLength <= 1) return
  const { hw, hd, hip } = d
  const ext = Math.round((o.topLength - 1) * TORSO_H)
  const paint = patterned(look.pattern, look.top)
  g.box(-hw - 1, hip - ext, -hd - 1, hw + 1, hip, hd + 1, paint)
  if (o.accent) {
    g.box(-hw - 1, hip - ext, -hd - 1, hw + 1, hip - ext + 1, hd + 1, o.accent)
    g.box(-1, hip - ext, hd + 1, 1, hip, hd + 2, o.accent) // centre placket
  }
}

function seatedLegs(g, look, d) {
  const { hw, hd, hip, lw } = d
  const o = look.outfit
  const b = o.bottom
  // a little wooden stool (manai)
  g.box(-hw - 1, 0, -hd - 3, hw + 1, hip - 3, 1, (x, y) => (y === hip - 4 ? '#c98a4f' : '#a8643a'))
  const covered = ['saree', 'skirt', 'dhoti', 'dress'].includes(b)
  const thigh = b === 'pants' || b === 'shorts' ? look.pants : look.skin
  const shin = b === 'pants' ? look.pants : look.skin
  for (const [x0, x1] of legXs(lw)) {
    g.box(x0, hip - 3, -hd, x1, hip, hd + 5, thigh)
    g.box(x0, 2, hd + 2, x1, hip - 3, hd + 6, shin)
    if (look.shoes) g.box(x0, 0, hd + 2, x1, 2, hd + 8, (x, y) => (y === 0 ? look.sole : look.shoes))
    else g.box(x0, 0, hd + 2, x1, 2, hd + 7, look.skin)
  }
  if (covered) {
    const c = b === 'dhoti' ? look.pants : look.main
    const paint = patterned(b === 'dhoti' ? null : b === 'dress' ? look.pattern || 'polka' : 'butta', c)
    g.box(-hw - 1, hip - 4, -hd - 1, hw + 1, hip + 1, hd + 6, paint)
    const drop = b === 'dress' ? 5 : 2
    g.box(-hw - 1, drop, hd + 5, hw + 1, hip - 4, hd + 7, paint)
    g.box(-hw - 1, drop, hd + 5, hw + 1, drop + 1, hd + 7, b === 'dress' ? shade(c, -0.12) : GOLD)
  }
  if (o.topLength && o.topLength > 1) g.box(-hw - 1, hip - 1, -hd - 1, hw + 1, hip + 1, hd + 4, patterned(look.pattern, look.top))
}

function torso(g, look, d) {
  const { hw, hd, hip, top } = d
  const o = look.outfit
  const paint = patterned(look.pattern, look.top)
  g.box(-hw, hip, -hd, hw, top, hd, (x, y, z) => {
    // round the shoulders
    if (y === top - 1 && (x === -hw || x === hw - 1) && (z === -hd || z === hd - 1)) return null
    return paint(x, y, z)
  })
  // neck
  g.box(-2, top, -2, 2, top + 1, 2, look.skin)
  const fz = hd // first layer in front of the torso

  if (o.top === 'blouse') {
    // blouse on top, the saree/skirt wraps the waist
    g.box(-hw, hip, -hd, hw, hip + 5, hd, patterned('butta', look.main))
    g.box(-hw, hip + 5, -hd, hw, hip + 6, hd, GOLD)
    // neckline
    g.box(-2, top - 2, hd - 1, 2, top, hd, look.skin)
  }
  if (o.top === 'shirt') {
    for (const [x0, dir] of [
      [-3, 1],
      [2, -1],
    ]) {
      g.box(x0, top - 1, fz, x0 + 1, top, fz + 1, WHITE)
      g.set(x0 + dir, top - 2, fz, WHITE)
    }
    g.box(-1, top - 2, hd - 1, 1, top, hd, look.skin)
    for (let y = hip + 1; y < top - 2; y += 3) g.set(0, y, fz, WHITE)
  }
  if (o.top === 'hoodie') {
    const dk = shade(look.top, -0.1)
    g.box(-hw + 1, top - 3, -hd - 2, hw - 1, top + 2, -hd, dk) // hood
    g.box(-4, hip + 1, fz, 4, hip + 5, fz + 1, dk) // pocket
    g.box(-2, top - 5, fz, -1, top - 1, fz + 1, WHITE)
    g.box(1, top - 5, fz, 2, top - 1, fz + 1, WHITE)
    g.box(-hw, hip, -hd, hw, hip + 1, hd, dk) // ribbed hem
  }
  if (o.top === 'overalls') {
    g.paint(-hw, hip, -hd, hw, top, hd, patterned('stripes', '#e8846a'))
    g.box(-4, hip, fz, 4, hip + 8, fz + 1, look.main)
    g.box(-hw, hip, -hd - 1, hw, hip + 2, hd + 1, look.main)
    for (const x of [-4, 3]) {
      g.box(x, hip + 8, fz, x + 1, top, fz + 1, look.main)
      g.box(x, top, -hd, x + 1, top + 1, hd + 1, look.main)
      g.box(x, hip + 2, -hd - 1, x + 1, top, -hd, look.main)
      g.set(x, hip + 7, fz + 1, GOLD)
    }
    g.box(-2, hip + 3, fz + 1, 2, hip + 6, fz + 2, shade(look.main, -0.12)) // pocket
  }
  if (o.id === 'tee-jeans') g.box(-2, top - 1, hd - 1, 2, top, hd, look.skin)
  if (o.bottom === 'dress') {
    g.box(-3, top - 2, hd - 1, 3, top, hd, look.skin)
    g.box(-hw, hip, -hd, hw, hip + 1, hd, shade(look.main, -0.12)) // waistband
  }
  if (o.id === 'sherwani') for (let y = hip - 4; y < top - 1; y += 2) g.set(0, y, fz + 1, GOLD)
  if (o.topLength > 1) g.box(-2, top - 2, hd - 1, 2, top, hd, look.skin)
}

function drape(g, look, d) {
  const { hw, hd, hip, top } = d
  const kind = look.outfit.drape
  if (!kind) return
  const c = look.drapeColor
  const fz = hd
  if (kind === 'dupatta') {
    g.box(-hw, top - 1, -hd - 1, hw, top + 1, hd + 1, c)
    for (const x of [-hw + 1, hw - 3]) g.box(x, hip - 6, fz, x + 2, top, fz + 1, c)
    return
  }
  const w = kind === 'angavastram' ? 2 : 3
  // across the chest, from the right hip up to the left shoulder (doll's left is +x)
  const span = TORSO_H
  for (let i = 0; i <= span; i++) {
    const y = hip + i
    const xc = Math.round(-hw + (i / span) * (2 * hw - 2))
    for (let k = 0; k < w; k++) g.set(xc + k, Math.min(y, top - 1), fz, k === w - 1 ? GOLD : c)
  }
  // over the shoulder and down the back
  g.box(hw - 3, top, -hd - 1, hw, top + 1, hd + 1, c)
  g.box(hw - 3, hip - 6, -hd - 1, hw, top, -hd, (x, y) => (y === hip - 6 ? GOLD : c))
}

// accessory straps that belong on the body
function straps(g, d, mode) {
  const { hw, hd, hip, top } = d
  const fz = hd
  if (mode === 'strap') {
    for (const x of [-3, 2]) g.box(x, top - 7, fz, x + 1, top, fz + 1, '#2b2c33')
  }
  if (mode === 'slung' || mode === 'slung-back') {
    for (let i = 0; i <= TORSO_H; i++) {
      const x = Math.round(hw - 1 - (i / TORSO_H) * (2 * hw - 1))
      g.set(x, Math.min(hip + i, top - 1), fz, '#5a3420')
      g.set(-x - 1, Math.min(hip + i, top - 1), -hd - 1, '#5a3420')
    }
  }
  if (mode === 'back') {
    for (const x of [-4, 3]) {
      g.box(x, hip + 2, fz, x + 1, top, fz + 1, '#6b4a3a')
      g.box(x, top, -hd - 1, x + 1, top + 1, hd + 1, '#6b4a3a')
    }
  }
}

export function buildBody(look, sitting, mode) {
  const g = new VoxelGrid()
  const d = bodyDims(look, sitting)
  if (sitting) seatedLegs(g, look, d)
  else {
    standingLegs(g, look, d)
    lower(g, look, d)
    tunic(g, look, d)
  }
  torso(g, look, d)
  drape(g, look, d)
  straps(g, d, mode)
  return g
}

// An arm hanging from the shoulder pivot (local y = 0) down to the hand.
export function buildArm(look) {
  const g = new VoxelGrid()
  const short = look.sleeves === 'short'
  const sleeve = patterned(look.pattern, look.top)
  g.box(-1, -ARM_LEN, -2, 2, 0, 2, (x, y, z) => {
    if (y < -ARM_LEN + 2) return look.skin // hand
    if (short) return y >= -3 ? sleeve(x, y, z) : look.skin
    return sleeve(x, y, z)
  })
  if (!short && look.outfit.accent) g.box(-1, -ARM_LEN + 2, -2, 2, -ARM_LEN + 3, 2, look.outfit.accent)
  if (short && look.outfit.bottom !== 'dress') g.box(-1, -4, -2, 2, -3, 2, shade(look.top, -0.1))
  return g
}

export function buildStand() {
  const g = new VoxelGrid()
  g.box(-12, -3, -12, 12, 0, 12, (x, y, z) => {
    const edge = x === -12 || x === 11 || z === -12 || z === 11
    if (y === -1 && edge) return GOLD
    if (edge && (x === -12 || x === 11) && (z === -12 || z === 11) && y === -1) return null
    return y === -3 ? '#6e1f22' : '#8e2a2a'
  })
  return g
}
