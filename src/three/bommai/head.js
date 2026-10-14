import { VoxelGrid } from '../voxel/mesher.js'
import { shade, mix, hash3, GOLD, WHITE } from './look.js'

// The head, in head-local voxels: a 22 × 20 × 18 block, x ∈ [-11, 11), y ∈ [0, 20), z ∈ [-9, 9).
// The face is pixel art painted on the front layer (z = 8); a few details stand one voxel proud.
export const HEAD = { x0: -11, x1: 11, y1: 20, z0: -9, z1: 9 }
const FZ = 8 // front layer of the face
const INK = '#2a1a18'
const IRIS = '#5b3426'
const MOUTH = '#a3282b'
const MOUTH_IN = '#7a1d22'
const BLUSH = '#ef8f86'

function px(g, x, y, c, z = FZ) {
  g.set(x, y, z, c)
}

// ---------------------------------------------------------------- face
function eye(g, x0, kind) {
  // 5 wide × 6 tall at x0..x0+4, y 7..12; highlights sit on the same side for both eyes
  const fill = (x1, y0, y1, c) => {
    for (let x = x0 + x1[0]; x < x0 + x1[1]; x++) for (let y = y0; y < y1; y++) px(g, x, y, c)
  }
  switch (kind) {
    case 'happy': // ^
      ;[[0, 9], [1, 10], [2, 11], [3, 10], [4, 9]].forEach(([x, y]) => (px(g, x0 + x, y, INK), px(g, x0 + x, y - 1, INK)))
      break
    case 'sleepy':
      fill([0, 5], 9, 10, INK)
      fill([1, 4], 8, 9, IRIS)
      break
    case 'dots':
      fill([1, 4], 8, 11, INK)
      px(g, x0 + 1, 10, WHITE)
      break
    case 'sparkle':
      fill([0, 5], 7, 13, INK)
      fill([1, 4], 7, 9, '#4a7fb8')
      fill([1, 3], 10, 12, WHITE)
      px(g, x0 + 3, 9, WHITE)
      break
    case 'round':
    default:
      fill([0, 5], 7, 13, INK)
      fill([1, 4], 7, 9, IRIS)
      fill([1, 3], 10, 12, WHITE)
      px(g, x0 + 3, 8, '#e9d6c8')
      break
  }
}

function face(g, cfg, look) {
  const extras = new Set(cfg.face_extras)
  const brow = cfg.hair === 'bald' ? shade(look.skin, -0.3) : shade(look.hair, 0.04)
  // eyes
  eye(g, -9, cfg.face === 'wink' ? 'round' : cfg.face)
  eye(g, 4, cfg.face === 'wink' ? 'happy' : cfg.face)
  // brows
  for (let i = 0; i < 4; i++) {
    px(g, -8 + i, 14, brow)
    px(g, 5 + i, 14, brow)
  }
  // nose: a tiny bump
  g.box(-1, 7, FZ + 1, 1, 8, FZ + 2, shade(look.skin, -0.03))
  // blush (always a little; stronger with the Blush option)
  const blush = mix(look.skin, BLUSH, extras.has('blush') ? 0.85 : 0.55)
  for (const x0 of [-11, 8]) for (let i = 0; i < 3; i++) for (let y = 5; y < 7; y++) px(g, x0 + i, y, blush)
  // mouth: a small open smile, teeth on top
  ;[-2, 1].forEach((x) => px(g, x, 5, MOUTH))
  ;[-1, 0].forEach((x) => px(g, x, 5, WHITE))
  ;[-2, 1].forEach((x) => px(g, x, 4, MOUTH))
  ;[-1, 0].forEach((x) => px(g, x, 4, MOUTH_IN))

  if (extras.has('bindi')) px(g, -1, 16, '#c8323a'), px(g, 0, 16, '#c8323a')
  if (extras.has('namam')) {
    for (let x = -4; x < 4; x++) {
      px(g, x, 15, WHITE)
      px(g, x, 17, WHITE)
    }
    px(g, -1, 16, '#c8323a')
    px(g, 0, 16, '#c8323a')
  }
  if (extras.has('mustache')) {
    const m = cfg.hair === 'bald' || cfg.hair_color === 'silver' ? shade(look.hair, -0.1) : look.hair
    for (let x = -3; x < 3; x++) g.set(x, 6, FZ + 1, m)
    g.set(-3, 5, FZ + 1, m)
    g.set(2, 5, FZ + 1, m)
  }
  if (extras.has('beard')) {
    const b = look.hair
    for (let x = -11; x < 11; x++)
      for (let y = 0; y < 5; y++) {
        const edge = Math.abs(x + 0.5)
        if (y >= 2 && edge < 4) continue // keep the mouth clear
        if (edge > 9.5 && y > 3) continue
        g.set(x, y, FZ + 1, b)
      }
    // sideburns
    g.box(-11, 4, 2, -10, 12, FZ + 1, b)
    g.box(10, 4, 2, 11, 12, FZ + 1, b)
  }
  if (extras.has('nosering')) g.set(1, 7, FZ + 2, GOLD)
  if (extras.has('glasses')) frames(g, '#e9d9a6', false)
  if (extras.has('shades')) frames(g, WHITE, true)
}

