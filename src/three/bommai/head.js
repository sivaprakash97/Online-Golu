import { shiny } from '../voxel/grid.js'
import { shade, mod, HEAD0, HEAD1 } from './dims.js'

// Face and hair, drawn onto the head box (x -10..9, y 23..40, z -8..7). The face is pixel art
// painted on the front layer (z = 7); glasses and the nose stand one voxel proud of it (z = 8),
// and the fringe hangs in that same front layer.

const FZ = 7
const DARK = '#2a1a17'
const IRIS = '#5b3226'
const WHITE = '#ffffff'
const BLUSH = '#ef8f86'

function paintRows(g, x0, rows, palette, z = FZ, proud = false) {
  // rows: top to bottom strings; '.' = leave alone
  rows.forEach((row, r) => {
    const y = rows.y0 + rows.length - 1 - r
    for (let i = 0; i < row.length; i++) {
      const ch = row[i]
      if (ch === '.') continue
      if (proud) g.set(x0 + i, y, z, palette[ch])
      else g.paint(x0 + i, y, z, palette[ch])
    }
  })
}
const at = (y0, rows) => Object.assign(rows, { y0 })

const EYE_SHAPES = {
  // 4 wide, eyes sit on y 29..32
  round: at(29, ['.dd.', 'dwdd', 'iiii', '.ii.']),
  sparkle: at(28, ['.dd.', 'dwdd', 'ddwd', 'iiii', '.bb.']),
  happy: at(30, ['.dd.', 'd..d']),
  sleepy: at(29, ['d..d', '.dd.']),
  dots: at(29, ['dd', 'dd']),
}

function eye(g, x0, kind, mirror) {
  const shape = EYE_SHAPES[kind]
  const rows = mirror ? at(shape.y0, shape.map((r) => [...r].reverse().join(''))) : shape
  const pal = { d: DARK, w: WHITE, i: IRIS, b: '#6f93c4' }
  paintRows(g, kind === 'dots' ? x0 + 1 : x0, rows, pal)
}

export function faceOn(g, cfg, L) {
  const ex = cfg.face_extras || []
  const kind = cfg.face
  // eyes: viewer's left is the doll's right (-x)
  const right = kind === 'wink' ? 'round' : kind
  const left = kind === 'wink' ? 'happy' : kind
  eye(g, -7, right, false)
  eye(g, 3, left, true)

  // cheeks only when "Rosy cheeks" is picked; nose and a small open smile always
  if (ex.includes('blush')) {
    const bw = 3
    for (let y = 26; y < 28; y++)
      for (let i = 0; i < bw; i++) {
        g.paint(-5 - bw + i, y, FZ, BLUSH)
        g.paint(5 + i, y, FZ, BLUSH)
      }
    for (let y = 26; y < 28; y++) for (const x of [-10, 9]) g.paint(x, y, FZ - 1, BLUSH) // wraps a little round the side
  }
  g.set(-1, 28, FZ + 1, shade(L.skin, -0.04))
  g.set(0, 28, FZ + 1, shade(L.skin, -0.04))
  for (let x = -2; x < 2; x++) g.paint(x, 26, FZ, '#7c1d22')
  for (let x = -1; x < 1; x++) g.paint(x, 25, FZ, '#d9474b')

  // ears
  for (const x of [-11, 10]) g.box(x, x + 1, 28, 32, -1, 2, L.skin)

  if (ex.includes('bindi')) (g.paint(-1, 35, FZ, '#c21f32'), g.paint(0, 35, FZ, '#c21f32'))
  if (ex.includes('namam')) {
    for (const y of [33, 35]) for (let x = -5; x < 5; x++) g.paint(x, y, FZ, '#f7f3ea')
    g.paint(-1, 34, FZ, '#c21f32')
    g.paint(0, 34, FZ, '#c21f32')
  }
  if (ex.includes('nosering')) g.set(1, 27, FZ + 1, shiny('#e8b33c'))
  const hairC = cfg.hair === 'bald' ? shade(L.skin, -0.3) : L.hair
  if (ex.includes('mustache')) {
    for (let x = -3; x < 3; x++) g.set(x, 27, FZ + 1, hairC)
    g.set(-3, 26, FZ + 1, hairC)
    g.set(2, 26, FZ + 1, hairC)
  }
  if (ex.includes('beard')) {
    for (let y = HEAD0; y < 26; y++) for (let x = -10; x < 10; x++) if (!(y === 25 && x >= -1 && x < 1)) g.paint(x, y, FZ, hairC)
    for (let y = HEAD0; y < 30; y++) for (let z = -6; z < FZ; z++) for (const x of [-10, 9]) g.paint(x, y, z, hairC)
    g.box(-6, 6, HEAD0 - 1, HEAD0, 2, 8, hairC) // chin
  }
  if (ex.includes('glasses')) {
    const f = '#e6cf93'
    for (const x0 of [-8, 2]) {
      for (let x = x0; x < x0 + 6; x++) (g.set(x, 28, FZ + 1, f), g.set(x, 33, FZ + 1, f))
      for (let y = 28; y < 34; y++) (g.set(x0, y, FZ + 1, f), g.set(x0 + 5, y, FZ + 1, f))
    }
    g.box(-2, 2, 32, 33, FZ + 1, FZ + 2, f)
    for (const x of [-11, 10]) g.box(x, x + 1, 32, 33, -1, FZ + 2, f)
  }
  if (ex.includes('shades')) {
    const f = '#f7f5f0'
    for (const x0 of [-9, 2]) {
      g.box(x0 + 1, x0 + 6, 28, 33, FZ + 1, FZ + 2, '#141418')
      for (let x = x0 + 1; x < x0 + 6; x++) (g.set(x, 27, FZ + 1, f), g.set(x, 33, FZ + 1, f))
      for (let y = 28; y < 33; y++) (g.set(x0, y, FZ + 1, f), g.set(x0 + 6, y, FZ + 1, f))
      g.set(x0 + 2, 31, FZ + 1, '#55556a') // glint
    }
    g.box(-2, 2, 31, 32, FZ + 1, FZ + 2, f)
    for (const x of [-11, 10]) g.box(x, x + 1, 31, 32, -1, FZ + 2, f)
  }
}

