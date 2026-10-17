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
    // under a hijab the temples tuck in at the edge of the face
    if (L.hijab) return g.box(-17, 17, 61, 62, FZ + 1, FZ + 2, (x) => (x === -17 || x === 16 ? f : null))
    for (const x of [-HW - 1, HW]) g.box(x, x + 1, 61, 62, 0, FZ + 2, f) // temples
    for (const x of [-HW, HW - 1]) g.box(x, x + 1, 61, 62, FZ - 2, FZ + 2, f)
  }
  if (ex.includes('glasses')) frames('#3a2a24')
  if (ex.includes('shades')) frames('#1c1b20', (x, y) => ((x === -14 || x === 8) && (y === 63 || y === 62) ? '#6a6a7e' : '#141418'))
}

// ── hair ────────────────────────────────────────────────────────────────────
// Bommais are seen from the front, so every style is told apart by what shows from there: the
// fringe, how far the sides come down, the silhouette above and beside the head, and hair
// brought forward over the shoulders. The base is a shell two voxels thick around the head, cut
// away to show the face, in slabs four voxels tall that alternate in tone.
const clump = (x, w = 6) => [3, 1, 0, 0, 1, 3][Math.floor((mod(x + 3, w) * 6) / w)]
const FRINGES = {
  centre: (x) => 80 - Math.floor(Math.abs(x + 0.5) * 0.55), // a middle parting, no bangs
  sleek: (x) => 81 - Math.floor(Math.abs(x + 0.5) * 0.2), // pulled back, the whole forehead clear
  centreHigh: (x) => 81 - Math.floor(Math.abs(x + 0.5) * 0.35),
  blunt: (x) => (Math.abs(x + 0.5) > 15 ? 69 : 70), // straight-cut bangs
  straight: (x) => 70 + clump(x),
  short: (x) => 75 + clump(x),
  side: (x) => (x < 6 ? 69 + Math.floor((x + 22) / 4) : 81 - Math.floor((x - 6) / 3)),
  jagged: (x) => 68 + [5, 2, 0, 2, 5][mod(x, 5)],
  curls: (x) => 76 + [2, 1, 0, 0, 1, 2][mod(x, 6)],
}

const STYLES = {
  'short-crop': { fringe: 'short', side: 64, back: 54 },
  'side-part': { fringe: 'side', side: 60, back: 52, quiff: true },
  spiky: { fringe: 'jagged', side: 66, back: 54, spikes: true },
  curly: { fringe: 'curls', side: 52, back: 48, curls: true },
  'long-straight': { fringe: 'blunt', side: 26, back: 24, curtains: 'straight' },
  'long-wavy': { fringe: 'centre', side: 22, back: 20, curtains: 'wavy', step: true },
  braid: { fringe: 'centre', side: 58, back: 50, braid: 'one' },
  'twin-braids': { fringe: 'centre', side: 58, back: 50, braid: 'two' },
  'top-bun': { fringe: 'centreHigh', side: 64, back: 54, bun: 'top' },
  'low-bun': { fringe: 'sleek', side: 58, back: 50, bun: 'low' },
  ponytail: { fringe: 'side', side: 64, back: 56, tail: true },
  puffs: { fringe: 'straight', side: 66, back: 56, puffs: true },
}

const JASMINE = '#fbfbf0'
const RIBBON = '#d9374b'

// A chain of balls between the given points: ponytails and the like. Points are [x, y, z, r].
function chain(g, pts, color) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]]
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])))
    for (let k = 0; k <= n; k++) {
      const t = k / n
      const [x, y, z, r] = a.map((v, j) => v + (b[j] - v) * t)
      g.ellipsoid(x, y, z, r, r, r, (xx, yy, zz) => (g.has(xx, yy, zz) ? null : color(i + t, yy)))
    }
  }
}

// A plait hanging down the front of a shoulder, from y0 down to y1, centred on column xc.
function plait(g, xc, y0, y1, w, c, dark) {
  for (let y = y1; y < y0; y++) {
    const off = mod(Math.floor(y / 4), 2) ? 1 : -1
    const ww = y < y1 + 3 ? w - 2 : w // tapering at the end
    const x0 = Math.round(xc - ww / 2 + off * 0.6)
    g.rounded(x0, x0 + ww, y, y + 1, 4, 10, 1.5, mod(y, 4) === 0 ? dark : c, true)
  }
}

