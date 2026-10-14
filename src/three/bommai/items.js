import { shiny } from '../voxel/grid.js'
import { HEAD1, SHOULDER, HIP, mod } from './dims.js'

// Accessories as little voxel models. Each is drawn relative to an anchor (see buildBommai):
// for things held in a hand the anchor is the top of the hand, for things held in front it is
// the middle of the chest, for ground items it is the floor beside the pedestal. Head and back
// items use the doll's own coordinates.

const STEEL = shiny('#cdd2d9')
const WOOD = '#c98f55'
const WHITE = '#f8f5ee'
const DARK = '#2b2c33'

function at(g, [ax, ay, az], { mx = false, mz = false } = {}) {
  const X = (x0, x1) => (mx ? [ax - x1, ax - x0] : [ax + x0, ax + x1])
  const Z = (z0, z1) => (mz ? [az - z1, az - z0] : [az + z0, az + z1])
  return {
    box(x0, x1, y0, y1, z0, z1, c) {
      const [a, b] = X(x0, x1)
      const [c0, c1] = Z(z0, z1)
      g.box(a, b, ay + y0, ay + y1, c0, c1, c)
    },
    set(x, y, z, c) {
      this.box(x, x + 1, y, y + 1, z, z + 1, c)
    },
  }
}

function guitar(p) {
  const body = '#4f93d2'
  const rim = '#2f6aa6'
  // lower bout, waist, upper bout
  p.box(-9, -4, -3, 4, 0, 2, body)
  p.box(-4, 0, -2, 3, 0, 2, body)
  for (const [x, y] of [
    [-9, -3],
    [-9, 3],
    [-1, -2],
    [-1, 2],
  ])
    p.box(x, x + 1, y, y + 1, 0, 2, null)
  p.box(-9, 0, -3, -2, 0, 1, rim)
  p.box(-3, -1, 0, 2, 1, 2, '#1d2533') // sound hole
  p.box(-8, -7, -1, 3, 1, 2, '#6b3f22') // bridge
  p.box(-6, -5, -2, -1, 1, 2, '#e05a5a') // a bit of decoration, like the reference
  p.box(0, 10, 0, 2, 0, 1, '#7a4a2a') // neck
  for (let x = 1; x < 10; x += 3) p.set(x, 1, 1, '#efe6d0') // fret dots
  p.box(10, 13, -1, 3, 0, 1, '#3b2418') // head
  for (const x of [10, 12]) (p.set(x, 3, 0, WHITE), p.set(x, -2, 0, WHITE))
}

function hat(g, { color, band, ears, face = true }) {
  // wide enough to swallow the stepped hair underneath
  g.box(-12, 12, 37, HEAD1 + 6, -10, 9, color)
  for (const x of [-12, 11]) for (const z of [-10, 8]) g.box(x, x + 1, 37, HEAD1 + 6, z, z + 1, null)
  for (let x = -12; x < 12; x++) for (const z of [-10, 8]) g.set(x, HEAD1 + 5, z, null)
  for (let z = -10; z < 9; z++) for (const x of [-12, 11]) g.set(x, HEAD1 + 5, z, null)
  if (band) g.box(-12, 12, 37, 38, -10, 9, (x, y, z) => (g.has(x, y, z) ? band : null))
  if (face) {
    // its own little face, high on the front
    for (const x of [-6, 4]) g.box(x, x + 2, 42, 44, 8, 9, '#1c1c22')
    g.set(-5, 43, 8, WHITE)
    g.set(5, 43, 8, WHITE)
    g.box(-1, 1, 41, 42, 8, 9, '#1c1c22')
    for (const x of [-9, 6]) g.box(x, x + 3, 40, 41, 8, 9, ears.blush)
  }
  ears.draw(g)
}

