import { LOOKUP } from '../../data/options.js'
import { VoxelGrid, shiny } from '../voxel/grid.js'
import { hairOn, faceOn } from './head.js'
import { itemAt } from './items.js'
import { PED, HIP, SHOULDER, HEAD0, HEAD1, shade, mod, hash3 } from './dims.js'

// A Bommai, voxel by voxel, in the chibi collectible style of the reference renders: a big
// boxy head (18 of ~44 voxels), pixel-art face, hair of stacked slabs, a small boxy body and
// clothes with the pattern woven into the voxels. One voxel is VOXEL units in the scene, so the
// doll stands about 1 unit tall on its lacquered pedestal. The doll faces +z; its left is +x.

export { VOXEL } from './dims.js'

const BUILDS = {
  slim: { tw: 8, td: 6 },
  regular: { tw: 10, td: 6 },
  round: { tw: 12, td: 8 },
}

const GOLD = '#e8b33c'
const WHITE = '#f6f1e8'

// The main colour of a garment with its pattern woven in.
function patterned(kind, base) {
  const light = shade(base, 0.2)
  switch (kind) {
    case 'butta': // little gold motifs, like silk-saree buttas
      return (x, y, z) => (mod(y, 4) === 1 && mod(x + z + (mod(y, 8) < 4 ? 2 : 0), 4) === 0 ? shiny(GOLD) : base)
    case 'polka':
      return (x, y, z) => (mod(y, 3) === 1 && mod(x + z + (mod(y, 6) < 3 ? 0 : 2), 4) === 0 ? WHITE : base)
    case 'check':
      return (x, y, z) => (mod(Math.floor(x / 2) + Math.floor(y / 2) + Math.floor(z / 2), 2) ? base : WHITE)
    case 'stripe':
      return (x, y) => (mod(y, 3) === 0 ? light : base)
    case 'sparkle': {
      const glint = shade(base, 0.35)
      return (x, y, z) => {
        const h = hash3(x, y, z) % 9
        return h === 0 ? shiny('#f4f2fa') : h === 1 ? shiny(glint) : base
      }
    }
    default:
      return () => base
  }
}

const isWarm = (id) => ['turmeric', 'mustard', 'cream'].includes(id)

export function resolveLook(cfg) {
  const o = LOOKUP.outfit[cfg.outfit]
  const main = LOOKUP.outfitColor[cfg.outfit_color].color
  const contrast = isWarm(cfg.outfit_color) ? '#7a1f2b' : '#e3a83a'
  const L = {
    o,
    skin: LOOKUP.skin[cfg.skin_tone].color,
    hair: LOOKUP.hairColor[cfg.hair_color].color,
    main,
    mainFn: patterned(o.pattern, main),
    accent: o.accent || shade(main, -0.15),
    pants: o.pants === null ? main : o.pants || shade(main, -0.2),
    sleeves: 'long',
    shoes: 'shoes',
    shoeColor: '#4a3328',
  }
  L.topFn = L.mainFn
  if (o.top === 'blouse') {
    L.topFn = () => contrast
    L.sleeves = 'short'
  }
  if (o.top === 'overalls') {
    L.topFn = () => WHITE
    L.sleeves = 'short'
  }
  if (o.top === 'straps') L.sleeves = 'none'
  if (['tee-jeans', 'jibba', 'dress'].includes(o.id)) L.sleeves = 'short'
  if (o.bottom === 'dhoti') L.pants = '#f6f0e1'
  L.drapeColor = o.drape === 'davani' ? contrast : o.drape === 'angavastram' ? '#f6f0e1' : o.drape === 'dupatta' ? shade(main, 0.18) : main
  // footwear follows the outfit, like the boots in the references
  if (['saree', 'skirt', 'dhoti'].includes(o.bottom) || ['kurta', 'salwar', 'jibba'].includes(o.id)) L.shoes = 'bare'
  if (['tee-jeans', 'hoodie', 'overalls', 'check-jacket'].includes(o.id)) L.shoes = 'sneakers'
  if (o.id === 'sherwani') L.shoeColor = '#b98a2e'
  if (o.id === 'dress') (L.shoes = 'boots'), (L.shoeColor = shade(main, -0.12))
  if (o.id === 'polka-dress') (L.shoes = 'boots'), (L.shoeColor = WHITE)
  if (o.id === 'sparkle-dress') (L.shoes = 'tall'), (L.shoeColor = '#25232b')
  if (o.id === 'stripe-skirt') (L.shoes = 'boots'), (L.shoeColor = '#2c4f8c')
  return L
}

