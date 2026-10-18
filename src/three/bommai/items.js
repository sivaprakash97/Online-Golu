import { shiny } from '../voxel/grid.js'
import { HEAD1, HW, HD, SHOULDER, HIP, mod, shade } from './dims.js'

// Accessories as little voxel models. Each is drawn relative to an anchor (see buildBommai):
// for things held in a hand the anchor is the top of the hand, for things held in front it is
// the middle of the chest, for ground items it is the floor beside the pedestal. Head and back
// items use the doll's own coordinates.

const STEEL = shiny('#cdd2d9')
const WHITE = '#f8f5ee'
const DARK = '#2b2c33'

// Draw relative to an anchor, optionally mirrored in x or z.
// Draw relative to an anchor, optionally mirrored in x or z, or turned upright (`turn`: the
// item's +x points down, for things that lie along x when held but stand on end on the floor).
export function at(g, [ax, ay, az], { mx = false, mz = false, turn = false } = {}) {
  const X = (x0, x1) => (mx ? [ax - x1, ax - x0] : [ax + x0, ax + x1])
  const Z = (z0, z1) => (mz ? [az - z1, az - z0] : [az + z0, az + z1])
  const wrap = (c) => (typeof c === 'function' ? (x, y, z) => c(mx ? ax - x - 1 : x - ax, y - ay, mz ? az - z - 1 : z - az) : c)
  return {
    box(x0, x1, y0, y1, z0, z1, c) {
      if (turn) [x0, x1, y0, y1] = [y0, y1, -x1, -x0]
      const [a, b] = X(x0, x1)
      const [c0, c1] = Z(z0, z1)
      g.box(a, b, ay + y0, ay + y1, c0, c1, wrap(c))
    },
    rounded(x0, x1, y0, y1, z0, z1, r, c, vertical) {
      if (turn) [x0, x1, y0, y1] = [y0, y1, -x1, -x0]
      const [a, b] = X(x0, x1)
      const [c0, c1] = Z(z0, z1)
      g.rounded(a, b, ay + y0, ay + y1, c0, c1, r, wrap(c), vertical)
    },
    ellipsoid(cx, cy, cz, rx, ry, rz, c) {
      if (turn) [cx, cy, rx, ry] = [cy, -cx, ry, rx]
      g.ellipsoid(mx ? ax - cx : ax + cx, ay + cy, mz ? az - cz : az + cz, rx, ry, rz, wrap(c))
    },
    set(x, y, z, c) {
      this.box(x, x + 1, y, y + 1, z, z + 1, c)
    },
  }
}

function guitar(p) {
  const body = '#4f93d2'
  const rim = '#2f6aa6'
  // lower bout, waist and upper bout, lying along +x with the strings facing +z
  p.ellipsoid(-12, 0, 2, 7.5, 8, 2.2, (x, y, z) => (z < 1 ? rim : body))
  p.ellipsoid(-3, 0, 2, 5.5, 6, 2.2, (x, y, z) => (z < 1 ? rim : body))
  p.ellipsoid(-5, 0, 3.6, 2.4, 2.4, 1, '#1d2533') // sound hole
  p.box(-16, -14, -4, 5, 3, 5, '#6b3f22') // bridge
  p.box(-11, -9, -6, -4, 3, 4, '#e05a5a') // a bit of decoration
  p.box(1, 22, -1, 2, 1, 4, '#7a4a2a') // neck
  for (let x = 4; x < 22; x += 5) p.set(x, 0, 4, '#efe6d0') // fret dots
  p.rounded(21, 27, -2, 4, 1, 4, 1, '#3b2418') // head
  for (const x of [22, 25]) (p.set(x, 4, 2, WHITE), p.set(x, -3, 2, WHITE))
}