const HEAD_ITEMS = {
  headphones(g) {
    const c = '#e8667a'
    g.box(-11, 11, HEAD1 + 2, HEAD1 + 3, -1, 2, DARK)
    for (const x of [-12, 11]) g.box(x, x + 1, 33, HEAD1 + 3, -1, 2, DARK)
    for (const x0 of [-14, 11]) {
      g.box(x0, x0 + 3, 28, 35, -2, 3, c)
      g.box(x0 + (x0 < 0 ? 0 : 2), x0 + (x0 < 0 ? 1 : 3), 29, 34, -1, 2, '#c84a60')
    }
  },
  'flower-crown'(g) {
    const rose = (x, y, z, w = 3, d = 3) => {
      g.box(x, x + w, y, y + 3, z, z + d, '#d23a3a')
      g.set(x + (w >> 1), y + 1, z + d - 1, '#a01e26')
      g.set(x + (w >> 1), y + 2, z + (d >> 1), '#ef6a5e')
    }
    for (const x of [-10, -5, 0, 5]) rose(x + 1, 40, 8, 3, 2)
    for (const z of [-7, -2, 3]) (rose(-13, 40, z, 2, 3), rose(11, 40, z, 2, 3))
    for (const x of [-7, -2, 3]) rose(x, 40, -11, 3, 2)
    const leaf = '#3e8f3e'
    for (const x of [-7, -2, 3, 8]) g.set(x, 41, 8, leaf)
    for (const z of [-4, 1, 6]) (g.set(-12, 41, z, leaf), g.set(11, 41, z, leaf))
  },
  'bear-hat'(g) {
    const c = '#c98a5c'
    hat(g, {
      color: c,
      band: '#a8693f',
      ears: {
        blush: '#e58a7a',
        draw(g) {
          for (const x0 of [-10, 5]) {
            g.box(x0, x0 + 5, HEAD1 + 6, HEAD1 + 9, -3, 1, c)
            g.set(x0, HEAD1 + 8, -3, null)
            g.set(x0 + 4, HEAD1 + 8, -3, null)
            g.box(x0 + 1, x0 + 4, HEAD1 + 6, HEAD1 + 8, 1, 2, '#8e5634')
          }
        },
      },
    })
  },
  'bunny-hat'(g) {
    const c = '#f7f4ef'
    hat(g, {
      color: c,
      band: '#f08aa0',
      ears: {
        blush: '#f6a3b4',
        draw(g) {
          g.box(-8, -4, HEAD1 + 6, HEAD1 + 16, -2, 1, c)
          g.box(-7, -5, HEAD1 + 7, HEAD1 + 15, 1, 2, '#f08aa0')
          g.box(3, 7, HEAD1 + 6, HEAD1 + 11, -2, 1, c)
          g.box(4, 6, HEAD1 + 7, HEAD1 + 10, 1, 2, '#f08aa0')
        },
      },
    })
  },
  'cat-hat'(g) {
    const c = '#aeb0e6'
    hat(g, {
      color: c,
      band: '#9294d2',
      ears: {
        blush: '#8d86d8',
        draw(g) {
          for (const x0 of [-10, 5]) {
            g.box(x0, x0 + 5, HEAD1 + 6, HEAD1 + 7, -3, 1, c)
            g.box(x0 + 1, x0 + 4, HEAD1 + 7, HEAD1 + 8, -3, 1, c)
            g.box(x0 + 2, x0 + 3, HEAD1 + 8, HEAD1 + 9, -3, 1, c)
            g.box(x0 + 2, x0 + 3, HEAD1 + 6, HEAD1 + 8, 1, 2, '#6a5fc0')
          }
        },
      },
    })
  },
  'sun-hat'(g) {
    const c = '#f4f1ea'
    for (let x = -17; x < 17; x++)
      for (let z = -14; z < 13; z++) {
        const e = ((x + 0.5) / 17) ** 2 + ((z + 0.5) / 13.5) ** 2
        if (e > 1) continue
        const ax = Math.abs(x + 0.5)
        const curl = ax > 14 ? 2 : ax > 12 ? 1 : 0 // brim curls up at the sides
        for (let k = 0; k <= curl; k++) g.set(x, 41 + k, z, c)
      }
    g.box(-12, 12, 42, 48, -10, 9, c) // crown
    for (const x of [-12, 11]) for (const z of [-10, 8]) g.box(x, x + 1, 42, 48, z, z + 1, null)
    g.box(-12, 12, 47, 48, -10, 9, (x, y, z) => (x <= -11 || x >= 10 || z <= -9 || z >= 7 ? null : g.has(x, y, z) ? c : null))
    g.box(-3, 3, 47, 48, -7, 6, null) // dent in the crown
    g.box(-12, 12, 42, 43, -10, 9, (x, y, z) => (g.has(x, y, z) && x > -12 ? '#4a2c1d' : null))
  },
}