// ── pedestal ────────────────────────────────────────────────────────────────
function pedestal(g) {
  for (let x = -12; x < 12; x++)
    for (let z = -12; z < 12; z++) {
      const d = Math.hypot(x + 0.5, z + 0.5)
      if (d < 11.6) g.set(x, 0, z, '#6e1f22')
      if (d < 11.1) {
        g.set(x, 1, z, '#9a2c2c')
        g.set(x, 2, z, d > 9.7 ? shiny('#e3a83a') : '#9a2c2c')
      }
    }
}

// ── legs and feet ───────────────────────────────────────────────────────────
function feet(g, L, B, x0, x1, z1 = 3) {
  const c = L.shoes === 'bare' ? L.skin : L.shoeColor
  const top = L.shoes === 'tall' ? 9 : L.shoes === 'boots' ? 7 : 5
  g.box(x0, x1, PED, top, -2, 2, c)
  g.box(x0, x1, PED, PED + 2, 2, z1, c) // toes
  if (L.shoes === 'bare') g.box(x0, x1, PED, PED + 1, -2, z1, '#7a4a2e') // sandal sole
  if (L.shoes === 'sneakers') {
    g.box(x0, x1, PED, PED + 1, -2, z1, '#d94a3a')
    g.box(x0, x1, PED + 1, PED + 2, -2, z1, WHITE)
    g.box(x0, x1, PED + 2, PED + 3, -2, 2, WHITE)
  }
  if (L.shoes === 'boots' || L.shoes === 'tall') {
    g.box(x0, x1, PED, PED + 1, -2, z1, shade(c, -0.18)) // sole
    g.box(x0, x1, top - 1, top, -2, 2, shade(c, 0.12)) // cuff
    if (L.o.id === 'sparkle-dress') g.box(x0, x1, PED + 1, top - 1, -2, 2, (x, y, z) => (hash3(x, y, z) % 5 ? c : shiny('#d9d6e6')))
    if (L.o.id === 'polka-dress') {
      // a little heart on each boot, like the reference
      const cx = (x0 + x1) >> 1
      g.set(cx, PED + 2, 2, '#e0607e')
    }
  }
}

function legs(g, L, B, sitting) {
  const lw = B.tw / 2 - 1
  const bottom = L.o.bottom
  const legColor = (y) => {
    if (bottom === 'pants') return L.pants
    if (bottom === 'shorts') return y >= 9 ? L.pants : L.skin
    if (bottom === 'dhoti') return L.pants
    return L.skin
  }
  if (sitting) {
    // a little wooden stool, thighs forward, shins down
    g.box(-6, 6, PED, 9, -6, 0, '#b9733f')
    g.box(-6, 6, 8, 9, -6, 0, '#9a5a30')
    for (const [x0, x1] of [
      [1, 1 + lw],
      [-1 - lw, -1],
    ]) {
      g.box(x0, x1, 9, HIP, -2, 7, (x, y) => legColor(y))
      g.box(x0, x1, PED, 9, 3, 7, (x, y) => legColor(y))
      feet(g, L, B, x0, x1, 3)
      g.box(x0, x1, PED, PED + 2, 6, 8, L.shoes === 'bare' ? L.skin : L.shoeColor)
    }
    return
  }
  for (const [x0, x1] of [
    [1, 1 + lw],
    [-1 - lw, -1],
  ]) {
    g.box(x0, x1, PED, HIP, -2, 2, (x, y) => legColor(y))
    feet(g, L, B, x0, x1)
  }
}

