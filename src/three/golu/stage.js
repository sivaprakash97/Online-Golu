import { VoxelGrid, shiny, glow } from '../voxel/grid.js'
import { shade, mod, hash3 } from '../bommai/dims.js'
import { GOLU } from './layout.js'

// The Golu stage drawn in voxels, in the same blocky, softly shaded style as the Bommais. The big
// pieces (steps, floor, wall) use bigger voxels than the dolls: S here is one voxel in world units.
// Each builder returns a VoxelGrid; Golu.jsx places and scales the meshes.

export const S = 0.05

const GOLD = shiny('#e3a83a')
const WOOD = '#7b4127'
const DARK_WOOD = '#5e2f1b'
const CLOTH = '#f5ead3'
const JASMINE = '#fbf6ea'
const MARIGOLDS = ['#f6b928', '#f08a24', '#e8601c']
const LEAF = ['#2f7d3d', '#4f9a44']

// a touch of grain so big flat areas don't look like plastic
const grain = (c, x, y, z, amt = 0.025) => (hash3(x, y, z) % 7 === 0 ? shade(c, -amt) : c)

// ── steps ───────────────────────────────────────────────────────────────────
const STEP_H = 12 // voxels per rise
const TREAD = Math.round(GOLU.D / S)

export function stepDims(k) {
  const nx = 2 * Math.round(GOLU.width(k) / S / 2)
  const nz = 2 * Math.round((GOLU.front(k) - GOLU.backZ) / S / 2)
  return { nx, nz, ny: STEP_H }
}

// One step: a wooden slab, a silk riser cloth with woven motifs and zari borders, a cream tread
// cloth whose scalloped edge hangs over the riser, and dark end posts with gold finials.
// x runs across, z from the back (-nz/2) to the front (nz/2 - 1).
export function buildStep(k) {
  const { nx, nz } = stepDims(k)
  const hx = nx / 2
  const hz = nz / 2
  const g = new VoxelGrid(nx + 8, STEP_H + 4, nz + 8)
  const locked = k >= 8
  const riser = locked ? '#13505a' : ['#8e1f2e', '#a3283a'][k % 2]
  const motif = shiny(locked ? '#e8c46a' : '#f0c35a')

  g.box(-hx, hx, 0, STEP_H, -hz, hz, WOOD)
  // tread cloth, with a thin red border line near the front edge
  g.box(-hx + 3, hx - 3, STEP_H - 1, STEP_H, hz - TREAD, hz + 1, (x, y, z) => (z === hz - 3 ? '#c8323a' : CLOTH))
  // riser cloth, one voxel proud of the wood
  g.box(-hx + 3, hx - 3, 1, STEP_H - 2, hz, hz + 1, (x, y) => (y <= 1 || y === 7 || y === 8 ? GOLD : riser))
  // the tread cloth's scalloped edge over the top of the riser
  g.box(-hx + 3, hx - 3, STEP_H - 2, STEP_H - 1, hz, hz + 1, CLOTH)
  for (let x = -hx + 3; x < hx - 3; x++) if (mod(x, 4) === 1 || mod(x, 4) === 2) g.set(x, STEP_H - 3, hz, CLOTH)
  // woven diamond motifs along the riser
  for (let cx = -hx + 8; cx < hx - 8; cx += 8)
    for (const [dx, dy] of [
      [0, 5],
      [-1, 4],
      [0, 4],
      [1, 4],
      [0, 3],
    ])
      g.set(cx + dx, dy, hz, motif)
  // end posts with gold finials
  for (const x0 of [-hx, hx - 3]) {
    g.box(x0, x0 + 3, 0, STEP_H + 1, hz - TREAD, hz + 1, DARK_WOOD)
    g.box(x0, x0 + 3, STEP_H + 1, STEP_H + 3, hz - 2, hz + 1, GOLD)
  }
  return g
}

// ── floor ───────────────────────────────────────────────────────────────────
export const FLOOR = { nx: 388, ny: 10, nz: 270 }