function veena(p) {
  // the big resonator (kudam) at +x, the long neck (dandi) running to -x with brass frets, the
  // small gourd hanging beneath it and the carved yali head at the end
  const wood = '#7a3f1d'
  const gold = shiny('#e3b23c')
  p.ellipsoid(17, 0, 0, 10.5, 10, 8, wood)
  p.ellipsoid(17, 0, 4, 9, 8.5, 3, '#b8773a') // soundboard
  p.box(15, 17, -4, 5, 6, 8, gold) // bridge
  p.box(5, 8, -4, 5, -3, 5, gold) // collar where neck meets kudam
  p.rounded(-25, 6, -2, 3, -2, 4, 1, '#5e2f15')
  for (let x = -22; x < 5; x += 3) p.box(x, x + 1, -2, 3, 4, 5, gold) // frets
  p.box(-25, 16, 0, 1, 5, 6, '#efe6d0') // strings
  p.rounded(-32, -24, -2, 7, -2, 4, 1.5, '#5e2f15') // yali head, curling up
  p.rounded(-33, -29, 5, 9, -2, 4, 1.5, '#5e2f15')
  p.set(-28, 4, 4, gold)
  p.box(-21, -19, -6, -2, 0, 2, '#5e2f15')
  p.ellipsoid(-20, -10, 1, 5, 5, 5, wood) // sorakkai
  p.ellipsoid(-20, -10, 4, 3, 3, 2, '#b8773a')
}

const HEAD_ITEMS = {
  cap(g) {
    const c = '#2f5d9a'
    g.rounded(-HW - 3, HW + 3, 74, HEAD1 + 7, -HD - 3, HD + 3, 8, (x, y) => (y < 74 + 1 ? shade(c, -0.15) : c))
    // the peak, sticking out over the forehead
    for (let x = -16; x < 16; x++)
      for (let z = HD + 2; z < HD + 14; z++) if (((x + 0.5) / 16) ** 2 + ((z - HD - 2) / 12) ** 2 <= 1) g.box(x, x + 1, 74, 76, z, z + 1, shade(c, -0.1))
    g.rounded(-2, 2, HEAD1 + 6, HEAD1 + 8, -2, 2, 1, shade(c, -0.15)) // button
    g.ellipsoid(-0.5, 81, HD + 3, 4, 3.4, 1.2, '#f4f1ea') // badge
    g.ellipsoid(-0.5, 81, HD + 3.8, 2, 1.6, 0.8, '#e05a3a')
  },
  beanie(g) {
    const c = '#e07a3a'
    const rib = (x) => (mod(x, 3) === 0 ? shade(c, -0.1) : c)
    g.rounded(-HW - 3, HW + 3, 72, HEAD1 + 9, -HD - 3, HD + 3, 9, (x) => rib(x))
    g.rounded(-HW - 4, HW + 4, 70, 78, -HD - 4, HD + 4, 3, (x) => (mod(x, 2) ? shade(c, -0.18) : shade(c, -0.08))) // folded cuff
    g.ellipsoid(-0.5, HEAD1 + 12, 0, 7, 6.5, 7, (x, y, z) => (mod(x + y + z, 3) ? '#f6f1e6' : '#e6dfd0')) // pom-pom
  },
  fedora(g) {
    const c = '#6b5440'
    for (let x = -34; x < 34; x++)
      for (let z = -29; z < 29; z++) {
        const e = ((x + 0.5) / 34) ** 2 + ((z + 0.5) / 28.5) ** 2
        if (e > 1) continue
        const curl = Math.abs(x + 0.5) > 29 ? 1 : 0 // the brim turns up at the sides
        g.box(x, x + 1, 77 + curl, 79 + curl, z, z + 1, c)
      }
    g.rounded(-HW - 3, HW + 3, 78, HEAD1 + 12, -HD - 3, HD + 3, 7, c) // crown
    g.rounded(-7, 7, HEAD1 + 9, HEAD1 + 13, -10, 8, 3, false) // the pinch in the crown
    g.box(-HW - 3, HW + 3, 79, 84, -HD - 3, HD + 3, (x, y, z) => (g.has(x, y, z) && Math.abs(x + 0.5) < 34 - 9 ? '#2a211c' : null)) // band
  },
  // a white crocheted skullcap, close on the crown
  kufi(g) {
    const c = '#f4f1ea'
    g.rounded(-HW - 3, HW + 3, 75, HEAD1 + 8, -HD - 3, HD + 3, 9, (x, y, z) => (y < 77 ? shade(c, -0.08) : mod(x + z, 3) === 0 && mod(y, 2) === 0 ? shade(c, -0.12) : c))
  },
  headphones(g) {
    const c = '#e8667a'
    g.rounded(-HW - 3, HW + 3, HEAD1 + 2, HEAD1 + 5, -2, 3, 1.5, DARK)
    for (const x of [-HW - 4, HW + 2]) g.box(x, x + 2, 68, HEAD1 + 3, -2, 3, DARK)
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? -HW - 7 : HW + 2
      g.rounded(x0, x0 + 5, 56, 70, -5, 6, 2.5, c)
      g.rounded(s < 0 ? x0 : x0 + 3, s < 0 ? x0 + 2 : x0 + 5, 59, 67, -2, 3, 1, '#c84a60')
    }
  },
}