// ── skirts, dhotis, dresses ─────────────────────────────────────────────────
function flared(g, B, top, bot, every, color, extra = 0) {
  for (let y = top - 1; y >= bot; y--) {
    const k = Math.floor((top - 1 - y) / every) + extra
    const hx = B.tw / 2 + k
    const hz = B.td / 2 + k
    g.box(-hx, hx, y, y + 1, -hz, hz, color)
  }
}

function lower(g, L, B, sitting) {
  const { bottom } = L.o
  const hz = B.td / 2
  if (sitting) {
    if (['saree', 'skirt', 'dhoti'].includes(bottom)) {
      const c = bottom === 'dhoti' ? () => L.pants : L.mainFn
      g.box(-B.tw / 2 - 1, B.tw / 2 + 1, 8, HIP, -hz - 1, 8, c)
      g.box(-B.tw / 2 - 1, B.tw / 2 + 1, PED + 2, 8, 6, 8, c)
      g.box(-B.tw / 2 - 1, B.tw / 2 + 1, PED + 2, PED + 3, 6, 8, bottom === 'dhoti' ? shiny(GOLD) : shiny(L.accent))
    } else if (bottom === 'dress' || bottom === 'mini') {
      g.box(-B.tw / 2 - 1, B.tw / 2 + 1, 9, HIP, -hz - 1, 7, bottom === 'mini' ? L.pants : L.mainFn)
    }
    return
  }
  if (bottom === 'saree') {
    flared(g, B, HIP, PED + 2, 4, L.mainFn)
    // pleats tucked at the front, then the zari border
    for (let y = PED + 2; y < HIP - 1; y++) for (let x = -3; x < 3; x++) if (mod(x, 2)) g.paint(x, y, hz + 1, shade(L.main, -0.07))
    flared(g, B, PED + 4, PED + 2, 9, shiny(L.accent), 2)
    return
  }
  if (bottom === 'skirt') {
    flared(g, B, HIP, PED + 2, 3, L.mainFn)
    flared(g, B, PED + 4, PED + 2, 9, shiny(L.accent), 3)
    flared(g, B, 9, 8, 9, shiny(L.accent), 1)
    return
  }
  if (bottom === 'dhoti') {
    g.box(-B.tw / 2, B.tw / 2, PED + 2, HIP, -hz, hz, L.pants)
    g.box(-B.tw / 2, B.tw / 2, PED + 2, PED + 3, -hz, hz, shiny(GOLD))
    g.box(-1, 1, PED + 3, HIP - 1, hz, hz + 1, shade(L.pants, -0.06)) // front fold
    return
  }
  if (bottom === 'dress') {
    // tiers that each step out a voxel, like the ruffled dresses in the references
    const bot = L.o.id === 'sparkle-dress' ? 9 : 7
    for (let y = HIP - 1; y >= bot; y--) {
      const k = Math.floor((HIP - 1 - y) / 2)
      g.box(-B.tw / 2 - k, B.tw / 2 + k, y, y + 1, -hz - k, hz + k, (x, yy, z) => (mod(HIP - 1 - y, 2) && L.o.id === 'dress' ? shade(L.main, -0.06) : L.mainFn(x, yy, z)))
    }
    return
  }
  if (bottom === 'mini') {
    g.box(-B.tw / 2, B.tw / 2, HIP - 1, HIP, -hz, hz, shade(L.pants, -0.15)) // waistband
    flared(g, B, HIP - 1, 8, 2, L.pants)
  }
}