// A kolam of coloured rice flour: petals in turmeric, kumkum and leaf green with white outlines,
// and a ring of pulli dots. (dx, dz) is the voxel from its centre; returns a colour or null.
function kolam(dx, dz) {
  const r = Math.hypot(dx + 0.5, dz + 0.5)
  if (r > 31) return null
  const a = Math.atan2(dz + 0.5, dx + 0.5) + Math.PI
  const petal = (n, r1, r2) => {
    const t = (r - r1) / (r2 - r1)
    if (t < 0 || t > 1) return null
    const sector = (Math.PI * 2) / n
    const i = Math.floor(a / sector)
    const phi = Math.abs(a - (i + 0.5) * sector) * r // distance across the petal, in voxels
    const half = (sector / 2) * 0.95 * r * Math.pow(Math.sin(Math.PI * t), 0.7)
    if (phi > half) return null
    return { i, edge: phi > half - 1.1 || t < 0.06 || t > 0.94 }
  }
  // pulli dots round the outside
  if (Math.abs(r - 29.5) < 1.3) {
    const sector = (Math.PI * 2) / 32
    const off = Math.abs(a - (Math.floor(a / sector) + 0.5) * sector) * r
    return off < 1.2 ? JASMINE : null
  }
  if (r < 7) {
    const p = petal(8, 0.5, 6.5)
    return p ? (p.edge ? '#f08a24' : JASMINE) : '#f08a24'
  }
  const inner = petal(8, 6, 17)
  if (inner) return inner.edge ? JASMINE : '#3f9b4b'
  const outer = petal(16, 12, 27)
  if (outer) return outer.edge ? JASMINE : outer.i % 2 ? '#eab12f' : '#c8323a'
  return null
}

// The red-oxide floor of the room: big square tiles with fine grout lines, a dark border, a
// plinth, and the kolam painted in front of the Golu. `kolamZ` is the kolam's centre in voxels.
export function buildFloor(kolamZ) {
  const { nx, ny, nz } = FLOOR
  const hx = nx / 2
  const hz = nz / 2
  const g = new VoxelGrid(nx + 4, ny + 2, nz + 4)
  g.box(-hx, hx, 0, ny, -hz, hz, (x, y, z) => {
    if (y < 2) return '#4e2416'
    if (y < ny - 1) return y === ny - 3 ? '#e3a83a' : '#8f3b28'
    const ex = Math.min(x + hx, hx - 1 - x)
    const ez = Math.min(z + hz, hz - 1 - z)
    const e = Math.min(ex, ez)
    if (e < 6) return e === 3 ? '#e3a83a' : '#6e2a1c'
    const k = kolam(x, z - kolamZ)
    if (k) return k
    const tx = Math.floor((x + 1000) / 20)
    const tz = Math.floor((z + 1000) / 20)
    if (mod(x, 20) === 0 || mod(z, 20) === 0) return '#86361f'
    return (tx + tz) % 2 ? '#a4472f' : '#9b422b'
  })
  return g
}

// ── back wall ───────────────────────────────────────────────────────────────
export const WALL_S = 0.05
export const WALL = { nx: 388, ny: 168, nz: 8 }

// A plastered wall with a carved wooden dado, a gold band, and a painted arch behind the Golu
// whose border stands out from the wall.
export function buildWall() {
  const { nx, ny, nz } = WALL
  const hx = nx / 2
  const hz = nz / 2
  const g = new VoxelGrid(nx + 4, ny + 2, nz + 6)
  const cy = 86
  const arch = (x, y) => (y >= cy ? Math.hypot(x + 0.5, y - cy + 0.5) : Infinity)
  g.box(-hx, hx, 0, ny, -hz, hz, (x, y, z) => {
    if (z < hz - 1) return '#e2bf8f'
    if (y < 22) return mod(x, 24) === 0 || mod(x, 24) === 1 || y <= 1 ? '#a65f2c' : '#c97a3e'
    if (y < 24) return GOLD
    const r = arch(x, y)
    if (r < 93) {
      // a ring of little lotus-bud dots just inside the border
      if (Math.abs(r - 87) < 1.2 && mod(Math.round(Math.atan2(y - cy, x) * 60), 3) === 0) return '#c8323a'
      return '#e9b77a'
    }
    return '#f0d2a4'
  })
  // the arch's border, proud of the wall
  for (let y = cy; y < ny; y++)
    for (let x = -hx; x < hx; x++) {
      const r = arch(x, y)
      if (r >= 93 && r < 98) g.box(x, x + 1, y, y + 1, hz, hz + (r < 95.5 ? 2 : 1), r >= 96.5 ? GOLD : '#b8452f')
    }
  return g
}