function backpack(g, B) {
  const c = '#d98b3a'
  const z0 = -B.td / 2
  g.rounded(-10, 10, HIP + 1, SHOULDER - 1, z0 - 9, z0, 3, c)
  g.rounded(-7, 7, HIP + 2, HIP + 10, z0 - 11, z0 - 8, 2, '#b96f28')
  g.box(-10, 10, SHOULDER - 5, SHOULDER - 4, z0 - 10, z0, (x, y, z) => (g.has(x, y, z) ? '#b96f28' : null))
  for (const x of [-8, 6]) {
    g.box(x, x + 2, SHOULDER, SHOULDER + 2, z0, -z0, '#5a3a24')
    g.box(x, x + 2, HIP + 6, SHOULDER + 1, -z0, -z0 + 1, '#5a3a24')
  }
}

const HAND_ITEMS = {
  'filter-coffee'(p) {
    p.rounded(-7, 8, -1, 5, -6, 7, 2.5, STEEL) // davara
    p.rounded(-4, 5, 4, 19, -4, 5, 2, STEEL) // tumbler
    p.box(-3, 4, 18, 19, -3, 4, '#a0714a') // frothy coffee
    p.box(-2, 3, 18, 19, -2, 3, '#d8b48a')
    p.ellipsoid(0.5, 22, 0.5, 2, 1.5, 2, '#f4f1ea') // a wisp of steam
    p.ellipsoid(1.5, 26, 0.5, 1.5, 1.5, 1.5, '#f4f1ea')
  },
  controller(p) {
    p.rounded(-7, 7, 0, 4, -2, 2, 1.5, DARK)
    for (const x of [-7, 3]) p.rounded(x, x + 4, -4, 2, -2, 2, 1.5, DARK)
    p.set(-4, 2, 2, WHITE)
    p.set(-5, 2, 2, WHITE)
    p.set(3, 3, 2, '#e8b33c')
    p.set(4, 2, 2, '#5aa0e0')
    p.set(2, 2, 2, '#d94a3a')
  },
  'cricket-bat'(p) {
    p.box(0, 2, -8, 6, 0, 2, (x, y) => (mod(y, 3) ? '#2b4b8a' : '#e8edf5')) // grip
    p.rounded(-2, 4, -30, -8, -1, 3, 1, '#ead29e')
    p.box(-2, 4, -30, -28, -1, 3, '#d4b47a')
    p.box(-1, 3, -13, -11, 3, 4, '#d94a3a') // sticker
  },
  // a comically big bunch of marigolds
  flowers(p) {
    for (const x of [-2, 0, 2]) p.box(x, x + 1, -5, 16, 0, 2, '#3e8f3e')
    p.rounded(-4, 5, 0, 6, -2, 4, 1.5, '#c8323a') // ribbon
    for (const s of [-1, 1]) p.ellipsoid(s * 6, 12, 0, 3, 1.6, 2, '#4b9a45') // leaves
    for (const [x, y, z, c] of [
      [-7, 19, 0, '#f08a24'],
      [0, 23, 1, '#f5b52f'],
      [7, 19, 0, '#f08a24'],
      [-4, 29, -1, '#f5c242'],
      [4, 29, 0, '#f08a24'],
      [0, 17, 5, '#f5c242'],
      [0, 33, -1, '#f08a24'],
    ]) {
      p.ellipsoid(x, y, z, 5.2, 5, 5, (xx, yy, zz) => (mod(xx + yy + zz, 3) ? c : '#e07a18'))
      p.ellipsoid(x, y, z + 3.5, 1.6, 1.6, 2, '#b85a12')
    }
  },
  // a paintbrush nearly as tall as its owner, loaded with paint
  paintbrush(p) {
    p.rounded(-2, 3, -8, 23, -2, 3, 1, (x, y) => (mod(y, 10) === 9 ? '#e8b33c' : '#c0392b'))
    p.rounded(-3, 4, 22, 28, -3, 4, 1, STEEL)
    p.rounded(-4, 5, 27, 40, -4, 5, 2.8, (x, y) => (y >= 34 ? '#3f7fd0' : '#3a2a24'))
    p.ellipsoid(3, 32, 4, 1.6, 2.8, 1.2, '#3f7fd0') // a drip
  },
  // a giant kulfi on a stick, with a bite out of it
  'ice-cream'(p) {
    p.box(-1, 2, -6, 7, -1, 2, '#d9b98a') // stick
    p.rounded(-6, 7, 6, 30, -4, 5, 4.5, (x, y) => (y >= 25 ? '#f4c871' : '#ee9a3a'))
    p.ellipsoid(6, 30, 0.5, 4.5, 4.5, 6, false) // the bite (false carves voxels away)
    for (const [x, y] of [
      [-3, 11],
      [3, 14],
      [-1, 18],
      [2, 21],
      [-4, 22],
      [0, 26],
    ])
      p.box(x, x + 2, y, y + 1, 4, 5, '#7bb661') // pistachio bits
  },
  // things that are normally held in both hands, when only one is free
  laptop(p) {
    p.rounded(0, 2, 0, 14, -8, 8, 1, '#9aa1ab')
    p.box(2, 3, 6, 8, -1, 1, WHITE)
  },
  book(p) {
    p.rounded(0, 4, 0, 14, -6, 6, 0.8, '#b5462f')
    p.box(0, 4, 1, 13, 5, 6, WHITE)
  },
}

