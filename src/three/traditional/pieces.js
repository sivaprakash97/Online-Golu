import { VoxelGrid, shiny, glow } from '../voxel/grid.js'
import { shade, mod } from '../bommai/dims.js'

// The traditional pieces on the top two steps, drawn voxel by voxel at the same scale as the
// Bommais (one voxel is VOXEL world units before the pieces' own 1.2× scale). Each builder
// returns a VoxelGrid, with the piece standing on y = 0 and facing +z.

const GOLD = shiny('#e8b33c')
const BRASS = shiny('#d9a53a')
const BRASS_DARK = shiny('#b5822a')
const MARIGOLDS = ['#f6b928', '#f08a24', '#e8601c']
const INK = '#1f1a1c'

// a disc or short drum: centre (x, z), from y0 up h voxels, radius r
const drum = (g, x, z, y0, h, r, c) => g.ellipsoid(x - 0.5, y0 + h / 2, z - 0.5, r, h / 2, r, c)
// a tapering column, radius r0 at the bottom to r1 at the top
function taper(g, x, z, y0, y1, r0, r1, c) {
  for (let y = y0; y < y1; y++) {
    const r = r0 + ((y - y0) / (y1 - y0)) * (r1 - r0)
    g.ellipsoid(x - 0.5, y + 0.5, z - 0.5, r, 0.6, r, c)
  }
}

// ── kalasam ─────────────────────────────────────────────────────────────────
// A brass pot of water on a plate of rice, crowned with mango leaves and a coconut marked with
// turmeric and kumkum. Drawn into `g` at (x, y, z), `k` times its normal size.
export function kalasamInto(g, x, y, z, k = 1) {
  const R = (v) => v * k
  drum(g, x, z, y, R(3.5), R(23), BRASS_DARK)
  drum(g, x, z, y + R(3), R(2.5), R(20), '#f2ead8') // rice
  g.ellipsoid(x - 0.5, y + R(18), z - 0.5, R(15.5), R(14), R(15.5), (xx, yy) => (Math.abs(yy - (y + R(18))) < Math.max(1, R(1)) ? '#c8323a' : BRASS))
  taper(g, x, z, y + R(30), y + R(37), R(7), R(9.5), BRASS)
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2
    for (let t = 0; t < R(11); t += 0.5) {
      const w = Math.max(0.6, R(2.6) * Math.sin((Math.PI * t) / R(11)))
      const px = x + Math.cos(a) * (R(6) + t * 0.75)
      const pz = z + Math.sin(a) * (R(6) + t * 0.75)
      const py = y + R(36) + t * 0.55
      g.ellipsoid(px, py, pz, w, 0.7, w, i % 2 ? '#2f7d3d' : '#3f9b4b')
    }
  }
  g.ellipsoid(x - 0.5, y + R(46), z - 0.5, R(9.5), R(10.5), R(9.5), (xx, yy, zz) => (mod(xx + yy, 4) === 0 ? '#7a4e2c' : '#8a5a35'))
  g.ellipsoid(x - 0.5, y + R(49), z + R(8.6), R(3.2), R(3.2), 1, '#eab12f')
  g.ellipsoid(x - 0.5, y + R(49), z + R(9.4), R(1.3), R(1.3), 0.8, '#c8102e')
  taper(g, x, z, y + R(55), y + R(61), R(3.5), 0.8, '#a07444')
}

export function buildKalasam(k = 1.35) {
  const g = new VoxelGrid(80, 100, 80)
  kalasamInto(g, 0, 0, 0, k)
  return g
}

// ── mandapam ────────────────────────────────────────────────────────────────
// A little shrine: a stepped plinth, four gold pillars, a maroon roof slab under a red stepped
// pyramid tower with gold courses and a finial, a kalasam and a lit lamp inside, and a marigold
// string across the front.
export function buildMandapam() {
  const g = new VoxelGrid(80, 116, 80)
  g.rounded(-31, 31, 0, 7, -31, 31, 1.5, (x, y) => (y === 6 ? '#bd6a3c' : y === 3 ? GOLD : '#a8582f'))
  g.rounded(-27, 27, 7, 12, -27, 27, 1, '#c36c3a')
  for (const px of [-22, 22])
    for (const pz of [-22, 22]) {
      g.rounded(px - 4, px + 4, 12, 15, pz - 4, pz + 4, 1, GOLD)
      g.rounded(px - 2, px + 2, 15, 52, pz - 2, pz + 2, 1, (x, y) => (mod(y, 8) === 0 ? shiny('#c99325') : GOLD), true)
      g.rounded(px - 3, px + 3, 51, 56, pz - 3, pz + 3, 1, GOLD)
    }
  g.rounded(-31, 31, 56, 62, -31, 31, 1.5, (x, y) => (y === 56 ? GOLD : '#7a1f2b'))
  for (let k = 0; k < 28; k++) {
    const w = 30 - k
    g.box(-w, w, 62 + k, 63 + k, -w, w, k % 5 === 4 ? GOLD : mod(k, 2) ? '#c8323a' : '#b52a33')
  }
  g.ellipsoid(-0.5, 93, -0.5, 4, 4, 4, GOLD)
  taper(g, 0, 0, 96, 104, 3, 0.6, GOLD)
  kalasamInto(g, 0, 12, -4, 0.45)
  // a little lit lamp in front of the kalasam
  drum(g, 0, 14, 12, 2, 3.5, BRASS)
  g.box(-1, 1, 14, 17, 13, 15, glow('#ff9a1f'))
  g.set(-1, 17, 13, glow('#fff0b0'))
  // marigold string
  for (let i = 0; i <= 18; i++) {
    const x = -27 + i * 3
    const y = 53 - Math.sin((i / 18) * Math.PI) * 7
    g.ellipsoid(x, y, 32, 1.7, 1.7, 1.7, MARIGOLDS[i % 3])
  }
  return g
}