// ── pillars, beam, toran, garlands ──────────────────────────────────────────
export const PILLAR_H = 157

export function buildPillar() {
  const g = new VoxelGrid(24, PILLAR_H + 4, 24)
  g.rounded(-7, 7, 0, 6, -7, 7, 1.5, DARK_WOOD)
  g.rounded(-5, 5, 6, PILLAR_H - 6, -5, 5, 3, (x, y, z) => (mod(x + z, 3) === 0 ? shade(WOOD, -0.06) : WOOD), true)
  for (const y of [28, 64, 112]) g.rounded(-6, 6, y, y + 3, -6, 6, 2, GOLD, true)
  g.rounded(-8, 8, PILLAR_H - 6, PILLAR_H, -8, 8, 1.5, (x, y) => (y === PILLAR_H - 4 ? GOLD : DARK_WOOD))
  return g
}

export const BEAM = { nx: 328, ny: 6, nz: 10 }

export function buildBeam() {
  const { nx, ny, nz } = BEAM
  const g = new VoxelGrid(nx + 4, ny + 2, nz + 4)
  g.box(-nx / 2, nx / 2, 0, ny, -nz / 2, nz / 2, (x, y, z) => (z === nz / 2 - 1 && y >= 2 && y <= 3 && mod(x, 8) < 2 ? GOLD : grain(DARK_WOOD, x, y, z)))
  return g
}

// A string of mango leaves with marigolds between them, hanging under the beam. The rope is at
// the top (y = 12).
export function buildToran(width) {
  const nx = Math.round(width / S)
  const g = new VoxelGrid(nx + 8, 16, 6)
  const hx = nx / 2
  g.box(-hx, hx, 12, 13, 0, 1, '#8a5130')
  const widths = [4, 4, 4, 4, 4, 3, 3, 3, 2, 2, 1]
  const n = Math.floor(nx / 7.6)
  for (let i = 0; i < n; i++) {
    const cx = Math.round(-hx + 4 + i * 7.6)
    const c = LEAF[i % 2]
    widths.forEach((w, r) => {
      const y = 11 - r
      for (let x = cx - Math.floor(w / 2); x < cx - Math.floor(w / 2) + w; x++) g.set(x, y, 0, x === cx && r < 9 ? shade(c, 0.12) : c)
    })
    if (i < n - 1) g.box(cx + 3, cx + 5, 10, 12, 0, 2, MARIGOLDS[i % 3])
  }
  return g
}

// Marigold swags across the front of the beam and strands down the pillars. Positions are in
// world units relative to `origin`; every flower is a little ball of voxels.
export function buildGarlands(origin, swags, strands) {
  const g = new VoxelGrid(340, 44, 8)
  const flower = (x, y, i) => {
    const vx = (x - origin[0]) / S
    const vy = (y - origin[1]) / S
    g.ellipsoid(vx, vy, 0.5, 1.8, 1.8, 1.8, (xx, yy, zz) => (mod(xx + yy + zz, 4) === 0 ? shade(MARIGOLDS[i % 3], -0.12) : MARIGOLDS[i % 3]))
  }
  for (const { from, to, sag } of swags) {
    const n = Math.round(Math.abs(to[0] - from[0]) / (3.2 * S))
    for (let i = 0; i <= n; i++) {
      const t = i / n
      flower(from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t - Math.sin(t * Math.PI) * sag, i)
    }
  }
  for (const { x, top, length } of strands) {
    const n = Math.round(length / (3.2 * S))
    for (let i = 0; i <= n; i++) flower(x, top - i * 3.2 * S, i + 1)
  }
  return g
}