function backpack(g, B) {
  const c = '#d98b3a'
  const z0 = -B.td / 2
  g.box(-5, 5, HIP + 1, SHOULDER - 1, z0 - 4, z0, c)
  g.box(-3, 3, HIP + 2, HIP + 6, z0 - 5, z0 - 4, '#b96f28')
  g.box(-5, 5, SHOULDER - 2, SHOULDER - 1, z0 - 4, z0, '#b96f28')
  for (const x of [-4, 3]) {
    g.box(x, x + 1, SHOULDER, SHOULDER + 1, z0, -z0, '#5a3a24')
    g.box(x, x + 1, HIP + 3, SHOULDER, -z0, -z0 + 1, '#5a3a24')
  }
}

const HAND_ITEMS = {
  'filter-coffee'(p) {
    p.box(-2, 3, 0, 2, -2, 3, STEEL) // davara
    p.box(-1, 2, 2, 6, -1, 2, STEEL) // tumbler
    p.set(0, 5, 0, '#7a4a2a')
    p.set(0, 6, 0, '#a0714a')
  },
  controller(p) {
    p.box(-3, 3, 0, 2, -1, 1, DARK)
    for (const x of [-3, 2]) p.box(x, x + 1, -1, 0, -1, 1, DARK)
    p.set(-2, 1, 1, WHITE)
    p.set(1, 1, 1, '#e8b33c')
    p.set(2, 0, 1, '#5aa0e0')
  },
  'cricket-bat'(p) {
    p.box(0, 1, -4, 3, 0, 1, '#2b4b8a') // grip
    p.box(-1, 2, -14, -4, 0, 1, '#ead29e')
    p.box(-1, 2, -14, -13, 0, 1, '#d4b47a')
    p.box(-1, 2, -6, -5, 0, 1, '#d94a3a') // sticker
  },
  flowers(p) {
    p.box(0, 1, 0, 4, 0, 1, '#3e8f3e')
    p.box(-1, 2, 1, 2, -1, 2, '#c8323a') // ribbon
    for (const [x, y, z, c] of [
      [-2, 4, -1, '#f08a24'],
      [0, 5, 0, '#f5b52f'],
      [1, 4, -1, '#f08a24'],
      [-1, 6, -1, '#f5c242'],
      [1, 6, 0, '#f08a24'],
    ])
      p.box(x, x + 2, y, y + 2, z, z + 2, c)
  },
  paintbrush(p) {
    p.box(0, 1, -2, 5, 0, 1, '#b5462f')
    p.box(0, 1, 5, 6, 0, 1, STEEL)
    p.box(0, 1, 6, 8, 0, 1, '#3f7fd0')
    p.set(0, 8, 0, '#2f5fb0')
  },
  'ice-cream'(p) {
    p.box(0, 1, 0, 3, 0, 1, '#d9b98a')
    p.box(-1, 2, 3, 8, -1, 1, '#f3d9a4')
    p.box(-1, 2, 7, 8, -1, 1, '#e9a34a')
    p.set(-1, 5, 0, '#7bb661')
    p.set(1, 6, 0, '#7bb661')
  },
  // things that are normally held in both hands, when only one is free
  laptop(p) {
    p.box(0, 1, 0, 7, -4, 4, '#9aa1ab')
    p.box(1, 2, 3, 4, -1, 1, WHITE)
  },
  book(p) {
    p.box(0, 2, 0, 7, -3, 3, '#b5462f')
    p.box(0, 2, 1, 6, 2, 3, WHITE)
  },
}

const CHEST_ITEMS = {
  laptop(p) {
    p.box(-5, 5, 0, 1, -6, 0, '#7f8691')
    p.box(-5, 5, 1, 8, -6, -5, '#9aa1ab')
    p.box(-1, 1, 4, 6, -5, -4, WHITE)
  },
  book(p) {
    p.box(-4, 4, -2, 5, 0, 1, '#b5462f')
    p.box(-3, 3, 3, 4, 1, 2, shiny('#e8b33c'))
    p.box(-1, 1, -2, 5, 0, 1, '#8e3220')
  },
  camera(p) {
    p.box(-3, 3, -2, 2, 0, 2, DARK)
    p.box(-2, 2, -1, 2, 2, 3, '#555b66')
    p.box(-1, 1, 0, 1, 3, 4, '#1a1d24')
    p.set(2, 2, 1, '#d94a3a')
    p.set(-3, 1, 1, WHITE)
  },
  controller(p) {
    HAND_ITEMS.controller(p)
  },
}