// Hair falling in front of both shoulders, down to `bottom`.
function curtains(g, kind, bottom, tone) {
  for (let y = bottom; y < HEAD0 + 2; y++) {
    const wavy = kind === 'wavy'
    const wave = wavy ? Math.round(Math.sin(y / 4) * 1.5) : 0
    const flare = wavy && y < bottom + 8 ? 2 : 0
    const tip = y === bottom ? 1 : 0
    const xi = 12 + wave + tip
    const xo = 21 + wave + flare - tip
    const z0 = y > HEAD0 - 6 ? 1 : 2
    for (const s of [-1, 1]) g.box(s > 0 ? xi : -xo, s > 0 ? xo : -xi, y, y + 1, z0, 10 - tip, (x, yy, z) => (g.has(x, yy, z) ? null : tone(yy)))
  }
}

// A hijab, wrapped close around the head and under it, framing the face in an oval. It stands two
// voxels proud of the face, like the hair; below the head it meets the part over the neck and
// shoulders, which is drawn with the body (build.js).
function hijabOn(g, L) {
  const c = L.hijab
  const fold = shade(c, -0.06)
  g.rounded(-HW - 2, HW + 2, HEAD0 - 1, HEAD1 + 3, -HD - 2, HD + 2, 6, (x, y, z) => {
    if (g.has(x, y, z)) return null
    const face = ((x + 0.5) / 17) ** 2 + ((y + 0.5 - 61) / 13.5) ** 2 < 1
    if (z >= HD && face) return null
    return mod(x - y, 7) === 0 ? fold : c
  })
}

