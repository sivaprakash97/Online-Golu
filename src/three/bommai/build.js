import { LOOKUP } from '../../data/options.js'
import { VoxelGrid, shiny } from '../voxel/grid.js'
import { hairOn, faceOn } from './head.js'
import { itemAt } from './items.js'
import { PED, HIP, SHOULDER, HEAD0, HEAD1, HW, HD, shade, mod } from './dims.js'

// A Bommai, voxel by voxel, in a chibi collectible style: a big softly rounded head (36 of ~88
// voxels), a painted pixel-art face, hair of stacked slabs, a small body and clothes with their
// borders and motifs woven into the voxels. One voxel is VOXEL units in the scene, so the doll
// stands about 1 unit tall on its lacquered pedestal. The doll faces +z; its left is +x.

export { VOXEL } from './dims.js'

const BUILDS = {
  slim: { tw: 16, td: 12 },
  regular: { tw: 20, td: 12 },
  round: { tw: 24, td: 16 },
}

const GOLD = '#e8b33c'
const WHITE = '#f6f1e8'

// The main colour of a garment with its pattern woven in.
function patterned(kind, base) {
  if (kind !== 'butta') return () => base
  // little gold motifs, like silk-saree buttas: a five-voxel flower on a staggered 6×6 grid
  const gold = shiny(GOLD)
  return (x, y, z) => {
    const u = mod(x + z + (mod(y, 12) < 6 ? 3 : 0), 6)
    const v = mod(y, 6)
    return (u === 2 && v >= 1 && v <= 3) || (v === 2 && (u === 1 || u === 3)) ? gold : base
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
    contrast,
    mainFn: patterned(o.pattern, main),
    accent: o.accent || shade(main, -0.15),
    pants: o.pants || shade(main, -0.2),
    sleeves: 'long',
    shoes: 'shoes',
    shoeColor: '#5a3a2a',
  }
  L.topFn = L.mainFn
  if (o.top === 'blouse') {
    L.topFn = () => contrast
    L.sleeves = 'short'
  }
  if (['tee', 'shirt'].includes(o.top) && o.id !== 'shirt-pants') L.sleeves = 'short'
  if (o.id === 'dress') L.sleeves = 'puff'
  if (o.bottom === 'dhoti') L.pants = '#f8f3e6'
  L.drapeColor = o.drape === 'davani' ? contrast : o.drape === 'angavastram' ? '#f8f3e6' : o.drape === 'dupatta' ? shade(main, 0.16) : main
  // footwear follows the outfit
  if (['saree', 'skirt', 'dhoti'].includes(o.bottom) || ['kurta', 'salwar'].includes(o.id)) L.shoes = 'bare'
  if (['tee-jeans', 'hoodie'].includes(o.id)) L.shoes = 'sneakers'
  if (o.id === 'sherwani') L.shoeColor = '#c99a3a'
  if (o.id === 'dress') (L.shoes = 'flats'), (L.shoeColor = shade(main, -0.18))
  return L
}

// ── pedestal ────────────────────────────────────────────────────────────────
function pedestal(g) {
  for (let x = -24; x < 24; x++)
    for (let z = -24; z < 24; z++) {
      const d = Math.hypot(x + 0.5, z + 0.5)
      if (d < 23.4) (g.set(x, 0, z, '#6e1f22'), g.set(x, 1, z, d > 22.3 ? shiny('#c9922f') : '#6e1f22'))
      if (d < 22.4) for (let y = 2; y < PED; y++) g.set(x, y, z, y === PED - 1 && d > 19.8 ? shiny('#e3a83a') : '#9a2c2c')
    }
}