const GROUND_ITEMS = {
  plant(p) {
    p.box(-3, 3, 0, 4, -3, 3, '#c4643a')
    p.box(-4, 4, 3, 5, -4, 4, '#b4552e')
    p.box(-3, 3, 4, 5, -3, 3, '#4a2e1f')
    for (const [x, y, z, c] of [
      [-2, 5, -2, '#3e8f3e'],
      [0, 7, -1, '#5aa84f'],
      [-3, 7, 0, '#4b9a45'],
      [1, 5, 0, '#4b9a45'],
      [-1, 9, -1, '#6fbf5a'],
    ])
      p.box(x, x + 3, y, y + 3, z, z + 3, c)
  },
  cat(p) {
    const c = '#e39a52'
    p.box(-2, 3, 0, 4, -2, 2, c)
    p.box(-2, 3, 4, 8, -1, 3, c)
    p.set(-2, 8, 0, c)
    p.set(2, 8, 0, c)
    p.set(-1, 6, 2, '#1c1c22')
    p.set(1, 6, 2, '#1c1c22')
    p.set(0, 5, 2, '#f08aa0')
    p.box(3, 4, 0, 5, -2, -1, (x, y) => (mod(y, 2) ? c : '#c4782f'))
    for (let y = 1; y < 4; y += 2) p.box(-2, 3, y, y + 1, -2, -1, '#c4782f')
  },
  dog(p) {
    const c = '#c9a074'
    p.box(-2, 3, 0, 4, -3, 2, c)
    p.box(-2, 3, 4, 8, -1, 3, c)
    p.box(-1, 2, 4, 6, 3, 4, '#e8d2b0') // snout
    p.set(0, 5, 4, '#1c1c22')
    p.set(-1, 6, 3, '#1c1c22')
    p.set(1, 6, 3, '#1c1c22')
    for (const x of [-3, 3]) p.box(x, x + 1, 4, 8, 0, 2, '#8a6440')
    p.box(0, 1, 2, 5, -4, -3, c)
  },
  handbag(p) {
    const c = '#f2b632'
    p.box(-3, 3, 0, 5, -2, 2, c)
    p.box(-3, 3, 3, 5, 2, 3, '#d99a1f') // flap
    p.set(0, 3, 3, WHITE)
    p.box(-2, -1, 5, 8, 0, 1, c)
    p.box(1, 2, 5, 8, 0, 1, c)
    p.box(-2, 2, 8, 9, 0, 1, c)
  },
}

export function itemAt(g, id, mode, anchors, { L, B, side = -1 } = {}) {
  if (id === 'guitar-strap') {
    // a strap from the right hip over the left shoulder
    for (let y = HIP; y < SHOULDER; y++) {
      const x = Math.round(-B.tw / 2 + ((y - HIP) / (SHOULDER - HIP - 1)) * (B.tw - 1))
      g.set(x, y, B.td / 2, '#4a2c1d')
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
      guitar(at(g, [0, 15, -B.td / 2 - 1], { mx: true, mz: true }))
      return itemAt(g, 'guitar-strap', mode, anchors, { L, B })
    }
    const a = mode === 'chest' ? [1, 16, 5] : [1, 15, B.td / 2]
    guitar(at(g, a))
    if (mode === 'slung') itemAt(g, 'guitar-strap', mode, anchors, { L, B })
    return
  }
  if (mode === 'strap') {
    CHEST_ITEMS.camera(at(g, [0, 15, B.td / 2]))
    for (const x of [-3, 2]) g.box(x, x + 1, 17, SHOULDER, B.td / 2, B.td / 2 + 1, DARK)
    return
  }
  if (mode === 'chest') {
    const fn = CHEST_ITEMS[id] || HAND_ITEMS[id]
    return fn && fn(at(g, id === 'laptop' ? [0, 17, 7] : anchors.chest))
  }
  if (mode === 'tuck') {
    const fn = HAND_ITEMS[id]
    return fn && fn(at(g, anchors.tuck, { mx: side < 0 }))
  }
  if (mode === 'hand' || mode === 'clasp') {
    const fn = HAND_ITEMS[id]
    return fn && fn(at(g, mode === 'clasp' ? anchors.clasp : anchors.hand))
  }
}