// round-ish frames one voxel in front of the face, around each eye
function frames(g, frame, dark) {
  const z = FZ + 2
  for (const x0 of [-9, 3]) {
    for (let x = x0; x < x0 + 6; x++)
      for (let y = 7; y < 14; y++) {
        const border = x === x0 || x === x0 + 5 || y === 7 || y === 13
        const corner = (x === x0 || x === x0 + 5) && (y === 7 || y === 13)
        if (corner) continue
        if (border) g.set(x, y, z, frame)
        else if (dark) g.set(x, y, z, (x === x0 + 1 && y === 12) || (x === x0 + 2 && y === 11) ? '#5a5a66' : '#141418')
      }
  }
  // bridge and arms back to the ears
  g.set(-3, 11, z, frame)
  g.set(-2, 11, z, frame)
  g.set(1, 11, z, frame)
  g.set(2, 11, z, frame)
  for (let zz = 0; zz < z; zz++) {
    g.set(-12, 11, zz, frame)
    g.set(11, 11, zz, frame)
  }
}

// ---------------------------------------------------------------- hair
// Hair is built from horizontal slabs, like a stack of thin cards: alternate slab rows step out by
// one voxel and are shaded slightly darker, which gives the layered look of the references.
function hairKit(g, c) {
  const dark = shade(c, -0.05)
  const light = shade(c, 0.05)
  const band = (y) => (Math.floor(y / 2) % 2 === 0 ? c : dark)
  return {
    c,
    dark,
    light,
    band,
    // top cap over the head
    cap(top = 22, x0 = -12, x1 = 12, z0 = -10, z1 = 10) {
      g.box(x0, 20, z0, x1, top, z1, (x, y) => (y === top - 1 ? light : c))
      // round the top edges a little
      for (const x of [x0, x1 - 1]) for (const z of [z0, z1 - 1]) g.set(x, top - 1, z, null)
    },
    // side curtains at x = -12 / 11 (plus an outer slab layer when thick)
    sides(yBottom, { thick = false, zFront = 6, zBack = -10, flare = 0 } = {}) {
      for (let y = yBottom; y < 21; y++) {
        const out = thick && Math.floor(y / 2) % 2 === 0 ? 1 : 0
        const fl = flare && y < yBottom + flare ? 1 : 0
        for (let z = zBack; z < zFront; z++) {
          for (const [x, dir] of [
            [-12, -1],
            [11, 1],
          ]) {
            g.set(x, y, z, band(y))
            if (out) g.set(x + dir, y, z, band(y))
            if (fl) g.set(x + dir * (1 + out), y, z, band(y))
          }
        }
      }
    },
    back(yBottom, { thick = false, x0 = -12, x1 = 12 } = {}) {
      for (let y = yBottom; y < 21; y++) {
        const out = thick && Math.floor(y / 2) % 2 === 0
        for (let x = x0; x < x1; x++) {
          g.set(x, y, -10, band(y))
          if (out) g.set(x, y, -11, band(y))
        }
      }
    },
    // fringe on the forehead: bottom(x) gives the lowest row of hair for each column
    fringe(bottom, top = 22) {
      for (let x = -12; x < 12; x++) {
        const b = bottom(x)
        if (b == null) continue
        for (let y = Math.max(b, 0); y < top; y++) g.set(x, y, FZ + 1, y === b ? dark : c)
        // fill behind the fringe so the hairline has depth at the temples
        if (Math.abs(x + 0.5) > 9) for (let y = b; y < 21; y++) g.set(x, y, FZ, c)
      }
    },
  }
}