// ── legs and feet ───────────────────────────────────────────────────────────
// A foot under the leg [x0, x1), its heel at z0 and toes reaching z0 + 9.
function foot(g, L, x0, x1, z0 = -3) {
  const y = PED
  const skin = L.skin
  const toe = z0 + 9
  const round = (c) => (x, yy, z) => (z === toe - 1 && yy === y + 2 && (x === x0 || x === x1 - 1) ? null : c)
  if (L.shoes === 'bare') {
    g.box(x0, x1, y, y + 3, z0, toe, round(skin))
    g.box(x0, x1, y, y + 1, z0, toe, '#7a4a2e') // sandal sole
    g.box(x0, x1, y + 1, y + 2, toe - 4, toe - 3, '#7a4a2e') // strap
    return
  }
  const c = L.shoeColor
  if (L.shoes === 'sneakers') {
    g.box(x0, x1, y, y + 4, z0, toe, round('#f4f1ea'))
    g.box(x0, x1, y, y + 1, z0, toe, '#cfc9be') // sole
    g.box(x0, x1, y + 1, y + 3, z0 + 1, z0 + 5, (x) => (x === x0 || x === x1 - 1 ? L.main : null)) // side stripe
    for (let z = z0 + 5; z < toe - 2; z += 2) g.box(x0 + 2, x1 - 2, y + 4, y + 5, z, z + 1, '#f4f1ea') // laces
    g.box(x0 + 1, x1 - 1, y + 3, y + 4, z0 + 4, toe - 2, L.main)
    return
  }
  if (L.shoes === 'flats') {
    g.box(x0, x1, y, y + 2, z0, toe, round(c))
    g.box(x0, x1, y + 2, y + 3, z0, z0 + 4, c)
    g.box(x0, x1, y + 2, y + 3, z0 + 4, toe - 1, L.skin)
    g.box(x0, x1, y + 2, y + 3, toe - 6, toe - 5, c) // strap
    return
  }
  g.box(x0, x1, y, y + 4, z0, toe, round(c))
  g.box(x0, x1, y, y + 1, z0, toe, shade(c, -0.2)) // sole
}

function legColor(L) {
  const bottom = L.o.bottom
  if (bottom === 'pants' || bottom === 'dhoti') return () => L.pants
  return () => L.skin
}

function legs(g, L, B, pose) {
  const lw = B.tw / 2 - 2
  const c = legColor(L)
  if (pose === 'sitting') {
    // a little wooden stool; thighs forward, shins down
    g.rounded(-12, 12, PED, 18, -14, 0, 1.5, '#b9733f', true)
    g.box(-12, 12, 16, 18, -14, 0, '#9a5a30')
    for (const [x0, x1] of [
      [1, 1 + lw],
      [-1 - lw, -1],
    ]) {
      g.rounded(x0, x1, 17, HIP + 1, -4, 14, 1.5, c)
      g.rounded(x0, x1, PED + 2, 19, 7, 14, 1.5, c)
      foot(g, L, x0, x1, 6)
    }
    return
  }
  if (pose === 'cross-legged') {
    // shins crossed in front, feet tucked at the ends; the body sits just above them
    const w = B.tw / 2 + 5
    g.rounded(-w, w, PED, PED + 7, -2, 9, 3, c)
    g.rounded(-w + 2, w - 2, PED + 5, PED + 9, -4, 7, 2.5, c)
    for (const s of [1, -1]) {
      const x0 = s > 0 ? w - 7 : -w + 1
      const sole = L.shoes === 'bare' ? shade(L.skin, -0.06) : L.shoeColor
      g.rounded(x0, x0 + 6, PED, PED + 5, 7, 12, 1.5, sole)
    }
    return
  }
  const spread = L.o.bottom !== 'pants' ? 0 : pose === 'dancing' ? 3 : pose === 'hips' ? 1 : 0 // skirts hide the stance
  for (const [x0, x1] of [
    [1 + spread, 1 + lw + spread],
    [-1 - lw - spread, -1 - spread],
  ]) {
    g.rounded(x0, x1, PED + 2, HIP + 1, -3, 3, 1.5, c, true)
    if (L.o.id === 'tee-jeans') g.box(x0, x1, PED + 4, PED + 6, -3, 3, (x, y, z) => (Math.abs(z + 0.5) < 3 && (x === x0 || x === x1 - 1 || Math.abs(z + 0.5) > 2) ? shade(L.pants, 0.12) : null)) // rolled cuffs
    if (L.o.bottom === 'pants' && L.o.id !== 'tee-jeans') g.box(x0, x1, PED + 4, PED + 5, -3, 3, (x, y, z) => (g.has(x, y, z) ? shade(L.pants, -0.08) : null))
    foot(g, L, x0, x1)
  }
}