// ── banana plant ────────────────────────────────────────────────────────────
// A striped trunk with long, drooping leaves that step down in voxels, each with a pale midrib
// and the odd tear, like real banana leaves.
export function buildBanana() {
  const g = new VoxelGrid(110, 96, 110)
  const top = 52
  for (let y = 0; y < top + 2; y++) {
    const r = 3.4 - (y / top) * 1.1
    g.ellipsoid(-0.5, y + 0.5, -0.5, r, 0.6, r, (x, yy) => (mod(yy, 5) === 0 ? '#6a9040' : '#7aa04a'))
  }
  const leaves = 7
  for (let i = 0; i < leaves; i++) {
    const a = (i / leaves) * Math.PI * 2 + 0.3
    const dir = [Math.cos(a), Math.sin(a)]
    const perp = [-dir[1], dir[0]]
    const L = 40 + (i % 3) * 5
    let px = 0
    let py = top - 2 + (i % 3) * 2
    let pz = 0
    for (let t = 0; t < L; t += 0.5) {
      const theta = 1.3 - (t / L) * 1.75 // steeply up to start with, then arching over
      px += Math.cos(theta) * dir[0] * 0.5
      pz += Math.cos(theta) * dir[1] * 0.5
      py += Math.sin(theta) * 0.5
      const w = 8 * Math.pow(Math.sin(Math.PI * Math.min(1, (t / L) * 1.04)), 0.5) // broad paddles
      for (let s = -w; s <= w; s += 0.5) {
        const torn = Math.abs(s) > 2 && mod(Math.floor(t), 7) === 0 && s * (i % 2 ? 1 : -1) > 0
        if (torn) continue
        const c = Math.abs(s) < 0.6 ? '#a8cf74' : s < 0 ? '#3f8f3c' : '#5aa848'
        g.set(Math.round(px + perp[0] * s), Math.round(py), Math.round(pz + perp[1] * s), c)
      }
    }
  }
  return g
}

// ── lamps ───────────────────────────────────────────────────────────────────
// A brass kuthuvilakku: a stepped base, a ringed stem, an oil bowl with five flames, and a finial.
// `stem` is the height of the stem in voxels. The flames are lit (they glow).
export function buildLamp(stem) {
  const g = new VoxelGrid(40, stem + 40, 40)
  const brass = shiny('#d9a53a')
  const dark = shiny('#b5822a')
  g.ellipsoid(-0.5, 2.5, -0.5, 12, 2.6, 12, (x, y) => (y >= 3 ? brass : dark))
  g.ellipsoid(-0.5, 6, -0.5, 7, 2, 7, brass)
  g.rounded(-2, 2, 7, 7 + stem, -2, 2, 1, brass, true)
  for (const f of [0.33, 0.66]) g.ellipsoid(-0.5, 7 + stem * f, -0.5, 4, 1.2, 4, dark)
  const b = 7 + stem
  g.ellipsoid(-0.5, b + 2, -0.5, 12, 3.4, 12, (x, y) => (y < b + 1 ? dark : brass))
  g.ellipsoid(-0.5, b + 4, -0.5, 9, 1, 9, '#8a5a1e') // oil
  for (let i = 0; i < 5; i++) {
    const t = (i / 5) * Math.PI * 2 + Math.PI / 2
    const x = Math.round(Math.cos(t) * 9.5 - 0.5)
    const z = Math.round(Math.sin(t) * 9.5 - 0.5)
    g.box(x - 1, x + 2, b + 4, b + 7, z - 1, z + 2, glow('#ff8a1a'))
    g.box(x - 1, x + 2, b + 7, b + 10, z - 1, z + 2, glow('#ffc84a'))
    g.box(x, x + 1, b + 10, b + 12, z, z + 1, glow('#fff3c4'))
  }
  for (let k = 0; k < 8; k++) g.ellipsoid(-0.5, b + 6 + k, -0.5, 3.5 - k * 0.35, 0.6, 3.5 - k * 0.35, brass)
  g.ellipsoid(-0.5, b + 15, -0.5, 2, 2, 2, brass)
  return g
}
