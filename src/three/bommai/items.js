import { shiny } from '../voxel/grid.js'
import { HEAD1, HW, SHOULDER, HIP, mod } from './dims.js'

// Accessories as little voxel models. Each is drawn relative to an anchor (see buildBommai):
// for things held in a hand the anchor is the top of the hand, for things held in front it is
// the middle of the chest, for ground items it is the floor beside the pedestal. Head and back
// items use the doll's own coordinates.

const STEEL = shiny('#cdd2d9')
const WHITE = '#f8f5ee'
const DARK = '#2b2c33'

// Draw relative to an anchor, optionally mirrored in x or z.
function at(g, [ax, ay, az], { mx = false, mz = false } = {}) {
  const X = (x0, x1) => (mx ? [ax - x1, ax - x0] : [ax + x0, ax + x1])
  const Z = (z0, z1) => (mz ? [az - z1, az - z0] : [az + z0, az + z1])
  const wrap = (c) => (typeof c === 'function' ? (x, y, z) => c(mx ? ax - x - 1 : x - ax, y - ay, mz ? az - z - 1 : z - az) : c)
  return {
    box(x0, x1, y0, y1, z0, z1, c) {
      const [a, b] = X(x0, x1)
      const [c0, c1] = Z(z0, z1)
      g.box(a, b, ay + y0, ay + y1, c0, c1, wrap(c))
    },
    rounded(x0, x1, y0, y1, z0, z1, r, c, vertical) {
      const [a, b] = X(x0, x1)
      const [c0, c1] = Z(z0, z1)
      g.rounded(a, b, ay + y0, ay + y1, c0, c1, r, wrap(c), vertical)
    },
    ellipsoid(cx, cy, cz, rx, ry, rz, c) {
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

const HEAD_ITEMS = {
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
    p.rounded(-5, 6, 0, 4, -5, 6, 2, STEEL) // davara
    p.rounded(-3, 4, 3, 13, -3, 4, 1.5, STEEL) // tumbler
    p.box(-2, 3, 12, 13, -2, 3, '#a0714a') // frothy coffee
    p.box(-1, 2, 12, 13, -1, 2, '#c8a07a')
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
  flowers(p) {
    for (const x of [-1, 0, 1]) p.box(x, x + 1, -2, 9, 0, 1, '#3e8f3e')
    p.rounded(-2, 3, 1, 4, -2, 3, 1, '#c8323a') // ribbon
    for (const [x, y, z, c] of [
      [-3, 10, -1, '#f08a24'],
      [0, 12, 0, '#f5b52f'],
      [3, 10, -1, '#f08a24'],
      [-1, 14, -2, '#f5c242'],
      [2, 14, 1, '#f08a24'],
      [0, 9, 2, '#f5c242'],
    ])
      p.ellipsoid(x, y, z, 2.6, 2.4, 2.6, (xx, yy, zz) => (mod(xx + yy + zz, 3) ? c : '#e07a18'))
  },
  paintbrush(p) {
    p.box(0, 2, -4, 10, 0, 2, '#b5462f')
    p.box(0, 2, 10, 12, 0, 2, STEEL)
    p.rounded(0, 2, 12, 17, 0, 2, 0.8, '#3f7fd0')
  },
  'ice-cream'(p) {
    p.box(0, 2, 0, 6, 0, 2, '#d9b98a') // stick
    p.rounded(-2, 4, 5, 17, -2, 3, 2.5, (x, y) => (y < 3 ? '#e9a34a' : '#f3d9a4')) // kulfi
    for (const [x, y] of [
      [-2, 10],
      [3, 12],
      [0, 15],
    ])
      p.set(x, y, 2, '#7bb661') // pistachio bits
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
  cat(p) {
    const c = '#e39a52'
    const stripe = '#c4782f'
    p.ellipsoid(0, 5, 0, 5, 5.5, 4.5, (x, y) => (mod(y, 3) === 0 ? stripe : c)) // body
    p.ellipsoid(0, 13, 1.5, 5, 4.5, 4, c) // head
    for (let k = 0; k < 3; k++) (p.box(-4, -1 - k, 16 + k, 17 + k, 0, 3, c), p.box(1 + k, 4, 16 + k, 17 + k, 0, 3, c)) // ears
    p.set(-2, 13, 5, '#1c1c22')
    p.set(1, 13, 5, '#1c1c22')
    p.set(-1, 11, 5, '#f08aa0')
    p.set(0, 11, 5, '#f08aa0')
    for (let y = 1; y < 10; y++) p.box(4 + (y > 6 ? 1 : 0), 6 + (y > 6 ? 1 : 0), y, y + 1, -4, -2, mod(y, 3) ? c : stripe) // tail
  },
  dog(p) {
    const c = '#c9a074'
    p.ellipsoid(0, 5, -1, 5, 5.5, 5, c) // body
    p.ellipsoid(0, 13, 1, 5, 4.5, 4.5, c) // head
    p.rounded(-2, 2, 10, 13, 4, 8, 1, '#e8d2b0') // snout
    p.set(-1, 12, 7, '#1c1c22')
    p.set(0, 12, 7, '#1c1c22')
    p.set(-3, 14, 5, '#1c1c22')
    p.set(2, 14, 5, '#1c1c22')
    for (const s of [-1, 1]) p.rounded(s > 0 ? 4 : -6, s > 0 ? 6 : -4, 8, 16, -1, 3, 1, '#8a6440') // floppy ears
    p.rounded(-1, 1, 3, 9, -8, -5, 0.8, c) // tail
  },
  handbag(p) {
    const c = '#f2b632'
    p.rounded(-6, 6, 0, 10, -3, 3, 1.5, c)
    p.rounded(-6, 6, 5, 10, 2, 4, 1, '#d99a1f') // flap
    p.box(-1, 1, 5, 7, 4, 5, WHITE) // clasp
    for (const x of [-4, 3]) p.box(x, x + 1, 10, 16, -1, 1, c) // handle
    p.box(-4, 4, 16, 17, -1, 1, c)
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
    const fn = GROUND_ITEMS[id]
    return fn && fn(at(g, anchors.ground))
  }
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
    const fn = HAND_ITEMS[id]
    return fn && fn(at(g, anchors.tuck, { mx: side < 0 }))
  }
  if (mode === 'hand' || mode === 'clasp' || mode === 'up') {
    const fn = HAND_ITEMS[id]
    return fn && fn(at(g, anchors[mode === 'clasp' ? 'clasp' : mode === 'up' ? 'up' : 'hand']))
  }
}