const centrePart = (x) => {
  const d = Math.abs(x + 0.5)
  if (d < 1) return 18
  if (d > 9.5) return 4
  return Math.round(18 - d * 0.55)
}

function hair(g, cfg, look, { hat }) {
  const style = cfg.hair
  if (style === 'bald') return
  const k = hairKit(g, look.hair)
  const choppy = (x) => 15 + ((x * 7 + 21) % 3 === 0 ? -1 : 0)
  switch (style) {
    case 'short-crop':
      k.cap(22)
      k.sides(13)
      k.back(5)
      k.fringe((x) => (Math.abs(x + 0.5) > 10 ? 13 : 16 + ((x + 12) % 3 === 0 ? -1 : 0)))
      break
    case 'side-part':
      k.cap(23)
      k.sides(12)
      k.back(4)
      k.fringe((x) => (x < -4 ? 18 - Math.max(0, -x - 8) : Math.max(12, Math.round(17 - (x + 4) * 0.45))))
      g.box(-5, 22, -6, -4, 23, 9, k.light) // the part
      break
    case 'spiky':
      k.cap(22)
      k.sides(13)
      k.back(5)
      k.fringe((x) => 16 + (((x + 12) % 4) === 0 ? -1 : 0))
      for (const [x, z, h] of [
        [-9, -2, 3],
        [-5, 2, 4],
        [-1, -4, 5],
        [3, 2, 4],
        [7, -2, 3],
        [-6, -7, 3],
        [4, -7, 3],
        [-1, 4, 3],
      ]) {
        for (let i = 0; i < h; i++) {
          const s = i < h - 1 ? 3 : 2
          g.box(x, 22 + i, z, x + s, 23 + i, z + s, i === h - 1 ? k.light : k.c)
        }
      }
      break
    case 'curly': {
      const curl = (x, y, z) => (hash3(x >> 1, y >> 1, z >> 1) > 0.5 ? k.c : k.dark)
      g.box(-13, 18, -12, 13, 24, 11, curl)
      g.box(-14, 6, -12, -11, 20, 6, curl)
      g.box(11, 6, -12, 14, 20, 6, curl)
      g.box(-13, 4, -13, 13, 20, -9, curl)
      // knock out cells so the outline goes lumpy
      for (let x = -14; x < 14; x += 2)
        for (let y = 4; y < 24; y += 2)
          for (let z = -13; z < 11; z += 2)
            if (hash3(x, y, z) > 0.62) g.box(x, y, z, x + 2, y + 2, z + 2, (xx, yy, zz) => (Math.abs(xx) > 11 || yy > 21 || zz < -10 ? null : undefined))
      for (let x = -12; x < 12; x += 2) g.box(x, 16, FZ + 1, x + 2, 16 + (((x + 12) / 2) % 2 ? 3 : 2) + 1, FZ + 2, curl)
      break
    }
    case 'long-straight':
      k.cap(22)
      k.sides(-7, { thick: true, zFront: 9 })
      k.back(-8, { thick: true })
      k.fringe(centrePart)
      break
    case 'long-wavy':
      k.cap(22)
      k.sides(-6, { thick: true, zFront: 9, flare: 6 })
      k.back(-7, { thick: true })
      k.fringe(centrePart)
      // wavy ends
      for (let y = -6; y < 0; y++) {
        const wob = Math.floor((y + 6) / 2) % 2 ? 1 : 0
        if (!wob) continue
        for (let z = -10; z < 9; z++) {
          g.set(-15, y, z, k.dark)
          g.set(14, y, z, k.dark)
        }
      }
      break
    case 'braid': {
      k.cap(22)
      k.sides(9, { zFront: 4 })
      k.back(2)
      k.fringe(centrePart)
      for (let i = 0; i < 6; i++) {
        const y = 2 - i * 3
        const off = i % 2 ? 1 : -1
        g.box(-2 + off, y - 3, -14, 2 + off, y, -10, i % 2 ? k.c : k.dark)
        g.set(off > 0 ? -2 : 2, y - 2, -12, WHITE) // jasmine
        g.set(off > 0 ? -2 : 2, y - 1, -13, WHITE)
      }
      g.box(-1, -20, -13, 1, -16, -11, '#c8323a') // kunjalam tassel
      g.box(-1, -16, -13, 1, -15, -11, GOLD)
      break
    }
    case 'top-bun':
      k.cap(22)
      k.sides(10, { zFront: 4 })
      k.back(4)
      k.fringe(centrePart)
      g.box(-5, 22, -6, 5, 25, 3, k.c)
      g.box(-4, 25, -5, 4, 27, 2, k.light)
      g.box(-5, 22, -6, 5, 23, 3, GOLD)
      break
    case 'low-bun':
      k.cap(22)
      k.sides(9, { zFront: 4 })
      k.back(3)
      k.fringe(centrePart)
      g.box(-5, 4, -16, 5, 13, -10, k.c)
      g.box(-4, 5, -17, 4, 12, -16, k.dark)
      for (let i = -5; i < 5; i++) {
        if ((i + 5) % 2) continue
        g.set(i, 13, -13, WHITE)
        g.set(i, 3, -13, WHITE)
      }
      for (let y = 4; y < 13; y += 2) {
        g.set(-6, y, -13, WHITE)
        g.set(5, y, -13, WHITE)
      }
      break
    case 'ponytail':
      k.cap(22)
      k.sides(12, { zFront: 4 })
      k.back(8)
      k.fringe(choppy)
      g.box(-2, 13, -12, 2, 16, -10, GOLD)
      for (let y = -6; y < 14; y++) {
        const w = y > 6 ? 3 : y > -2 ? 2 : 1
        const z = -12 - Math.min(3, Math.floor((14 - y) / 6))
        g.box(-w, y, z - 2, w, y + 1, z + 1, k.band(y))
      }
      break
    case 'puffs':
      k.cap(22)
      k.sides(12)
      k.back(5)
      k.fringe(choppy)
      for (const s of [-1, 1]) {
        const x0 = s < 0 ? -16 : 9
        g.box(x0, 17, -4, x0 + 7, 25, 4, (x, y, z) => {
          const cx = x0 + 3,
            ex = Math.abs(x - cx) > 2.6,
            ey = y === 17 || y === 24,
            ez = z === -4 || z === 3
          return (ex && ey) || (ex && ez) || (ey && ez) ? null : hash3(x, y, z) > 0.5 ? k.c : k.dark
        })
      }
      break
    default:
      k.cap(22)
      k.sides(12)
      k.back(5)
      k.fringe(choppy)
  }
  if (hat) for (const key of [...g.cells.keys()]) if (Number(key.split(',')[1]) >= 15 && g.get(...key.split(',').map(Number)) !== look.skin) g.cells.delete(key)
}