// ── marapachi ───────────────────────────────────────────────────────────────
// The carved wooden couple that traditionally starts every Golu.
function marapachiInto(g, x, female) {
  const wood = '#9b3d22'
  drum(g, x, 0, 0, 5, 12, '#6e2a17')
  taper(g, x, 0, 5, 44, female ? 12.7 : 9, female ? 8.2 : 7.3, female ? '#2f7d3d' : '#f3ead7')
  for (let y = female ? 17 : 10; y < (female ? 20 : 13); y++) g.ellipsoid(x - 0.5, y + 0.5, -0.5, female ? 11.4 : 8.8, 0.6, female ? 11.4 : 8.8, GOLD)
  taper(g, x, 0, 41, 54, 7.7, 6.8, female ? '#c8323a' : '#7a1f2b')
  g.ellipsoid(x - 0.5, 60.5, -0.5, 7.7, 7.7, 7.7, wood)
  for (const dx of [-3, 2]) g.box(x + dx, x + dx + 1, 60, 62, 6, 8, INK)
  g.box(x - 1, x + 1, 56, 57, 6, 8, '#6e2a17')
  if (female) {
    g.ellipsoid(x - 0.5, 64, -3, 6.5, 5.5, 6, INK)
    g.ellipsoid(x - 0.5, 61, -9, 4, 4, 3.5, INK)
    g.set(x - 1, 64, 7, '#c8102e')
  } else {
    taper(g, x, 0, 64, 71, 7.2, 8.4, GOLD)
    g.ellipsoid(x - 0.5, 69, 6.5, 1.8, 1.8, 1, '#c8323a')
  }
}

export function buildMarapachi() {
  const g = new VoxelGrid(80, 84, 40)
  marapachiInto(g, -15, false)
  marapachiInto(g, 15, true)
  return g
}

// ── elephant ────────────────────────────────────────────────────────────────
// A caparisoned temple elephant with a gold forehead plate and a little howdah.
export function buildElephant() {
  const g = new VoxelGrid(80, 80, 90)
  const grey = '#8f8c96'
  const light = '#a29fa9'
  for (const x of [-10, 10]) for (const z of [-15, 15]) g.rounded(x - 5, x + 5, 0, 22, z - 5, z + 5, 2, (xx, y) => (y < 2 ? '#d8d3c8' : grey), true)
  g.rounded(-16, 16, 18, 46, -24, 24, 9, grey)
  g.rounded(-13, 13, 30, 54, 17, 37, 8, grey) // head
  // ears
  for (const s of [-1, 1]) g.rounded(s > 0 ? 13 : -17, s > 0 ? 17 : -13, 32, 52, 18, 32, 3, (x, y) => (mod(x + y, 5) === 0 ? grey : light))
  // trunk, curling forward at the tip
  for (let y = 12; y < 36; y++) g.ellipsoid(-0.5, y + 0.5, 37 + (y < 18 ? (18 - y) * 0.5 : 0), 4 - (36 - y) * 0.06, 0.6, 4 - (36 - y) * 0.06, grey)
  for (const s of [-1, 1]) g.rounded(s > 0 ? 5 : -7, s > 0 ? 7 : -5, 26, 30, 36, 44, 1, '#f4efe4') // tusks
  for (const s of [-1, 1]) g.box(s > 0 ? 6 : -8, s > 0 ? 8 : -6, 44, 46, 36, 37, INK)
  g.box(-6, 6, 44, 52, 37, 38, GOLD) // forehead plate
  g.box(-2, 2, 46, 50, 38, 39, '#c8323a')
  // caparison over the back, with a gold hem and tassels
  g.rounded(-17, 17, 32, 48, -20, 14, 3, (x, y) => (y === 32 ? GOLD : mod(x + y, 6) === 0 ? shiny('#e8b33c') : '#c8323a'))
  for (let x = -16; x < 16; x += 4) g.set(x, 31, 15, GOLD)
  // howdah
  g.rounded(-11, 11, 46, 50, -12, 8, 1.5, GOLD)
  for (let k = 0; k < 10; k++) g.rounded(-9 + k, 9 - k, 50 + k, 51 + k, -10 + k, 6 - k, 0.8, k % 3 === 2 ? GOLD : '#7a1f2b')
  return g
}