// ── skirts, dhotis, dresses ─────────────────────────────────────────────────
// Rows from `top - 1` down to `bot` that step out one voxel every `every` rows.
function flared(g, B, top, bot, every, color, extra = 0) {
  for (let y = top - 1; y >= bot; y--) {
    const k = Math.floor((top - 1 - y) / every) + extra
    const hx = B.tw / 2 + k
    const hz = B.td / 2 + k
    g.rounded(-hx, hx, y, y + 1, -hz, hz, 2.5, color, true)
  }
}
const flareAt = (B, top, y, every, extra = 0) => B.td / 2 + Math.floor((top - 1 - y) / every) + extra

function lap(g, L, B) {
  // the skirt of someone sitting cross-legged, spread over the knees
  const w = B.tw / 2 + 7
  const c = L.o.bottom === 'dhoti' ? () => L.pants : L.mainFn
  const border = L.o.bottom === 'dhoti' ? shiny(GOLD) : shiny(L.accent)
  g.rounded(-w, w, PED, PED + 9, -B.td / 2 - 3, 12, 3.5, (x, y, z) => (y < PED + 2 ? border : c(x, y, z)))
}

function lowerBody(g, L, B, pose) {
  const { bottom, id } = L.o
  const hz = B.td / 2
  if (pose === 'cross-legged') {
    if (['saree', 'skirt', 'dhoti', 'dress'].includes(bottom)) lap(g, L, B)
    return
  }
  if (pose === 'sitting') {
    if (bottom === 'pants') return
    const c = bottom === 'dhoti' ? () => L.pants : L.mainFn
    const long = bottom !== 'dress'
    g.rounded(-B.tw / 2 - 2, B.tw / 2 + 2, 16, HIP + 1, -hz - 2, 16, 2, c)
    if (long) {
      g.rounded(-B.tw / 2 - 2, B.tw / 2 + 2, PED + 3, 17, 11, 16, 1.5, c)
      g.box(-B.tw / 2 - 2, B.tw / 2 + 2, PED + 3, PED + 5, 11, 16, (x, y, z) => (g.has(x, y, z) ? (bottom === 'dhoti' ? shiny(GOLD) : shiny(L.accent)) : null))
    } else g.box(-B.tw / 2 - 2, B.tw / 2 + 2, 16, 18, -hz - 2, 16, (x, y, z) => (g.has(x, y, z) ? WHITE : null))
    return
  }
  if (bottom === 'saree') {
    flared(g, B, HIP, PED + 1, 4, L.mainFn)
    // pleats tucked in at the front, then the zari border at the hem
    for (let y = PED + 4; y < HIP - 1; y++) {
      const z = flareAt(B, HIP, y, 4) - 1
      for (let x = -6; x < 6; x++) if (mod(x, 3) === 0) g.paint(x, y, z, shade(L.main, -0.1))
    }
    flared(g, B, PED + 5, PED + 1, 4, (x, y) => (y === PED + 3 ? shade(L.accent, -0.25) : shiny(L.accent)), 4)
    return
  }
  if (bottom === 'skirt') {
    // pattu pavadai: a full skirt with a broad gold border
    flared(g, B, HIP, PED + 1, 3, L.mainFn)
    flared(g, B, PED + 5, PED + 1, 3, (x, y) => (y === PED + 3 ? L.contrast : shiny(L.accent)), 6)
    flared(g, B, 14, 13, 3, shiny(L.accent), 3)
    return
  }
  if (bottom === 'dhoti') {
    const x1 = B.tw / 2 + 1
    g.rounded(-x1, x1, PED + 3, HIP, -hz - 1, hz + 1, 2, L.pants, true)
    g.box(-x1, x1, PED + 3, PED + 5, -hz - 1, hz + 1, (x, y, z) => (g.has(x, y, z) ? shiny(GOLD) : null))
    g.box(-x1, x1, PED + 6, PED + 7, -hz - 1, hz + 1, (x, y, z) => (g.has(x, y, z) ? shiny(GOLD) : null))
    // the front fold
    g.box(-2, 2, PED + 5, HIP - 1, hz + 1, hz + 2, shade(L.pants, -0.05))
    g.box(-2, 2, PED + 3, PED + 5, hz + 1, hz + 2, shiny(GOLD))
    return
  }
  if (bottom === 'dress') {
    // a smooth A-line skirt to the knee, with a white hem
    flared(g, B, HIP, 12, 2, L.mainFn)
    flared(g, B, 14, 12, 2, WHITE, 5)
  }
}