// ── torso, tunics, necklines ────────────────────────────────────────────────
function torso(g, L, B, sitting) {
  const { o } = L
  const x1 = B.tw / 2
  const z1 = B.td / 2
  g.box(-x1, x1, HIP, SHOULDER, -z1, z1, L.topFn)
  const front = z1 - 1

  // tunic tails below the waist
  if (o.topLength > 1 && !sitting) {
    const bot = Math.round(HIP - (o.topLength - 1) * 10)
    for (let y = HIP - 1; y >= bot; y--) {
      const k = y < HIP - 2 ? 1 : 0
      g.box(-x1 - k, x1 + k, y, y + 1, -z1 - k, z1 + k, L.topFn)
    }
    if (o.accent) g.box(-x1 - 1, x1 + 1, bot, bot + 1, -z1 - 1, z1 + 1, shiny(o.accent))
  }
  if (o.topLength > 1 && sitting) g.box(-x1, x1, 9, HIP, -z1, 7, L.topFn)
  if (o.accent && o.topLength > 1) {
    // placket and collar
    g.box(-1, 1, SHOULDER - 6, SHOULDER, front, z1, shiny(o.accent))
    if (o.id === 'sherwani') for (let y = HIP; y < SHOULDER - 1; y += 2) g.set(0, y, z1, shiny(GOLD))
  }
  if (o.top === 'blouse' || o.id === 'dress' || o.id === 'tee-jeans' || o.id === 'jibba') {
    g.box(-2, 2, SHOULDER - 1, SHOULDER, front, z1, L.skin) // scoop neck
    if (o.top === 'blouse') g.box(-x1, x1, HIP, HIP + 1, -z1, z1, L.skin) // a peek of waist under the blouse
  }
  if (o.id === 'dress') g.box(-3, 3, SHOULDER - 2, SHOULDER - 1, front, z1 + 1, WHITE) // collar
  if (o.top === 'straps') {
    g.box(-x1, x1, SHOULDER - 3, SHOULDER, -z1, z1, L.skin)
    for (const x of [-3, 2]) g.box(x, x + 1, SHOULDER - 3, SHOULDER, -z1, z1, L.main)
    g.box(-x1, x1, SHOULDER - 4, SHOULDER - 3, -z1, z1, L.mainFn) // scalloped edge
    for (let x = -x1; x < x1; x += 2) g.set(x, SHOULDER - 3, front, L.main)
  }
  if (o.top === 'shirt' || o.id === 'shirt-pants') {
    for (const x of [-3, 1]) g.box(x, x + 2, SHOULDER - 2, SHOULDER, front, z1 + 1, shade(L.main, 0.12)) // collar
    for (let y = HIP + 1; y < SHOULDER - 2; y += 3) g.set(0, y, z1, WHITE)
  }
  if (o.id === 'tee-jeans') g.box(-2, 2, HIP + 3, HIP + 6, front, z1, WHITE) // print
  if (o.top === 'hoodie') {
    g.box(-4, 4, SHOULDER - 3, SHOULDER + 1, -z1 - 2, -z1, shade(L.main, -0.08))
    g.box(-3, 3, HIP + 1, HIP + 4, front, z1 + 1, shade(L.main, -0.08))
    for (const x of [-2, 1]) g.box(x, x + 1, SHOULDER - 4, SHOULDER - 1, z1, z1 + 1, WHITE)
  }
  if (o.top === 'overalls') {
    g.box(-x1 + 1, x1 - 1, HIP, HIP + 6, -z1, z1 + 1, L.main) // bib
    g.box(-x1, x1, HIP, HIP + 2, -z1, z1, L.main)
    for (const x of [-x1 + 1, x1 - 2]) g.box(x, x + 1, HIP + 6, SHOULDER, z1, z1 + 1, L.main)
    g.box(-1, 1, HIP + 3, HIP + 5, z1 + 1, z1 + 2, shade(L.main, -0.15))
  }
  if (o.top === 'jacket') {
    g.box(-2, 2, HIP, SHOULDER, front, z1, WHITE) // tee under the open jacket
    g.box(-2, 2, SHOULDER - 1, SHOULDER, front, z1, L.skin)
    for (const x of [-3, 2]) g.box(x, x + 1, HIP, SHOULDER, z1, z1 + 1, L.mainFn) // lapels
  }
  if (L.o.bottom === 'pants' && !(o.topLength > 1) && o.top !== 'overalls' && o.top !== 'hoodie') g.box(-x1, x1, HIP, HIP + 1, -z1, z1, shade(L.pants, -0.12)) // belt line
  // neck
  g.box(-2, 2, SHOULDER, HEAD0, -2, 2, L.skin)
  drape(g, L, B)
}