// ── chettiar shop ───────────────────────────────────────────────────────────
// The little grocer's stall: a counter, sacks of grain, brass scales and a striped awning.
export function buildShop() {
  const g = new VoxelGrid(90, 90, 50)
  g.rounded(-36, 36, 0, 24, -18, 18, 1.5, (x, y, z) => (z >= 17 && mod(x, 9) === 0 ? '#9a5d32' : '#b9733f'))
  g.rounded(-37, 37, 24, 27, -19, 19, 1, '#8a5130')
  ;[
    [-25, '#f3ead7'],
    [-8, '#eab12f'],
    [8, '#c8323a'],
    [25, '#3f9b4b'],
  ].forEach(([x, c]) => {
    drum(g, x, 5, 27, 11, 7, '#d8c7a0')
    drum(g, x, 5, 37, 2, 6.3, c)
  })
  for (const x of [-35, 34]) g.box(x, x + 2, 27, 82, -16, -14, '#8a5130')
  // striped awning, sloping down to the front
  for (let z = -19; z <= 19; z++) {
    const y = Math.round(81 - (z + 19) * 0.32)
    g.box(-39, 39, y, y + 2, z, z + 1, (x) => (mod(Math.floor((x + 40) / 9), 2) ? '#f3ead7' : '#c8323a'))
  }
  // brass weighing scale
  g.box(0, 1, 27, 50, -12, -11, BRASS)
  g.box(-11, 12, 49, 50, -12, -11, BRASS)
  for (const x of [-10, 11]) drum(g, x, -11, 41, 2, 4, BRASS)
  return g
}

// ── brass vessels ───────────────────────────────────────────────────────────
export function buildVessels() {
  const g = new VoxelGrid(60, 40, 50)
  g.ellipsoid(-15, 11, -0.5, 12, 10, 12, BRASS)
  taper(g, -14.5, 0, 20, 27, 6.5, 8, BRASS)
  for (let y = 0; y < 13; y++) g.ellipsoid(11, y + 0.5, 4.5, 8 + y * 0.25, 0.6, 8 + y * 0.25, shiny('#c98b5a'))
  for (let y = 0; y < 11; y++) g.ellipsoid(7, y + 0.5, -13.5, 4.5 + y * 0.08, 0.6, 4.5 + y * 0.08, shiny('#cfd3d6'))
  drum(g, 18, -9, 0, 3, 14, BRASS_DARK)
  return g
}

// ── peacock ─────────────────────────────────────────────────────────────────
// A peacock with its tail fanned out behind it in a half circle of green feathers and eye spots.
export function buildPeacock() {
  const g = new VoxelGrid(100, 70, 40)
  const blue = '#1f6fa8'
  drum(g, 0, 0, 0, 5, 12, '#6e2a17')
  // the fan, in a plane behind the body
  for (let y = 8; y < 64; y++)
    for (let x = -46; x < 46; x++) {
      const r = Math.hypot(x + 0.5, y - 14 + 0.5)
      if (r < 8 || r > 46 || y < 10) continue
      const a = Math.atan2(y - 14, x + 0.5)
      const eyeA = Math.round(a / 0.17) * 0.17
      const ex = Math.cos(eyeA) * 39
      const ey = 14 + Math.sin(eyeA) * 39
      const d = Math.hypot(x + 0.5 - ex, y + 0.5 - ey)
      let c = mod(Math.floor(a / 0.085), 2) ? '#1c8a6e' : '#227a5e'
      if (d < 3.6) c = d < 1.3 ? shiny('#e8b33c') : d < 2.4 ? '#1f3f8f' : '#3fa0c8'
      g.set(x, y, -9, c)
      g.set(x, y, -10, c)
    }
  g.ellipsoid(-0.5, 18, -0.5, 8, 10, 11, blue)
  for (let y = 24; y < 40; y++) g.ellipsoid(-0.5, y + 0.5, 4 + (y - 24) * 0.3, 3.4 - (y - 24) * 0.05, 0.6, 3.4, blue)
  g.ellipsoid(-0.5, 41, 9.5, 4.2, 4.2, 4.2, blue)
  g.box(-1, 1, 40, 41, 13, 16, GOLD) // beak
  for (const x of [-3, 2]) g.set(x, 42, 12, INK)
  for (const x of [-2, 0, 2]) (g.set(x, 46, 9, blue), g.set(x, 47, 9, shiny('#3fa0c8')))
  return g
}
