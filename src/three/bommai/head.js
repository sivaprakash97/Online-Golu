import { shiny } from '../voxel/grid.js'
import { shade, mod, HEAD0, HEAD1, HW, HD, FZ } from './dims.js'

// Face and hair, drawn onto the rounded head box (x -20..19, y 46..81, z -16..15). The face is
// pixel art painted onto the front of the head (z = 15, or the frontmost voxel where the head
// rounds off), so it reads as drawn on rather than stuck on. Glasses and the mustache stand one
// voxel proud of it, and the fringe two.

const DARK = '#2a1a17'
const IRIS = '#6b3a2a'
const WHITE = '#ffffff'
const LIP = '#5a2622'
const TONGUE = '#e2707a'
const BLUSH = '#f19a90'

// Paint rows of pixel art (top row first) with their lower-left corner at (x0, y0).
function paintRows(g, x0, y0, rows, palette, mirror = false) {
  rows.forEach((row, r) => {
    const y = y0 + rows.length - 1 - r
    const chars = mirror ? [...row].reverse() : [...row]
    chars.forEach((ch, i) => {
      if (ch !== '.') g.paintFront(x0 + i, y, FZ, palette[ch])
    })
  })
}

// Eyes are drawn 6 wide; `y` is the bottom row.
const EYE_SHAPES = {
  round: { y: 57, rows: ['.dddd.', 'dwwddd', 'dwwddd', 'dddddd', 'ddddwd', 'iiiiii', '.iiii.'] },
  sparkle: { y: 57, rows: ['.ddddd', 'dwwddd', 'dwwdwd', 'ddddwd', 'dddddd', 'iiwiii', '.iiii.'] },
  happy: { y: 59, rows: ['.dddd.', 'dd..dd', 'd....d'] },
  sleepy: { y: 58, rows: ['d....d', 'dd..dd', '.dddd.'] },
  dots: { y: 58, rows: ['..dd..', '.dddd.', '.dddd.', '..dd..'] },
}
const EYE_PAL = { d: DARK, w: WHITE, i: IRIS }

function eye(g, x0, kind, outer) {
  const { y, rows } = EYE_SHAPES[kind]
  // the highlight stays on the same side for both eyes; only the lash flips to the outside
  paintRows(g, x0, y, rows, EYE_PAL, kind === 'sparkle' && outer < 0)
}

const MOUTHS = {
  smile: ['d....d', '.dddd.'],
  open: ['dddddd', 'dttttd', '.dttd.'],
}

function hairTone(cfg, L) {
  return cfg.hair === 'bald' ? shade(L.skin, -0.3) : L.hair
}

export function faceOn(g, cfg, L) {
  const ex = cfg.face_extras || []
  const kind = cfg.face
  // eyes: viewer's left is the doll's right (-x)
  eye(g, -14, kind === 'wink' ? 'round' : kind, -1)
  eye(g, 8, kind === 'wink' ? 'happy' : kind, 1)

  // a soft nose and a small mouth
  g.paintFront(-1, 55, FZ, shade(L.skin, -0.08))
  g.paintFront(0, 55, FZ, shade(L.skin, -0.08))
  const mouth = kind === 'happy' || kind === 'sparkle' ? 'open' : 'smile'
  const rows = MOUTHS[mouth]
  paintRows(g, -3, 53 - rows.length, rows, { d: LIP, t: TONGUE })

  if (ex.includes('blush'))
    for (const x0 of [-16, 10])
      for (let y = 53; y < 56; y++)
        for (let x = x0; x < x0 + 6; x++) {
          const corner = (y === 53 || y === 55) && (x === x0 || x === x0 + 5)
          if (!corner) g.paintFront(x, y, FZ, BLUSH)
        }

  // ears
  for (const x of [-HW - 1, HW]) g.rounded(x, x + 1, 55, 63, -2, 3, 1, L.skin)

  if (ex.includes('bindi')) g.box(-1, 1, 67, 70, FZ, FZ + 1, (x, y) => (y === 69 && x === 0 ? null : '#c21f32'))
  if (ex.includes('namam')) {
    for (const y of [65, 67, 69]) for (let x = -7; x < 7; x++) g.paintFront(x, y, FZ, '#f7f3ea')
    for (const y of [66, 67]) for (const x of [-1, 0]) g.paintFront(x, y, FZ, '#c21f32')
  }
  if (ex.includes('nosering')) (g.set(1, 55, FZ + 1, shiny('#e8b33c')), g.set(2, 54, FZ + 1, shiny('#e8b33c')))
  const hairC = hairTone(cfg, L)
  if (ex.includes('beard')) {
    // along the jaw and chin, leaving the mouth clear, with sideburns up the cheeks
    for (let y = HEAD0; y < 53; y++)
      for (let x = -HW; x < HW; x++) {
        const mouthHole = y >= 48 && x >= -5 && x < 5
        const cheek = y >= 49 && Math.abs(x + 0.5) < 12
        if (!mouthHole && !cheek) g.paintFront(x, y, FZ, hairC)
      }
    for (let y = HEAD0; y < 60; y++) for (let z = -6; z < HD; z++) for (const x of [-HW, HW - 1]) g.paint(x, y, z, hairC)
    g.rounded(-9, 9, HEAD0 - 3, HEAD0 + 2, 6, HD + 1, 2.5, hairC) // chin
  }
  if (ex.includes('mustache')) {
    // a little handlebar, its ends curling up
    for (let x = -4; x < 4; x++) (g.set(x, 53, FZ + 1, hairC), g.set(x, 54, FZ + 1, hairC))
    for (const [x, y] of [[-5, 53], [-6, 54], [-7, 55], [4, 53], [5, 54], [6, 55]]) g.set(x, y, FZ + 1, hairC)
  }
  const frames = (f, lens) => {
    for (const x0 of [-16, 6]) {
      const x1 = x0 + 10
      for (let x = x0; x < x1; x++)
        for (let y = 55; y < 66; y++) {
          const edge = x === x0 || x === x1 - 1 || y === 55 || y === 65
          const corner = (x === x0 || x === x1 - 1) && (y === 55 || y === 65)
          if (edge && !corner) g.set(x, y, FZ + 1, f)
          else if (!edge && lens) g.set(x, y, FZ + 1, lens(x, y))
        }
    }
    g.box(-6, 6, 61, 62, FZ + 1, FZ + 2, f) // bridge
    for (const x of [-HW - 1, HW]) g.box(x, x + 1, 61, 62, 0, FZ + 2, f) // temples
    for (const x of [-HW, HW - 1]) g.box(x, x + 1, 61, 62, FZ - 2, FZ + 2, f)
  }
  if (ex.includes('glasses')) frames('#3a2a24')
  if (ex.includes('shades')) frames('#1c1b20', (x, y) => ((x === -14 || x === 8) && (y === 63 || y === 62) ? '#6a6a7e' : '#141418'))
}