function drape(g, L, B) {
  const kind = L.o.drape
  if (!kind) return
  const x1 = B.tw / 2
  const z1 = B.td / 2
  const c = kind === 'pallu' ? L.mainFn : () => L.drapeColor
  if (kind === 'dupatta') {
    g.box(-x1, x1, SHOULDER, SHOULDER + 1, -z1 - 1, z1 + 1, c)
    g.clear(-2, 2, SHOULDER, SHOULDER + 1, -2, 2)
    g.box(-2, 2, SHOULDER, HEAD0, -2, 2, L.skin)
    for (const x of [-x1, x1 - 2]) g.box(x, x + 2, HIP - 2, SHOULDER, z1, z1 + 1, c)
    return
  }
  const w = kind === 'angavastram' ? 2 : 3
  // across the chest from the right hip up to the left shoulder
  for (let y = HIP; y < SHOULDER; y++) {
    const t = (y - HIP) / (SHOULDER - HIP - 1)
    const cx = Math.round(-x1 + 1 + t * (B.tw - 3))
    g.box(cx - 1, cx - 1 + w, y, y + 1, z1, z1 + 1, c)
    g.set(cx - 1 + w, y, z1, shiny(GOLD))
  }
  // over the shoulder and down the back
  g.box(x1 - 3, x1, SHOULDER, SHOULDER + 1, -z1 - 1, z1 + 1, c)
  const bot = kind === 'angavastram' ? 10 : PED + 3
  g.box(x1 - 4, x1, bot, SHOULDER, -z1 - 1, -z1, c)
  g.box(x1 - 4, x1, bot, bot + 1, -z1 - 1, -z1, shiny(GOLD))
}

// ── arms ────────────────────────────────────────────────────────────────────
// Each arm is 3×3 voxels. Segments are given in "outward" x (0 = against the torso).
const ARM_POSES = {
  down: [
    [0, 3, 19, 22, -1, 2, 'upper'],
    [0, 3, 15, 19, -1, 2, 'fore'],
    [0, 3, 13, 15, -1, 2, 'hand'],
  ],
  forward: [
    [0, 3, 19, 22, -1, 2, 'upper'],
    [0, 3, 14, 19, -1, 2, 'fore'],
    [0, 3, 14, 17, 2, 5, 'fore'],
    [0, 3, 14, 17, 5, 7, 'hand'],
  ],
  raised: [
    [0, 3, 19, 22, -1, 2, 'upper'],
    [3, 10, 19, 22, -1, 2, 'fore'],
  ],
  // the waving forearm lives in its own mesh so it can rock (see Bommai.jsx)
  forearmUp: [
    [7, 10, 22, 28, -1, 2, 'fore'],
    [7, 10, 28, 30, -1, 2, 'hand'],
  ],
}

function arm(g, L, B, side, pose) {
  const half = B.tw / 2
  const X = (a, b) => (side > 0 ? [half + a, half + b] : [-half - b, -half - a])
  const color = (role) => (x, y, z) => {
    if (role === 'hand') return L.skin
    if (L.sleeves === 'none') return L.skin
    if (L.sleeves === 'short') return role === 'upper' ? L.topFn(x, y, z) : L.skin
    return L.topFn(x, y, z)
  }
  if (pose === 'namaste') {
    for (const s of ARM_POSES.forward.slice(0, 2)) {
      const [a, b] = X(s[0], s[1])
      g.box(a, b, s[2], s[3], s[4], s[5], color(s[6]))
    }
    const [a, b] = X(-half + 1, 3)
    g.box(a, b, 14, 17, 2, 5, color('fore'))
    const [h0, h1] = X(-half, -half + 2)
    g.box(h0, h1, 16, 21, 3, 5, L.skin)
    return
  }
  for (const s of ARM_POSES[pose]) {
    const [a, b] = X(s[0], s[1])
    g.box(a, b, s[2], s[3], s[4], s[5], color(s[6]))
  }
}