// ---------------------------------------------------------------- headwear
function animalHat(g, kind) {
  const base = kind === 'bunny' ? '#f6f3ee' : kind === 'cat' ? '#aab0de' : '#d9895a'
  const trim = kind === 'bunny' ? '#f39ab2' : shade(base, -0.12)
  g.box(-12, 15, -10, 12, 26, 10, (x, y) => (y === 15 ? trim : y === 25 ? shade(base, 0.04) : base))
  for (const x of [-12, 11]) for (const z of [-10, 9]) g.set(x, 25, z, null)
  // a little face on the hat
  const z = 10
  for (const x0 of [-7, 4]) g.box(x0, 20, z, x0 + 2, 22, z + 1, '#1d1a1f')
  g.box(-1, 19, z, 1, 20, z + 1, '#1d1a1f')
  const cheek = kind === 'bunny' ? '#f6a5ba' : kind === 'cat' ? '#8d8fd6' : '#d8604a'
  for (const x0 of [-9, 6]) g.box(x0, 18, z, x0 + 3, 19, z + 1, cheek)
  // ears
  if (kind === 'bunny') {
    for (const x0 of [-8, 4]) {
      g.box(x0, 26, -2, x0 + 4, 37, 1, base)
      g.box(x0 + 1, 27, 1, x0 + 3, 36, 2, '#f39ab2')
    }
  } else if (kind === 'cat') {
    for (const x0 of [-10, 4]) for (let i = 0; i < 4; i++) g.box(x0 + i, 26 + i, -2, x0 + 6 - i, 27 + i, 1, i > 0 && i < 3 ? '#6e63b8' : base)
  } else {
    for (const x0 of [-10, 5]) {
      g.box(x0, 26, -2, x0 + 5, 29, 1, base)
      g.box(x0 + 1, 26, 1, x0 + 4, 28, 2, '#8a4a2c')
    }
  }
}