// ── torso, tunics, necklines ────────────────────────────────────────────────
const proud = (g, x, y, z, c) => g.set(x, y, z, c)

function torso(g, L, B, pose) {
  const { o } = L
  const x1 = B.tw / 2
  const z1 = B.td / 2
  const sitting = pose === 'sitting' || pose === 'cross-legged'
  // the body, with its shoulders and sides rounded off
  g.rounded(-x1, x1, HIP - 6, SHOULDER + 1, -z1, z1, 2.5, (x, y, z) => (y < HIP ? null : L.topFn(x, y, z)))
  const front = z1 - 1

  // tunic tails below the waist
  if (o.topLength > 1) {
    const bot = sitting ? HIP - 4 : Math.round(HIP - (o.topLength - 1) * 20)
    for (let y = HIP - 1; y >= bot; y--) {
      const k = 1 + Math.floor((HIP - 1 - y) / 5)
      g.rounded(-x1 - k, x1 + k, y, y + 1, -z1 - k, z1 + k, 2.5, (x, yy, z) => (yy < bot + 2 && o.accent ? shiny(o.accent) : L.topFn(x, yy, z)))
    }
    if (o.id === 'kurta' || o.id === 'salwar') {
      // side slits
      const k = 1 + Math.floor((HIP - 1 - bot) / 5)
      for (let y = bot; y < bot + 6 && !sitting; y++) for (let z = -z1 - k; z < z1 + k; z++) for (const x of [-x1 - k, x1 + k - 1]) if (Math.abs(z + 0.5) < 1.5) g.set(x, y, z, null)
    }
  }
  if (o.topLength > 1 && o.accent) {
    // placket and a mandarin collar
    if (o.id !== 'salwar') g.box(-1, 1, SHOULDER - 12, SHOULDER, front, z1 + 1, shiny(o.accent))
    if (o.id === 'salwar') g.box(-3, 3, SHOULDER - 6, SHOULDER, front, z1, (x, y) => (Math.abs(x + 0.5) < 3 - (SHOULDER - 1 - y) / 2 ? L.skin : null))
    g.rounded(-5, 5, SHOULDER - 1, SHOULDER + 2, -5, 5, 1.5, o.id === 'sherwani' ? shiny(GOLD) : shade(L.main, -0.1))
    if (o.id === 'sherwani') for (let y = sitting ? HIP : HIP - 12; y < SHOULDER - 3; y += 4) proud(g, 0, y, z1 + 1, shiny(GOLD))
  }
  if (o.top === 'blouse') {
    // scoop neck, and a peek of waist under the blouse
    for (let y = SHOULDER - 4; y < SHOULDER + 1; y++) {
      const w = 2 + Math.floor((y - (SHOULDER - 4)) * 0.8)
      g.box(-w, w, y, y + 1, front - 1, z1, L.skin)
    }
    g.box(-x1, x1, HIP, HIP + 3, -z1, z1, (x, y, z) => (g.has(x, y, z) ? L.skin : null))
  }
  if (o.top === 'tee') {
    g.box(-3, 3, SHOULDER - 2, SHOULDER + 1, front - 1, z1, L.skin) // crew neck
    g.box(-4, 4, SHOULDER - 3, SHOULDER - 2, front, z1, shade(L.main, -0.1))
    const heart = ['.x.x.', 'xxxxx', 'xxxxx', '.xxx.', '..x..']
    heart.forEach((row, r) => [...row].forEach((ch, i) => ch === 'x' && g.paint(i - 2, SHOULDER - 9 - r, front, WHITE)))
    g.box(-x1, x1, HIP, HIP + 1, -z1, z1, (x, y, z) => (g.has(x, y, z) ? shade(L.main, -0.08) : null))
  }
  if (o.id === 'dress') {
    g.box(-3, 3, SHOULDER - 2, SHOULDER + 1, front - 1, z1, L.skin)
    // a round white collar, and a sash at the waist with a bow
    for (const s of [-1, 1]) g.ellipsoid(s * 3, SHOULDER - 2.5, z1, 3.2, 2.4, 1.2, WHITE)
    g.box(-3, 3, SHOULDER - 2, SHOULDER + 1, front - 1, z1 + 1, (x, y, z) => (z >= front && Math.abs(x + 0.5) < 2.5 && y >= SHOULDER - 1 ? L.skin : null))
    g.box(-x1, x1, HIP, HIP + 3, -z1, z1, (x, y, z) => (g.has(x, y, z) ? shade(L.main, -0.22) : null))
    g.ellipsoid(-3, HIP + 1.5, z1 + 0.5, 2.6, 2.2, 1.2, shade(L.main, -0.22))
    g.ellipsoid(3, HIP + 1.5, z1 + 0.5, 2.6, 2.2, 1.2, shade(L.main, -0.22))
    g.box(-1, 1, HIP, HIP + 3, z1, z1 + 2, shade(L.main, -0.3))
  }
  if (o.top === 'shirt') {
    g.box(-2, 2, SHOULDER - 3, SHOULDER + 1, front - 1, z1, L.skin) // open neck
    for (const s of [-1, 1])
      for (let y = SHOULDER - 4; y < SHOULDER + 1; y++) {
        const a = SHOULDER - y // collar points, widest at the top
        const xa = s > 0 ? 2 : -2 - Math.min(a + 1, 4)
        g.box(xa, xa + Math.min(a + 1, 4), y, y + 1, front, z1 + 1, shade(L.main, 0.1))
      }
    for (let y = HIP + 3; y < SHOULDER - 4; y += 4) g.paint(0, y, front, WHITE)
    g.box(x1 - 7, x1 - 3, SHOULDER - 11, SHOULDER - 7, front, z1, (x, y) => (y === SHOULDER - 8 ? shade(L.main, -0.15) : null)) // pocket
    if (L.o.bottom === 'pants') {
      g.box(-x1, x1, HIP, HIP + 2, -z1, z1, (x, y, z) => (g.has(x, y, z) ? '#4a2c1d' : null)) // belt
      g.box(-1, 1, HIP, HIP + 2, front, z1 + 1, shiny(GOLD))
    }
  }
  if (o.top === 'hoodie') {
    const d = shade(L.main, -0.1)
    g.rounded(-7, 7, SHOULDER - 4, SHOULDER + 4, -z1 - 4, -z1 + 3, 2.5, d) // hood
    g.box(-5, 5, HIP + 3, HIP + 8, front, z1 + 1, (x, y) => (y === HIP + 7 ? shade(L.main, -0.2) : d)) // pocket
    for (const x of [-3, 2]) g.box(x, x + 1, SHOULDER - 8, SHOULDER - 1, z1, z1 + 1, WHITE) // drawstrings
    g.box(-3, 3, SHOULDER - 1, SHOULDER + 1, front - 1, z1, L.skin)
    g.box(-x1, x1, HIP, HIP + 2, -z1, z1, (x, y, z) => (g.has(x, y, z) ? d : null)) // ribbed hem
  }
  // neck
  g.box(-4, 4, SHOULDER, HEAD0 + 2, -4, 4, L.skin)
  drape(g, L, B, pose)
}

