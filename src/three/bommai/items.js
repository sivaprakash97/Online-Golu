import { VoxelGrid } from '../voxel/mesher.js'
import { shade, hash3, GOLD, WHITE } from './look.js'

// Things a Bommai carries, as little voxel models. Each returns { grid, origin } where origin is
// the grip (for hand-held items), the centre (held in front / on the back) or the bottom centre
// (things standing on the floor).

const STEEL = '#c9ccd1'
const WOOD = '#c08a52'
const DARK = '#2b2c33'

function filterCoffee() {
  const g = new VoxelGrid()
  g.box(-3, 0, -3, 3, 2, 3, (x, y, z) => ((x === -3 || x === 2) && (z === -3 || z === 2) ? null : y === 1 ? shade(STEEL, 0.06) : STEEL)) // davara
  g.box(-2, 2, -2, 2, 9, 2, (x, y) => (y === 8 ? '#6b3e26' : y % 3 === 0 ? shade(STEEL, -0.08) : STEEL)) // tumbler
  g.box(-1, 8, -1, 1, 9, 1, '#e9d2a8') // froth
  return { grid: g, origin: [0, 4, 0] }
}

function laptop() {
  const g = new VoxelGrid()
  g.box(-6, 0, -1, 6, 9, 1, (x, y, z) => (z === 0 && Math.abs(x + 0.5) < 1.5 && y > 3 && y < 6 ? WHITE : '#9aa3ad'))
  g.box(-6, 0, -1, 6, 1, 1, '#7b838c')
  return { grid: g, origin: [0, 4.5, 0] }
}

function guitar() {
  // body centred at the origin, neck to +x
  const g = new VoxelGrid()
  const body = '#4a90c8'
  const lip = shade(body, -0.15)
  const shape = (x, y) => {
    const lower = (x + 3) ** 2 / 30 + (y / 6.2) ** 2 < 1
    const upper = (x - 4) ** 2 / 16 + (y / 4.8) ** 2 < 1
    return lower || upper
  }
  for (let x = -9; x < 9; x++)
    for (let y = -7; y < 7; y++) {
      if (!shape(x + 0.5, y + 0.5)) continue
      for (let z = -1; z < 2; z++) g.set(x, y, z, z === 1 ? (Math.hypot(x + 0.5 - 1, y + 0.5) < 2 ? '#2a2a33' : body) : lip)
      if (!shape(x + 1.5, y + 0.5) || !shape(x - 0.5, y + 0.5) || !shape(x + 0.5, y + 1.5) || !shape(x + 0.5, y - 0.5)) g.set(x, y, 1, WHITE)
    }
  g.box(-6, -1, 1, -4, 1, 2, '#6b3e26') // bridge
  g.box(8, -1, 0, 22, 1, 1, '#7a4a2a') // neck
  for (let x = 10; x < 22; x += 3) g.set(x, 0, 1, '#d8d2c4')
  g.box(22, -2, -1, 26, 2, 1, '#5a3420') // head
  for (const x of [23, 25]) {
    g.set(x, 2, 0, STEEL)
    g.set(x, -3, 0, STEEL)
  }
  return { grid: g, origin: [0, 0, 0] }
}

function book() {
  const g = new VoxelGrid()
  g.box(-4, 0, -1, 4, 10, 1, (x, y, z) => (x === 3 && z === 0 ? '#f4efe6' : z === 0 && y === 7 && x > -3 && x < 2 ? GOLD : '#b8323a'))
  return { grid: g, origin: [0, 5, 0] }
}

function camera() {
  const g = new VoxelGrid()
  g.box(-4, 0, -2, 4, 5, 2, (x, y) => (y === 4 ? '#3a3b44' : DARK))
  g.box(-2, 1, 2, 2, 4, 4, (x, y, z) => (z === 3 && x > -2 && x < 1 && y > 1 && y < 3 ? '#4a7fb8' : '#4b4c55'))
  g.box(2, 5, -1, 4, 6, 1, STEEL)
  g.set(-3, 3, 2, '#e8e2d2')
  return { grid: g, origin: [0, 2.5, 0] }
}

function controller() {
  const g = new VoxelGrid()
  g.box(-5, 0, -2, 5, 2, 2, '#3a3b44')
  g.box(-5, -2, -2, -2, 0, 2, '#3a3b44')
  g.box(2, -2, -2, 5, 0, 2, '#3a3b44')
  g.set(-4, 2, 0, '#9aa3ad')
  g.set(-3, 2, -1, '#9aa3ad')
  g.set(3, 2, 0, '#e85a6a')
  g.set(2, 2, -1, '#4ab06a')
  g.set(4, 2, -1, '#4a90c8')
  return { grid: g, origin: [0, 0, 0] }
}

function cricketBat() {
  const g = new VoxelGrid()
  g.box(0, -2, 0, 1, 5, 1, DARK) // grip
  g.box(-1, -16, -1, 2, -2, 1, (x, y) => (y === -3 ? '#d8b98a' : '#e6c992'))
  return { grid: g, origin: [0.5, 2, 0.5] }
}

function backpack() {
  const g = new VoxelGrid()
  const c = '#e0884a'
  g.box(-5, 0, -2, 5, 11, 2, (x, y) => (y === 10 ? shade(c, -0.1) : c))
  g.box(-3, 2, -3, 3, 6, -2, shade(c, -0.12))
  g.set(0, 5, -3, GOLD)
  return { grid: g, origin: [0, 5.5, 1.5] }
}