// ── hair ────────────────────────────────────────────────────────────────────
// Built from slabs two voxels tall that alternately step out a voxel, which gives the layered,
// stacked look of the references. `fringe(x)` is the lowest row of the fringe at column x.
const FRINGES = {
  centre: (x) => 40 - Math.floor(Math.abs(x + 0.5) * 0.55),
  centreHigh: (x) => 40 - Math.floor(Math.abs(x + 0.5) * 0.35),
  straight: (x) => 36 + (mod(x, 3) === 0 ? 1 : 0),
  short: (x) => 38 + (mod(x, 3) === 0 ? 1 : 0),
  side: (x) => (x < 3 ? 35 + Math.floor((x + 11) / 5) : 40 - Math.floor((x - 3) / 3)),
  jagged: (x) => 36 + mod(x, 3),
  curls: (x) => 37 + (mod(x >> 1, 2) ? 1 : 0),
}

const STYLES = {
  'short-crop': { fringe: 'short', side: 33, back: 27 },
  'side-part': { fringe: 'side', side: 31, back: 26 },
  spiky: { fringe: 'jagged', side: 33, back: 27, spikes: true },
  curly: { fringe: 'curls', side: 29, back: 25, curls: true },
  'long-straight': { fringe: 'centre', side: 14, back: 14, long: true },
  'long-wavy': { fringe: 'centre', side: 13, back: 13, long: true, wavy: true },
  braid: { fringe: 'centre', side: 30, back: 26, braid: true },
  'top-bun': { fringe: 'centreHigh', side: 32, back: 27, bun: 'top' },
  'low-bun': { fringe: 'centre', side: 31, back: 26, bun: 'low' },
  ponytail: { fringe: 'centreHigh', side: 32, back: 28, tail: true },
  puffs: { fringe: 'straight', side: 33, back: 28, puffs: true },
}

function roundedBlock(g, x0, x1, y0, y1, z0, z1, c) {
  g.box(x0, x1, y0, y1, z0, z1, c)
  for (const x of [x0, x1 - 1]) for (const y of [y0, y1 - 1]) for (const z of [z0, z1 - 1]) g.set(x, y, z, null)
}