function drape(g, L, B, pose) {
  const kind = L.o.drape
  if (!kind) return
  const x1 = B.tw / 2
  const z1 = B.td / 2
  const c = kind === 'pallu' ? L.mainFn : () => L.drapeColor
  const edge = kind === 'davani' ? shiny(GOLD) : shiny(L.accent)
  if (kind === 'dupatta') {
    // over both shoulders, both ends hanging down the front
    g.box(-x1 - 1, x1 + 1, SHOULDER - 1, SHOULDER + 2, -z1 - 1, z1 + 1, (x, y, z) => (Math.abs(x + 0.5) < 5 && Math.abs(z + 0.5) < 5 ? null : c(x, y, z)))
    const bot = pose === 'sitting' || pose === 'cross-legged' ? HIP : HIP - 8
    for (const s of [-1, 1]) {
      const xa = s > 0 ? x1 - 5 : -x1
      g.box(xa, xa + 5, bot, SHOULDER, z1, z1 + 1, (x, y) => (y < bot + 2 ? edge : c(x, y)))
    }
    return
  }
  const w = kind === 'angavastram' ? 5 : 7
  // across the chest from the right hip up to the left shoulder, with a gold edge
  for (let y = HIP; y < SHOULDER + 1; y++) {
    const t = (y - HIP) / (SHOULDER - HIP)
    const cx = Math.round(-x1 + 1 + t * (B.tw - w - 1))
    g.box(cx, cx + w, y, y + 1, z1, z1 + 1, c)
    g.set(cx + w, y, z1, edge)
  }
  // over the shoulder and down the back
  g.box(x1 - w, x1 + 1, SHOULDER - 1, SHOULDER + 2, -z1 - 1, z1 + 1, c)
  const low = kind === 'pallu' && pose !== 'sitting' && pose !== 'cross-legged'
  const bot = low ? PED + 3 : kind === 'angavastram' ? 22 : 16
  g.box(x1 - w - 1, x1 + 1, bot, SHOULDER + 1, -z1 - 2, -z1, (x, y, z) => (z === -z1 - 1 ? null : y < bot + 3 ? edge : c(x, y, z)))
}