function flowerCrown(g) {
  const petals = ['#d92e3a', '#f08a1c', '#d92e3a', '#f3c623']
  let i = 0
  const flower = (x, y, z, axis) => {
    const c = petals[i++ % petals.length]
    const centre = shade(c, 0.25)
    for (let a = 0; a < 3; a++)
      for (let b = 0; b < 3; b++) {
        const cc = a === 1 && b === 1 ? centre : c
        if (axis === 'z') g.set(x + a, y + b, z, cc)
        else g.set(x, y + b, z + a, cc)
      }
  }
  const leaf = '#3f8f45'
  for (let x = -12; x < 12; x++) g.set(x, 19, 10, leaf)
  for (let x = -12; x < 12; x += 4) flower(x, 18, 11, 'z')
  for (let z = -10; z < 10; z++) {
    g.set(-13, 19, z, leaf)
    g.set(12, 19, z, leaf)
  }
  for (let z = -9; z < 9; z += 4) {
    flower(-14, 18, z, 'x')
    flower(13, 18, z, 'x')
  }
}

function headphones(g) {
  const band = '#2e2f38'
  const cup = '#e85a6a'
    for (const x0 of [-15, 13]) g.box(x0, 12, -2, x0 + 2, 24, 2, band)
  g.box(-15, 23, -2, 15, 25, 2, band)
  for (const x0 of [-17, 14]) g.box(x0, 6, -4, x0 + 3, 13, 4, (x, y) => (y === 6 || y === 12 ? shade(cup, -0.12) : cup))
}

export function buildHead(cfg, look, headItem) {
  const g = new VoxelGrid()
  const H = HEAD
  // skull with softened edges
  g.box(H.x0, 0, H.z0, H.x1, H.y1, H.z1, (x, y, z) => {
    const ex = x === H.x0 || x === H.x1 - 1
    const ey = y === 0 || y === H.y1 - 1
    const ez = z === H.z0 || z === H.z1 - 1
    if ((ex && ey) || (ex && ez) || (ey && ez)) return null
    return look.skin
  })
  // ears
  for (const x of [-12, 11]) g.box(x, 7, -2, x + 1, 12, 2, look.skin)
  g.set(-12, 9, 1, look.skinShade)
  g.set(11, 9, 1, look.skinShade)
  face(g, cfg, look)
  const hat = ['bunny-hat', 'cat-hat', 'bear-hat'].includes(headItem)
  hair(g, cfg, look, { hat })
  if (hat) animalHat(g, headItem.split('-')[0])
  if (headItem === 'headphones') headphones(g)
  if (headItem === 'flower-crown') flowerCrown(g)
  return g
}