// ── hair ────────────────────────────────────────────────────────────────────
// A shell two voxels thick around the head, cut away to show the face. It is built from slabs
// four voxels tall that alternate in tone (and, on longer styles, step out a voxel), which gives
// the layered, stacked look. `fringe(x)` is the lowest row of the fringe at column x.
const clump = (x, w = 6) => [3, 1, 0, 0, 1, 3][Math.floor((mod(x + 3, w) * 6) / w)]
const FRINGES = {
  centre: (x) => 80 - Math.floor(Math.abs(x + 0.5) * 0.55),
  centreHigh: (x) => 81 - Math.floor(Math.abs(x + 0.5) * 0.35),
  straight: (x) => 70 + clump(x),
  short: (x) => 75 + clump(x),
  side: (x) => (x < 6 ? 69 + Math.floor((x + 22) / 4) : 81 - Math.floor((x - 6) / 3)),
  jagged: (x) => 71 + [4, 2, 0, 1, 3][mod(x, 5)],
  curls: (x) => 73 + [2, 1, 0, 0, 1, 2, 3, 3][mod(x, 8)],
}

const STYLES = {
  'short-crop': { fringe: 'short', side: 66, back: 54 },
  'side-part': { fringe: 'side', side: 62, back: 52 },
  spiky: { fringe: 'jagged', side: 66, back: 54, spikes: true },
  curly: { fringe: 'curls', side: 58, back: 50, curls: true },
  'long-straight': { fringe: 'centre', side: 28, back: 28, long: true },
  'long-wavy': { fringe: 'centre', side: 26, back: 26, long: true, wavy: true },
  braid: { fringe: 'centre', side: 60, back: 52, braid: true },
  'top-bun': { fringe: 'centreHigh', side: 64, back: 54, bun: 'top' },
  'low-bun': { fringe: 'centre', side: 62, back: 52, bun: 'low' },
  ponytail: { fringe: 'centreHigh', side: 64, back: 56, tail: true },
  puffs: { fringe: 'straight', side: 66, back: 56, puffs: true },
}

const JASMINE = '#fbfbf0'