// ── arms ────────────────────────────────────────────────────────────────────
// Arms are 5×5 voxels. Segments are [x0, x1, y0, y1, z0, z1, role] with x measured outward from
// the side of the body (0 = against it).
// Raised arms reach out past the hair before they go up, so the big head never hides them;
// `out` is how far out that is from the side of the body.
function armPoses(out) {
  return {
    down: [
      [0, 5, 36, 44, -2, 3, 'upper'],
      [0, 5, 29, 37, -2, 3, 'fore'],
      [0, 5, 24, 30, -2, 3, 'hand'],
    ],
    forward: [
      [0, 5, 33, 44, -2, 3, 'upper'],
      [0, 5, 30, 35, -1, 12, 'fore'],
      [0, 5, 29, 35, 11, 15, 'hand'],
    ],
    // holding something up beside the face, the forearm turned a little outward
    offer: [
      [0, 5, 33, 44, -2, 3, 'upper'],
      [1, 7, 30, 35, -1, 9, 'fore'],
      [4, 10, 29, 35, 7, 12, 'hand'],
    ],
    // seated, hands resting on the knees
    lap: [
      [0, 5, 34, 44, -2, 3, 'upper'],
      [0, 5, 29, 35, -1, 8, 'fore'],
      [0, 5, 26, 31, 6, 11, 'hand'],
    ],
    hips: [
      [0, 5, 37, 44, -2, 3, 'upper'],
      [2, 7, 33, 38, -2, 3, 'upper'],
      [4, 9, 29, 34, -2, 3, 'fore'],
      [2, 7, 26, 30, -2, 3, 'fore'],
      [-1, 4, 23, 28, -1, 3, 'hand'],
    ],
    // up and a little outward, for a cheer
    up: [
      [0, 7, 38, 44, -2, 3, 'upper'],
      [5, out + 5, 38, 44, -2, 3, 'fore'],
      [out, out + 5, 43, 49, -2, 3, 'fore'],
      [out + 1, out + 6, 48, 54, -2, 3, 'fore'],
      [out + 2, out + 7, 53, 58, -2, 3, 'fore'],
      [out + 2, out + 8, 57, 63, -2, 3, 'hand'],
    ],
    // straight out to the side, the hand turned up as in a dance mudra
    out: [
      [0, 7, 38, 44, -2, 3, 'upper'],
      [5, out + 7, 38, 43, -2, 3, 'fore'],
      [out + 5, out + 9, 39, 48, -2, 3, 'hand'],
    ],
    // the waving arm: the upper arm out to the side; the forearm lives in its own mesh so it can rock
    raised: [
      [0, 7, 38, 44, -2, 3, 'upper'],
      [5, out + 5, 38, 44, -2, 3, 'fore'],
    ],
    forearmUp: [
      [out, out + 5, 42, 56, -2, 3, 'fore'],
      [out, out + 6, 55, 61, -2, 3, 'hand'],
    ],
  }
}
const reach = (B) => HW + 2 - B.tw / 2