// Carried at the side, gripped in the hand of a hanging arm: x runs outward from the hand
// (0..3 is the slab pressed against it), y from the bottom of the hand.
const SIDE_ITEMS = {
  book(p) {
    p.rounded(0, 4, -13, 6, -7, 7, 0.8, '#b5462f')
    p.box(1, 3, -12, 5, 6, 7, WHITE) // pages
    p.box(3, 4, -5, -3, -5, 5, shiny('#e8b33c')) // title
  },
  laptop(p) {
    p.rounded(0, 3, -15, 6, -10, 10, 1, '#9aa1ab')
    p.box(2, 3, -6, -3, -2, 2, WHITE) // logo
  },
  // held upright by its edge, the deck facing out so its colours show
  skateboard(p) {
    p.rounded(0, 11, -19, 9, -1, 1, 3, '#e05a3a')
    p.box(0, 11, -19, 9, 1, 2, (x, y) => (Math.abs(y + 5) < 3 && x > 0 && x < 10 ? '#f5c242' : null))
    for (const y of [-14, 4]) {
      p.box(3, 8, y - 1, y + 1, -3, -1, STEEL) // trucks, behind the deck
      for (const x of [2.5, 8.5]) p.ellipsoid(x, y, -3.5, 1.6, 1.8, 1.6, '#f4f1ea')
    }
  },
}