// How an accessory is carried depends on the pose, so the two always make sense together.
export function carryMode(acc, pose) {
  if (!acc || acc.id === 'none') return null
  if (acc.hold === 'hand') return pose === 'namaste' ? 'clasp' : 'hand'
  if (acc.hold === 'both') {
    if (pose === 'holding' || pose === 'sitting') return 'chest'
    if (acc.id === 'guitar') return pose === 'namaste' ? 'slung-back' : 'slung'
    if (acc.id === 'camera') return 'strap'
    if (acc.id === 'controller') return pose === 'namaste' ? 'clasp' : 'hand'
    return 'tuck'
  }
  return acc.hold
}

// Returns { body, wave } VoxelGrids; `wave` is the waving forearm (or null) with its elbow pivot.
export function buildBommai(cfg) {
  const L = resolveLook(cfg)
  const B = BUILDS[cfg.body] || BUILDS.regular
  const g = new VoxelGrid()
  const sitting = cfg.pose === 'sitting'
  const acc = LOOKUP.accessory[cfg.accessory]
  const mode = carryMode(acc, cfg.pose)
  const handSide = cfg.pose === 'waving' ? 1 : -1 // the doll's right hand unless it is waving with it

  pedestal(g)
  legs(g, L, B, sitting)
  lower(g, L, B, sitting)
  torso(g, L, B, sitting)

  // head: a big box with softened vertical edges
  g.box(-10, 10, HEAD0, HEAD1, -8, 8, L.skin)
  for (let y = HEAD0; y < HEAD1; y++) for (const x of [-10, 9]) for (const z of [-8, 7]) g.set(x, y, z, null)
  for (let x = -10; x < 10; x++) for (const z of [-8, 7]) (g.set(x, HEAD0, z, null), g.set(x, HEAD1 - 1, z, null))
  for (let z = -8; z < 8; z++) for (const x of [-10, 9]) (g.set(x, HEAD0, z, null), g.set(x, HEAD1 - 1, z, null))
  faceOn(g, cfg, L)
  hairOn(g, cfg, L)

  const anchors = {
    hand: [handSide > 0 ? B.tw / 2 + 1 : -B.tw / 2 - 2, 17, 6],
    clasp: [0, 21, 4],
    chest: [0, 17, 7],
    strap: [0, 13, B.td / 2],
    slung: [0, 14, B.td / 2],
    tuck: [handSide > 0 ? B.tw / 2 + 3 : -B.tw / 2 - 4, 13, 0],
    ground: [17, 0, 1],
  }
  if (mode) itemAt(g, acc.id, mode, anchors, { L, B, side: handSide, sitting })

  const pose = cfg.pose
  const armPose = (side) => {
    if (pose === 'namaste') return 'namaste'
    if (pose === 'holding' || pose === 'sitting') return 'forward'
    if (pose === 'waving' && side < 0) return 'raised'
    if (mode === 'hand' && side === handSide) return 'forward'
    return 'down'
  }
  arm(g, L, B, 1, armPose(1))
  arm(g, L, B, -1, armPose(-1))
  if (mode === 'chest' && acc.id === 'guitar') itemAt(g, 'guitar-strap', mode, anchors, { L, B })

  let wave = null
  if (pose === 'waving') {
    const w = new VoxelGrid(80, 72, 16)
    arm(w, L, B, -1, 'forearmUp')
    wave = { grid: w, pivot: [-B.tw / 2 - 8.5, 22, 0.5] }
  }
  return { body: g, wave }
}