function arm(g, L, B, side, pose) {
  const half = B.tw / 2
  const X = (a, b) => (side > 0 ? [half + a, half + b] : [-half - b, -half - a])
  const color = (role) => (x, y, z) => {
    if (role === 'hand') return L.skin
    if (L.sleeves === 'short' || L.sleeves === 'puff') return role === 'upper' && y >= 38 ? L.topFn(x, y, z) : L.skin
    return L.topFn(x, y, z)
  }
  const seg = (s) => {
    const [a, b] = X(s[0], s[1])
    g.rounded(a, b, s[2], s[3], s[4], s[5], s[6] === 'hand' ? 2 : 1.5, color(s[6]))
  }
  if (pose === 'namaste') {
    const z1 = B.td / 2
    seg([0, 5, 35, 44, -2, 3, 'upper'])
    seg([0, 5, 31, 37, -2, z1 + 4, 'fore'])
    seg([-half + 2, 5, 31, 36, z1, z1 + 5, 'fore'])
    seg([-half, -half + 3, 33, 45, z1 + 1, z1 + 5, 'hand'])
  } else for (const s of armPoses(reach(B))[pose]) seg(s)
  // puffed sleeves on the dress
  if (L.sleeves === 'puff' && pose !== 'forearmUp') {
    const [a, b] = X(-1, 6)
    g.rounded(a, b, 37, 45, -3, 4, 3, L.topFn)
  }
}

// How an accessory is carried depends on the pose, so the two always make sense together.
const FREE_HAND = ['standing', 'waving', 'hips']
export function carryMode(acc, pose) {
  if (!acc || acc.id === 'none') return null
  const armsUp = pose === 'cheering' || pose === 'dancing'
  const seated = pose === 'holding' || pose === 'sitting' || pose === 'cross-legged'
  if (acc.hold === 'hand') {
    if (pose === 'namaste') return 'ground' // set down as an offering; the palms are together
    return armsUp ? 'up' : 'hand'
  }
  if (acc.hold === 'side') return FREE_HAND.includes(pose) ? 'tuck' : 'ground'
  if (acc.id === 'veena') return seated ? 'chest' : 'ground'
  if (acc.hold === 'both') {
    if (seated) return 'chest'
    if (acc.id === 'guitar') return pose === 'namaste' || armsUp ? 'slung-back' : 'slung'
    if (acc.id === 'camera') return 'strap'
    if (acc.id === 'controller' || (armsUp && acc.id === 'book')) return pose === 'namaste' ? 'clasp' : armsUp ? 'up' : 'hand'
    if (armsUp || pose === 'namaste') return 'ground'
    return 'tuck'
  }
  return acc.hold
}

const HATS = ['cap', 'beanie', 'fedora']