function plant() {
  const g = new VoxelGrid()
  g.box(-3, 0, -3, 3, 5, 3, (x, y) => (y === 4 ? '#b4583a' : '#c96b44'))
  g.box(-2, 5, -2, 2, 6, 2, '#5a3a28')
  const leaves = [
    [0, 6, 0, 8],
    [-2, 7, 0, 5],
    [2, 7, 1, 5],
    [-1, 8, -2, 4],
    [1, 8, 2, 4],
  ]
  for (const [x, y, z, h] of leaves) for (let i = 0; i < h; i++) g.box(x - (i > 1 ? 1 : 0), y + i, z, x + 1 + (i > 1 && i < h - 1 ? 1 : 0), y + i + 1, z + 1, i % 2 ? '#3f9b4b' : '#4caf55')
  return { grid: g, origin: [0, 0, 0] }
}

function cat() {
  const g = new VoxelGrid()
  const c = '#e3a35a'
  const stripe = shade(c, -0.12)
  g.box(-3, 0, -5, 3, 5, 2, (x, y, z) => ((z + 10) % 3 === 0 ? stripe : c)) // body
  g.box(-3, 4, 0, 3, 10, 5, c) // head
  g.box(-3, 10, 2, -1, 12, 3, c)
  g.box(1, 10, 2, 3, 12, 3, c)
  g.set(-2, 7, 5, '#1d1a1f')
  g.set(1, 7, 5, '#1d1a1f')
  g.set(-1, 6, 5, '#e8838e')
  g.set(0, 6, 5, '#e8838e')
  g.box(2, 0, -7, 3, 6, -5, stripe) // tail
  return { grid: g, origin: [0, 0, 0] }
}

function dog() {
  const g = new VoxelGrid()
  const c = '#f1e6d4'
  const ear = '#8a5a3a'
  g.box(-3, 0, -6, 3, 6, 2, c)
  g.box(-3, 5, 0, 3, 11, 6, c)
  g.box(-2, 5, 6, 2, 8, 8, shade(c, -0.05))
  g.set(-1, 7, 8, '#1d1a1f')
  g.set(0, 7, 8, '#1d1a1f')
  g.set(-2, 9, 6, '#1d1a1f')
  g.set(1, 9, 6, '#1d1a1f')
  g.box(-4, 6, 1, -3, 11, 4, ear)
  g.box(3, 6, 1, 4, 11, 4, ear)
  g.box(-1, 5, -8, 1, 8, -6, c)
  return { grid: g, origin: [0, 0, 0] }
}

function marigolds() {
  const g = new VoxelGrid()
  g.box(0, -6, 0, 1, 4, 1, '#3f8f45')
  g.box(-1, -4, 0, 2, -2, 1, '#e8b33c') // tie
  const blooms = [
    [-2, 4, -1, '#f08a1c'],
    [1, 4, -1, '#f3c623'],
    [-1, 6, 0, '#f3c623'],
    [1, 6, 1, '#f08a1c'],
    [-2, 5, 1, '#f08a1c'],
  ]
  for (const [x, y, z, c] of blooms) g.box(x, y, z, x + 2, y + 2, z + 2, (xx, yy, zz) => (hash3(xx, yy, zz) > 0.7 ? shade(c, -0.1) : c))
  return { grid: g, origin: [0.5, 0, 0.5] }
}

function paintbrush() {
  const g = new VoxelGrid()
  g.box(0, -3, 0, 1, 7, 1, '#c8323a')
  g.box(0, 7, 0, 1, 9, 1, STEEL)
  g.box(0, 9, 0, 1, 11, 1, '#4a90c8')
  return { grid: g, origin: [0.5, 0, 0.5] }
}

function kulfi() {
  const g = new VoxelGrid()
  g.box(0, -3, 0, 1, 2, 1, '#e6d3a8')
  g.box(-1, 2, -1, 2, 8, 2, (x, y) => (y > 5 ? '#f3e7c4' : y > 3 ? '#e9c98a' : '#a8c870'))
  g.set(0, 8, 0, '#f3e7c4')
  return { grid: g, origin: [0.5, 0, 0.5] }
}

function handbag() {
  const g = new VoxelGrid()
  const c = '#f2c94c'
  g.box(-4, 0, -2, 4, 6, 2, (x, y) => (y === 5 ? shade(c, -0.1) : c))
  g.box(-3, 6, 0, -2, 11, 1, c)
  g.box(1, 6, 0, 2, 11, 1, c)
  g.box(-3, 10, 0, 2, 11, 1, c)
  g.set(0, 4, 2, WHITE)
  return { grid: g, origin: [0, 0, 0] }
}

const BUILDERS = {
  'filter-coffee': filterCoffee,
  laptop,
  guitar,
  book,
  camera,
  controller,
  'cricket-bat': cricketBat,
  backpack,
  plant,
  cat,
  dog,
  flowers: marigolds,
  paintbrush,
  'ice-cream': kulfi,
  handbag,
}

export const hasItemModel = (id) => !!BUILDERS[id]
export function buildItem(id) {
  return BUILDERS[id]?.() || null
}