export function hairOn(g, cfg, L) {
  const st = STYLES[cfg.hair]
  if (!st) return
  const c = L.hair
  const dark = shade(c, -0.06)
  const light = shade(c, 0.05)
  const slab = (y) => Math.floor((HEAD1 + 1 - y) / 2) % 2 // 0/1 alternating every two rows
  const tone = (y) => (slab(y) ? dark : c)

  // cap over the top, rounded at its upper edge
  g.box(-11, 11, HEAD1, HEAD1 + 2, -9, 9, (x, y) => (y === HEAD1 + 1 ? light : c))
  for (let x = -11; x < 11; x++) for (const z of [-9, 8]) g.set(x, HEAD1 + 1, z, null)
  for (let z = -9; z < 9; z++) for (const x of [-11, 10]) g.set(x, HEAD1 + 1, z, null)
  if (st.curls) for (let x = -10; x < 10; x += 3) for (let z = -8; z < 8; z += 3) g.box(x, x + 2, HEAD1 + 2, HEAD1 + 3, z, z + 2, light)
  if (st.spikes)
    for (let x = -10; x < 10; x += 3)
      for (let z = -8; z < 8; z += 4) {
        const h = 2 + mod(x + z, 3)
        g.box(x, x + 2, HEAD1 + 2, HEAD1 + 2 + h, z, z + 2, (xx, y) => (y === HEAD1 + 1 + h ? light : c))
      }

  // sides and back of the head, slab by slab
  const step = st.long || st.curls
  for (let y = Math.max(st.side, HEAD0); y < HEAD1; y++) {
    const out = step && slab(y) ? 1 : 0
    for (const x of [-11 - out, 10 + out]) g.box(x, x + 1, y, y + 1, -9, 9, tone(y))
    if (out) for (const x of [-11, 10]) g.box(x, x + 1, y, y + 1, -9, 9, tone(y))
  }
  for (let y = Math.max(st.back, HEAD0); y < HEAD1; y++) {
    const out = step && slab(y) ? 1 : 0
    g.box(-11, 11, y, y + 1, -9 - out, -8, tone(y))
  }
  // nape / shoulder-length hair below the head, behind the shoulders
  if (st.side < HEAD0) {
    for (let y = st.side; y < HEAD0; y++) {
      const w = st.wavy ? [0, 1, 1, 0][mod(y, 4)] : slab(y)
      const tip = y === st.side ? 1 : 0
      g.box(-11 - w + tip, -8, y, y + 1, -9 - w + tip, -1, tone(y))
      g.box(8, 11 + w - tip, y, y + 1, -9 - w + tip, -1, tone(y))
      g.box(-8, 8, y, y + 1, -9 - w + tip, -4, tone(y))
    }
  }
  if (st.curls) for (let y = st.side; y < HEAD1; y += 2) for (let z = -8; z < 8; z += 3) for (const x of [-12, 11]) g.set(x, y, z + mod(y, 3), light)

  // fringe, in the front layer just proud of the face
  const fr = FRINGES[st.fringe]
  for (let x = -11; x < 11; x++) {
    const lowest = x === -11 || x === 10 ? st.side : fr(x)
    for (let y = Math.max(lowest, HEAD0); y < HEAD1 + 1; y++) g.set(x, y, 8, c)
  }
  // frame the face with the side locks for longer styles
  if (st.side <= 31) for (const x of [-10, 9]) for (let y = Math.max(st.side, HEAD0); y < 37; y++) g.set(x, y, 8, tone(y))

  // extras
  if (st.bun === 'top') {
    roundedBlock(g, -4, 4, HEAD1 + 2, HEAD1 + 7, -5, 2, c)
    g.box(-4, 4, HEAD1 + 2, HEAD1 + 3, -5, 2, shiny('#f2c53d'))
  }
  if (st.bun === 'low') {
    roundedBlock(g, -4, 4, 25, 31, -13, -9, c)
    for (let x = -4; x < 4; x += 2) (g.set(x, 31, -11, '#fbfbf0'), g.set(x + 1, 24, -11, '#fbfbf0'))
    for (let y = 25; y < 31; y += 2) (g.set(-5, y, -11, '#fbfbf0'), g.set(4, y + 1, -11, '#fbfbf0'))
  }
  if (st.tail) {
    for (let y = 18; y < 37; y++) {
      const w = y < 21 ? 1 : 2
      g.box(-w, w, y, y + 1, -13, -9, tone(y))
    }
    g.box(-2, 2, 34, 36, -10, -8, shiny('#e8b33c'))
  }
  if (st.braid) {
    for (let y = 8; y < 26; y++) {
      const off = mod(Math.floor(y / 3), 2) ? 1 : 0
      g.box(-2 + off, 2 + off, y, y + 1, -11, -9, mod(y, 3) === 0 ? dark : c)
    }
    for (let y = 22; y < 27; y++) for (const x of [-3, 3]) if (mod(y, 2)) g.set(x, y, -10, '#fbfbf0') // jasmine
    for (let x = -2; x < 3; x++) g.set(x, 26, -11, '#fbfbf0')
    g.box(-1, 2, 5, 8, -11, -9, shiny('#c8323a')) // kunjalam tassel
  }
  if (st.puffs) {
    for (const x0 of [-13, 7]) {
      roundedBlock(g, x0, x0 + 6, HEAD1 - 2, HEAD1 + 4, -5, 2, c)
      g.box(x0 + (x0 < 0 ? 5 : 0), x0 + (x0 < 0 ? 6 : 1), HEAD1 - 1, HEAD1 + 1, -3, 0, shiny('#e8b33c'))
    }
  }
}