const CHEST_ITEMS = {
  laptop(p) {
    p.rounded(-10, 10, 0, 2, -12, 0, 1, '#7f8691')
    p.rounded(-10, 10, 1, 15, -12, -10, 1, '#9aa1ab')
    p.box(-2, 2, 7, 10, -10, -9, WHITE)
  },
  book(p) {
    p.rounded(-8, 8, -4, 10, 0, 3, 0.8, '#b5462f')
    p.box(-6, 6, 5, 7, 3, 4, shiny('#e8b33c'))
    p.box(-1, 1, -4, 10, 0, 4, '#8e3220') // spine
  },
  camera(p) {
    p.rounded(-6, 6, -4, 4, 0, 4, 1.5, DARK)
    p.rounded(-3, 3, 3, 6, 0, 4, 1, DARK)
    p.ellipsoid(0, 0, 5, 3.4, 3.4, 2.2, '#555b66')
    p.ellipsoid(0, 0, 6.5, 2, 2, 1, '#1a1d24')
    p.set(4, 2, 4, '#d94a3a')
    p.set(-5, 2, 4, WHITE)
  },
  controller(p) {
    HAND_ITEMS.controller(p)
  },
  veena(p) {
    veena(p)
  },
}

const GROUND_ITEMS = {
  plant(p) {
    for (let y = 0; y < 8; y++) {
      const r = 5 + y * 0.25
      p.rounded(-Math.round(r), Math.round(r), y, y + 1, -Math.round(r), Math.round(r), 2, '#c4643a', true)
    }
    p.rounded(-8, 8, 7, 10, -8, 8, 2.5, '#b4552e', true)
    p.box(-6, 6, 9, 10, -6, 6, '#4a2e1f')
    for (const [x, y, z, c] of [
      [-3, 13, -2, '#3e8f3e'],
      [2, 15, 1, '#5aa84f'],
      [-4, 18, 1, '#4b9a45'],
      [3, 12, -2, '#4b9a45'],
      [0, 21, -1, '#6fbf5a'],
    ])
      p.ellipsoid(x, y, z, 3.4, 3, 3.4, c)
  },
  handbag(p) {
    const c = '#f2b632'
    p.rounded(-6, 6, 0, 10, -3, 3, 1.5, c)
    p.rounded(-6, 6, 5, 10, 2, 4, 1, '#d99a1f') // flap
    p.box(-1, 1, 5, 7, 4, 5, WHITE) // clasp
    for (const x of [-4, 3]) p.box(x, x + 1, 10, 16, -1, 1, c) // handle
    p.box(-4, 4, 16, 17, -1, 1, c)
  },
  // an easel with a little painting of the sun over the hills
  easel(p) {
    const wood = '#a0683a'
    for (let y = 0; y < 52; y++) {
      const k = Math.floor((y * 6) / 52)
      for (const s of [-1, 1]) p.box(s > 0 ? 8 - k : -10 + k, s > 0 ? 10 - k : -8 + k, y, y + 1, 1, 3, wood) // front legs
      if (y < 46) p.box(-1, 1, y, y + 1, -10 + Math.floor(y / 7), -8 + Math.floor(y / 7), wood) // back leg
    }
    p.box(-13, 13, 18, 21, 0, 6, wood) // ledge
    p.box(-12, 12, 21, 43, 2, 4, (x, y) => {
      if (Math.hypot(x - 5, y - 37) < 3.5) return '#f5c242' // sun
      if (y < 27 + Math.round(Math.sin(x / 4) * 2)) return '#4b9a45' // hills
      return '#9cc9ec'
    })
    p.box(-13, 13, 21, 22, 1, 5, '#f4f1ea')
    p.box(-2, 2, 43, 47, 1, 5, wood)
  },
  skateboard(p) {
    p.rounded(-14, 14, 3, 5, -5, 6, 2.5, (x, y) => (y >= 4 ? '#2b2c33' : '#e05a3a'))
    for (const x of [-9, 8]) {
      p.box(x - 1, x + 2, 2, 3, -3, 4, STEEL)
      for (const z of [-4, 4.5]) p.ellipsoid(x + 0.5, 1.6, z, 1.6, 1.6, 1.6, '#f4f1ea')
    }
  },
  // things put down for a dance or a cheer
  laptop(p) {
    p.rounded(-8, 8, 0, 2, -5, 6, 1, '#7f8691')
    p.rounded(-8, 8, 1, 12, -6, -4, 1, '#9aa1ab')
    p.box(-1, 1, 6, 8, -7, -6, WHITE)
  },
  book(p) {
    p.rounded(-6, 6, 0, 3, -5, 5, 0.8, '#3f7fd0')
    p.rounded(-5, 6, 3, 6, -4, 5, 0.8, '#b5462f')
    p.box(-5, 6, 3, 6, 4, 5, WHITE)
  },
}