export function hairOn(g, cfg, L, { hatted = false } = {}) {
  if (L.hijab) return hijabOn(g, L)
  const st = STYLES[cfg.hair]
  if (!st) return
  const c = L.hair
  const dark = shade(c, -0.08)
  const light = shade(c, 0.07)
  const slab = (y) => mod(Math.floor((HEAD1 + 3 - y) / 4), 2) // 0/1 alternating every four rows
  const tone = (y) => (slab(y) ? dark : c)
  const fr = FRINGES[st.fringe]
  const lock = Math.max(st.side, 52) // how far down the hair frames the sides of the face
  const free = (col) => (x, y, z) => (g.has(x, y, z) ? null : typeof col === 'function' ? col(x, y, z) : col)

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

  // hair down the back, behind the shoulders
  if (st.side < HEAD0)
    for (let y = st.back; y < HEAD0; y++) {
      const w = st.step ? [0, 1, 1, 0][mod(y >> 1, 4)] : 0
      const tip = y < st.back + 2 ? 1 : 0
      g.box(-HW - 2 - w + tip, HW + 2 + w - tip, y, y + 1, -HD - 2 - w + tip, -4, free(tone))
    }
  if (st.curtains) curtains(g, st.curtains, st.side, tone)
  if (st.step)
    for (let y = HEAD0; y < HEAD1; y++)
      if (slab(y)) for (const x of [-HW - 3, HW + 2]) g.box(x, x + 1, y, y + 1, -HD - 1, HD - 2, tone(y))

  if (st.quiff && !hatted) g.ellipsoid(8, HEAD1 + 2, 8, 13, 7, 10, free((x, y) => (y >= HEAD1 + 6 ? light : mod(y, 4) < 2 ? c : dark)))

  if (st.spikes && !hatted)
    // tall pyramids of hair, the front row leaning forward over the face
    for (const [xc, zc, h] of [
      [-15, -9, 16],
      [-5, -9, 18],
      [5, -9, 18],
      [15, -9, 16],
      [-19, 3, 14],
      [-10, 3, 20],
      [0, 3, 22],
      [10, 3, 20],
      [19, 3, 14],
      [-13, 13, 13],
      [-4, 13, 15],
      [5, 13, 15],
      [14, 13, 13],
    ])
      for (let k = 0; k < h; k++) {
        const inset = Math.floor((k * 5) / h)
        const lean = zc > 8 ? Math.floor(k / 3) : zc < 0 ? -Math.floor(k / 5) : 0
        g.box(xc - 5 + inset, xc + 5 - inset, HEAD1 + 1 + k, HEAD1 + 2 + k, zc - 4 + inset + lean, zc + 5 - inset + lean, k >= h - 3 ? light : mod(k, 6) < 3 ? c : dark)
      }

  if (st.curls) {
    // a cloud of curls, wider than the head all round, with curls over the forehead
    const ball = (x, y, z) => g.ellipsoid(x, y, z, 4.8, 4.8, 4.8, free((xx, yy, zz) => (Math.hypot(xx + 0.5 - x, yy + 0.5 - y, zz + 0.5 - z) > 3.6 ? dark : c)))
    for (let y = 52; y <= HEAD1; y += 6) {
      const ax = HW + 3
      const az = HD + 3
      for (let x = -ax; x <= ax; x += 6.5) {
        ball(x, y, -az)
        if (y >= 76 || Math.abs(x) > HW - 3) ball(x, y, az) // over the forehead and at the temples
      }
      for (let z = -az; z <= az; z += 6.5) for (const x of [-ax, ax]) ball(x, y, z)
    }
    if (!hatted) for (let x = -HW; x <= HW; x += 7) for (let z = -HD; z <= HD; z += 7) ball(x, HEAD1 + 2, z)
  }

  if (st.braid === 'one') {
    // one thick braid brought forward over the left shoulder, strung with jasmine
    plait(g, 14, HEAD0 + 4, 18, 9, c, dark)
    for (let y = 22; y < HEAD0 + 3; y += 3) for (const x of [13, 14]) g.set(x + mod(y, 2), y, 10, JASMINE)
    g.rounded(10, 18, 16, 19, 4, 10, 1, shiny('#e8b33c')) // kunjalam
    g.ellipsoid(13.5, 12, 7, 3.6, 4.5, 3, shiny('#c8323a'))
  }
  if (st.braid === 'two')
    for (const s of [-1, 1]) {
      const xc = s * 16 - 0.5
      plait(g, xc, HEAD0 + 4, 24, 7, c, dark)
      for (const d of [-1, 1]) g.ellipsoid(xc + d * 3, 22, 9, 2.6, 2, 1.6, RIBBON) // ribbon bow
      g.rounded(Math.round(xc) - 1, Math.round(xc) + 1, 21, 23, 8, 11, 0.6, shade(RIBBON, -0.15))
    }

  if (st.bun === 'top' && !hatted) {
    g.rounded(-7, 7, HEAD1 + 1, HEAD1 + 4, -8, 6, 2, shiny('#f2c53d'))
    g.ellipsoid(-0.5, HEAD1 + 10, -1, 9, 8, 8.5, (x, y) => (y < HEAD1 + 10 && mod(x + y, 7) === 0 ? dark : c))
    for (let a = 0; a < 14; a++) {
      const t = (a / 14) * Math.PI * 2
      g.set(Math.round(-0.5 + Math.cos(t) * 9.2), HEAD1 + 5, Math.round(-1 + Math.sin(t) * 8.7), JASMINE)
    }
  }
  if (st.bun === 'low') {
    g.ellipsoid(-0.5, 56, -HD - 5, 9, 8, 5.5, (x, y) => (mod(x - y, 6) === 0 ? dark : c))
    for (let a = 0; a < 16; a++) {
      const t = (a / 16) * Math.PI * 2
      g.set(Math.round(-0.5 + Math.cos(t) * 9.4), Math.round(56 + Math.sin(t) * 8.4), -HD - 6, JASMINE)
    }
    // strings of jasmine from the bun over the right shoulder, hanging down the front
    for (let y = 24; y < HEAD0 + 3; y++)
      for (const x0 of [-18, -14]) {
        const x = x0 + (mod(y + x0, 4) < 2 ? 0 : 1)
        g.box(x - 1, x + 1, y, y + 1, 7, 10, mod(y, 6) === 0 ? '#7fb35a' : JASMINE)
      }
  }
  if (st.tail && !hatted) {
    // a high ponytail that swings out over the right side of the head
    g.rounded(-4, 4, HEAD1 + 1, HEAD1 + 5, -12, -4, 1.5, RIBBON)
    const H = HEAD1
    chain(
      g,
      [
        [-0.5, H + 6, -8, 5],
        [-8, H + 10, -7, 5.2],
        [-17, H + 9, -6, 5],
        [-24, H + 4, -5, 4.6],
        [-28, H - 4, -4, 4.2],
        [-29, H - 13, -4, 3.8],
        [-27, H - 22, -4, 3.2],
        [-24, H - 28, -4, 2.2],
      ],
      (i, y) => (mod(y, 4) < 2 ? c : dark),
    )
  }
  if (st.puffs && !hatted)
    for (const s of [-1, 1]) {
      g.ellipsoid(s * 19 - 0.5, HEAD1 + 3, -2, 9.5, 9, 8.5, free((x, y, z) => (mod(x + y + z, 5) ? c : light)))
      // a red bow at the base of each puff, at the front
      for (const d of [-1, 1]) g.ellipsoid(s * 12 - 0.5 + d * 2.6, HEAD1 - 1, HD + 1, 2.4, 2, 1.6, RIBBON)
    }
}