export function hairOn(g, cfg, L) {
  const st = STYLES[cfg.hair]
  if (!st) return
  const c = L.hair
  const dark = shade(c, -0.07)
  const light = shade(c, 0.06)
  const slab = (y) => mod(Math.floor((HEAD1 + 3 - y) / 4), 2) // 0/1 alternating every four rows
  const tone = (y) => (slab(y) ? dark : c)
  const fr = FRINGES[st.fringe]
  const lock = Math.max(st.side, 52) // how far down the hair frames the sides of the face

  // the shell: everything just outside the head, kept where this style has hair
  g.rounded(-HW - 2, HW + 2, HEAD0, HEAD1 + 3, -HD - 2, HD + 2, 6, (x, y, z) => {
    if (g.has(x, y, z)) return null
    if (y >= HEAD1) return y === HEAD1 + 2 ? light : c
    // which side of the head this voxel lies off: front, back or the sides
    const fx = Math.abs(x + 0.5) - HW
    const fz = z + 0.5 - HD
    const bz = -(z + 0.5) - HD
    if (fx < 0 && fz < 0 && bz < 0 && y < HEAD0 + 5) return null // under the rounded jaw
    if (fz >= fx && fz >= bz) {
      const atSide = x < -HW + 4 || x >= HW - 4
      if (atSide && y >= lock) return tone(y)
      return y >= fr(x) ? c : null
    }
    if (bz >= fx) return y >= st.back ? tone(y) : null
    return y >= st.side ? tone(y) : null
  })
  if (st.curls)
    for (let x = -18; x < 18; x += 5)
      for (let z = -14; z < 14; z += 5) g.rounded(x, x + 4, HEAD1 + 2, HEAD1 + 5, z + mod(x, 2), z + 4 + mod(x, 2), 1.2, light)
  if (st.spikes)
    for (let x = -18; x < 18; x += 6)
      for (let z = -14; z < 14; z += 7) {
        const h = 4 + mod(x * 3 + z, 4) * 2
        for (let k = 0; k < h; k++) {
          const w = k < h / 2 ? 0 : 1
          g.box(x + w, x + 5 - w, HEAD1 + 2 + k, HEAD1 + 3 + k, z + w, z + 5 - w, k === h - 1 ? light : c)
        }
      }

  // longer styles step out a voxel on every other slab
  if (st.long || st.curls)
    for (let y = Math.max(st.side, HEAD0); y < HEAD1; y++) {
      if (!slab(y)) continue
      for (const x of [-HW - 3, HW + 2]) g.box(x, x + 1, y, y + 1, -HD - 1, HD - 2, tone(y))
      g.box(-HW - 1, HW + 1, y, y + 1, -HD - 3, -HD - 2, tone(y))
    }
  if (st.curls)
    for (let y = st.side; y < HEAD1; y += 4)
      for (let z = -14; z < 12; z += 5) for (const x of [-HW - 3, HW + 2]) g.box(x, x + 1, y + 1, y + 3, z + mod(y, 3), z + 2 + mod(y, 3), light)

  // shoulder-length and longer hair below the head, behind the shoulders
  if (st.side < HEAD0)
    for (let y = st.side; y < HEAD0; y++) {
      const w = st.wavy ? [0, 1, 1, 0][mod(y >> 1, 4)] : slab(y)
      const tip = y < st.side + 2 ? 1 : 0
      g.box(-HW - 2 - w + tip, -15, y, y + 1, -HD - 2 - w + tip, -4, tone(y))
      g.box(14, HW + 2 + w - tip, y, y + 1, -HD - 2 - w + tip, -4, tone(y))
      g.box(-15, 15, y, y + 1, -HD - 2 - w + tip, -9, tone(y))
    }

  if (st.bun === 'top') {
    g.rounded(-6, 6, HEAD1 + 1, HEAD1 + 4, -8, 4, 2, shiny('#f2c53d'))
    g.ellipsoid(0, HEAD1 + 8, -2, 7, 6, 6.5, (x, y) => (y < HEAD1 + 8 && mod(x + y, 7) === 0 ? dark : c))
  }
  if (st.bun === 'low') {
    g.ellipsoid(-0.5, 58, -HD - 5, 8, 7, 5, (x, y) => (mod(x - y, 6) === 0 ? dark : c))
    // a ring of jasmine round it
    for (let a = 0; a < 16; a++) {
      const t = (a / 16) * Math.PI * 2
      g.set(Math.round(-0.5 + Math.cos(t) * 8.4), Math.round(58 + Math.sin(t) * 7.4), -HD - 6, JASMINE)
    }
  }
  if (st.tail) {
    g.rounded(-3, 3, 68, 73, -HD - 5, -HD - 1, 1.5, shiny('#e8b33c'))
    for (let y = 34; y < 70; y++) {
      const r = y < 40 ? 2 + (y - 34) / 6 : 3.4
      const zc = -HD - 4 - (y < 52 ? (52 - y) / 9 : 0)
      g.ellipsoid(-0.5, y + 0.5, zc, r, 0.6, r * 0.9, tone(y))
    }
  }
  if (st.braid) {
    for (let y = 16; y < 54; y++) {
      const off = mod(Math.floor(y / 5), 2) ? 1 : -1
      g.rounded(-3 + off, 3 + off, y, y + 1, -HD - 6, -HD - 1, 1.5, mod(y, 5) === 0 ? dark : c)
    }
    for (let y = 44; y < 56; y += 2) for (const x of [-5, 4]) g.set(x, y, -HD - 4, JASMINE)
    for (let x = -4; x < 4; x++) g.set(x, 55, -HD - 5, JASMINE)
    g.rounded(-2, 2, 8, 16, -HD - 5, -HD - 1, 1.5, (x, y) => (y >= 14 ? shiny('#e8b33c') : shiny('#c8323a'))) // kunjalam tassel
  }
  if (st.puffs)
    for (const s of [-1, 1]) {
      g.ellipsoid(s * 17 - 0.5, HEAD1 - 1, -2, 7, 6.5, 6.5, c)
      g.rounded(s > 0 ? 10 : -12, s > 0 ? 12 : -10, HEAD1 - 4, HEAD1 + 1, -4, 1, 1, shiny('#e8b33c'))
    }
}