export function itemAt(g, id, mode, anchors, { L, B, side = -1 } = {}) {
  const z1 = B.td / 2
  if (id === 'guitar-strap') {
    // a strap from the right hip over the left shoulder
    for (let y = HIP; y < SHOULDER + 1; y++) {
      const x = Math.round(-B.tw / 2 + ((y - HIP) / (SHOULDER - HIP)) * (B.tw - 2))
      g.box(x, x + 2, y, y + 1, z1, z1 + 1, '#4a2c1d')
    }
    return
  }
  if (mode === 'head') return HEAD_ITEMS[id]?.(g, L)
  if (mode === 'back') return backpack(g, B)
  if (mode === 'ground') {
    if (id === 'veena') return veena(at(g, [anchors.ground[0], 27, anchors.ground[2]], { turn: true }))
    if (GROUND_ITEMS[id]) return GROUND_ITEMS[id](at(g, anchors.ground))
    // something usually held in the hand, stood on the floor
    const lift = { 'cricket-bat': 30, 'ice-cream': 6, paintbrush: 8, flowers: 5, 'filter-coffee': 1 }[id] || 0
    return HAND_ITEMS[id]?.(at(g, [anchors.ground[0], anchors.ground[1] + lift, anchors.ground[2]]))
  }
  if (id === 'veena') return veena(at(g, [-4, 30, z1 + 6]))
  if (id === 'guitar') {
    if (mode === 'slung-back') {
      guitar(at(g, [0, 30, -z1 - 4], { mx: true, mz: true }))
      return itemAt(g, 'guitar-strap', mode, anchors, { L, B })
    }
    guitar(at(g, mode === 'chest' ? [2, 32, z1 + 3] : [2, 30, z1]))
    if (mode === 'slung') itemAt(g, 'guitar-strap', mode, anchors, { L, B })
    return
  }
  if (mode === 'strap') {
    CHEST_ITEMS.camera(at(g, [0, 30, z1]))
    for (const x of [-5, 4]) g.box(x, x + 1, 33, SHOULDER + 1, z1, z1 + 1, DARK)
    return
  }
  if (mode === 'chest') {
    const fn = CHEST_ITEMS[id] || HAND_ITEMS[id]
    return fn && fn(at(g, anchors.chest))
  }
  if (mode === 'tuck') {
    const fn = SIDE_ITEMS[id]
    return fn && fn(at(g, anchors.tuck, { mx: side < 0 }))
  }
  if (mode === 'lean' || mode === 'clasp' || mode === 'up') {
    const fn = HAND_ITEMS[id]
    return fn && fn(at(g, anchors[mode]))
  }
}