// Returns { body, parts }: `body` is the doll and its pedestal; each part is a piece that moves
// on its own ({ grid, anim, pivot, side }): the waving forearm, a nodding head, cheering arms, the
// upper body swaying on its hips, the whole dancing doll, or a cloud floating overhead.
export function buildBommai(cfg) {
  const L = resolveLook(cfg)
  const B = BUILDS[cfg.body] || BUILDS.regular
  const half = B.tw / 2
  const z1 = B.td / 2
  const pose = cfg.pose
  const acc = LOOKUP.accessory[cfg.accessory]
  const mode = carryMode(acc, pose)
  const handSide = pose === 'waving' ? 1 : -1 // the doll's right hand unless it is waving with it

  const floor = new VoxelGrid()
  const parts = []
  const part = (anim, pivot, extra = {}) => {
    const grid = new VoxelGrid()
    parts.push({ grid, anim, pivot, ...extra })
    return grid
  }
  // which grid each piece of the doll is drawn into
  let lower = floor
  let upper = floor
  let head = floor
  if (pose === 'dancing') lower = upper = head = part('dance', [0, PED, 0])
  if (pose === 'hips') upper = head = part('hips', [0, HIP, 0])
  if (pose === 'namaste') head = part('nod', [0, HEAD0, 0])
  if (pose === 'cross-legged') upper = head = floor.shifted(-(HIP - (PED + 9))) // sitting on the floor lowers everything above the hips
  const arms = { 1: upper, '-1': upper }
  if (pose === 'cheering') for (const s of [1, -1]) arms[s] = part('cheer', [s > 0 ? half + 2.5 : -half - 2.5, 41, 0.5], { side: s })

  pedestal(floor)
  legs(lower, L, B, pose)
  lowerBody(lower, L, B, pose)
  torso(upper, L, B, pose)

  // head: a big box with softly rounded edges
  head.rounded(-HW, HW, HEAD0, HEAD1, -HD, HD, 4, L.skin)
  faceOn(head, cfg, L)
  hairOn(head, cfg, L, { hatted: HATS.includes(cfg.accessory) })

  const anchors = {
    hand: [handSide > 0 ? half + 7 : -half - 8, 35, 9],
    up: [handSide > 0 ? half + reach(B) + 5 : -half - reach(B) - 6, 63, 0],
    clasp: [0, 45, z1 + 3],
    chest: [0, 34, 16],
    strap: [0, 30, z1],
    slung: [0, 28, z1],
    tuck: [handSide > 0 ? half + 4 : -half - 4, 24, 0],
    ground: [34, 0, 2],
  }
  if (mode) {
    const target = mode === 'ground' ? floor : mode === 'head' ? (acc.id === 'cloud' ? part('float', [0, 0, 0]) : head) : ['up', 'hand', 'tuck'].includes(mode) ? arms[handSide] : upper
    itemAt(target, acc.id, mode, anchors, { L, B, side: handSide })
  }

  const armPose = (side) => {
    if (pose === 'namaste') return 'namaste'
    if (mode === 'hand' && side === handSide) return 'offer'
    if (pose === 'holding') return 'forward'
    if (pose === 'sitting' || pose === 'cross-legged') return mode === 'chest' ? 'forward' : 'lap'
    if (pose === 'cheering') return 'up'
    if (pose === 'dancing') return side === handSide ? 'up' : 'out'
    if (pose === 'waving' && side < 0) return 'raised'
    if (pose === 'hips') return mode === 'tuck' && side === handSide ? 'down' : 'hips'
    return 'down'
  }
  arm(arms[1], L, B, 1, armPose(1))
  arm(arms[-1], L, B, -1, armPose(-1))
  if (mode === 'chest' && acc.id === 'guitar') itemAt(upper, 'guitar-strap', mode, anchors, { L, B })

  if (pose === 'waving') arm(part('wave', [-half - reach(B) - 2.5, 41, 0.5]), L, B, -1, 'forearmUp')
  return { body: floor, parts }
}
