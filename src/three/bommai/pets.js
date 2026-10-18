import { shade, mod, hash3, HEAD0, HEAD1 } from './dims.js'
import { at } from './items.js'

// Pets as little voxel models. Each is drawn relative to where it stands (x = 0, z = 0 is the middle
// of its feet, y = 0 the floor it stands on), facing +z. A pet that sits next to the pedestal is
// drawn on the floor; one on the head is drawn on top of whatever is up there (see petAt).
//
// A model is draw(p, mk): `p` is what to draw the pet into, and `mk(anim, pivot, extra)` makes a
// part of it that moves by itself (an ear, a wing, a hand), turning about `pivot` (relative to the
// pet, like everything else); `extra` is { side, arg, hidden, parent } as for the moving parts in
// build.js. Whole pets that move (a hop, a bob) are listed in ROOT.

const DARK = '#1c1c22'
const WHITE = '#f8f5ee'

// a straight run of t×t voxels from a to b (a limb), the line running down the middle of it
function strut(p, [x0, y0, z0], [x1, y1, z1], t, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), 1)
  const h = t >> 1
  for (let i = 0; i <= n; i++) {
    const [x, y, z] = [x0 + ((x1 - x0) * i) / n - h, y0 + ((y1 - y0) * i) / n - h, z0 + ((z1 - z0) * i) / n - h].map(Math.round)
    p.box(x, x + t, y, y + t, z, z + t, c)
  }
}

const FLOOR_PETS = {
  cat(p) {
    const c = '#e39a52'
    const stripe = '#c4782f'
    p.ellipsoid(0, 5, 0, 5, 5.5, 4.5, (x, y) => (mod(y, 3) === 0 ? stripe : c)) // body
    p.ellipsoid(0, 13, 1.5, 5, 4.5, 4, c) // head
    for (let k = 0; k < 3; k++) (p.box(-4, -1 - k, 16 + k, 17 + k, 0, 3, c), p.box(1 + k, 4, 16 + k, 17 + k, 0, 3, c)) // ears
    p.set(-2, 13, 5, DARK)
    p.set(1, 13, 5, DARK)
    p.set(-1, 11, 5, '#f08aa0')
    p.set(0, 11, 5, '#f08aa0')
    for (let y = 1; y < 10; y++) p.box(4 + (y > 6 ? 1 : 0), 6 + (y > 6 ? 1 : 0), y, y + 1, -4, -2, mod(y, 3) ? c : stripe) // tail
  },
  dog(p) {
    const c = '#c9a074'
    p.ellipsoid(0, 5, -1, 5, 5.5, 5, c) // body
    p.ellipsoid(0, 13, 1, 5, 4.5, 4.5, c) // head
    p.rounded(-2, 2, 10, 13, 4, 8, 1, '#e8d2b0') // snout
    p.set(-1, 12, 7, DARK)
    p.set(0, 12, 7, DARK)
    p.set(-3, 14, 5, DARK)
    p.set(2, 14, 5, DARK)
    for (const s of [-1, 1]) p.rounded(s > 0 ? 4 : -6, s > 0 ? 6 : -4, 8, 16, -1, 3, 1, '#8a6440') // floppy ears
    p.rounded(-1, 1, 3, 9, -8, -5, 0.8, c) // tail
  },
  // Rocky, the Eridian from Project Hail Mary, with his hands up: a cracked terracotta carapace with
  // a few pits on it, no eyes, two arms raised with the two-pronged hands spread (jazz hands, and
  // they wave!) and three thick legs, the stone patched with green-blue verdigris
  rocky(p, mk) {
    const stone = (x, y, z) => {
      const h = hash3(x >> 1, y >> 1, z >> 1) % 100
      return h < 8 ? '#97603c' : h < 24 ? '#cc9060' : '#b8794c'
    }
    const limb = (x, y, z) => (hash3(x >> 1, y >> 1, z >> 1) % 100 < 24 ? '#6fb8a0' : stone(x, y, z))
    // the carapace: a tall rounded block, paler underneath, with cracks running across it
    p.rounded(-8, 8, 6, 21, -6, 7, 4, (x, y, z) => (y < 9 ? '#b5a89a' : mod(x * 3 + y * 2 + z, 13) === 0 ? '#6a4228' : stone(x, y, z)))
    for (const [x, y] of [[4, 17], [5, 15], [4, 13], [5, 11]]) p.set(x, y, 6, '#6b4a34') // a column of pits
    for (const s of [-1, 1]) {
      // an arm: out from the shoulder to a squared-off elbow, then up; it sways from the shoulder
      const arm = mk('arm', [s * 7, 16, 0], { side: s })
      strut(arm, [s * 7, 16, 0], [s * 11, 17, 1], 4, limb)
      strut(arm, [s * 11, 17, 1], [s * 12, 24, 1], 4, limb)
      if (s < 0) arm.box(-12, -8, 14, 15, -1, 3, '#6b5a4a') // a woven band on one arm
      // the hand, two prongs spread, shakes at the wrist
      const hand = mk('hand', [s * 12, 24, 1], { side: s, parent: arm.grid })
      hand.box(s * 12 - 3, s * 12 + 3, 23, 26, -1, 3, limb)
      strut(hand, [s * 12, 25, 1], [s * 10, 30, 1], 2, limb)
      strut(hand, [s * 12, 25, 1], [s * 15, 30, 1], 2, limb)
      // an outer leg: out from the hip, then straight down to a blocky foot
      strut(p, [s * 6, 9, -1], [s * 11, 8, -1], 4, limb)
      strut(p, [s * 11, 8, -1], [s * 11, 2, -1], 4, limb)
      p.box(s * 11 - 3, s * 11 + 3, 0, 3, -4, 2, '#97603c')
    }
    // the front leg, down to a foot out in front
    strut(p, [0, 8, 4], [0, 6, 9], 4, limb)
    strut(p, [0, 6, 9], [0, 2, 10], 4, limb)
    p.box(-3, 3, 0, 3, 7, 13, '#97603c')
  },
  // Grogu, in his robe, sitting with big ears (that go up and down) and bigger eyes
  grogu(p, mk) {
    const skin = '#9fba7a'
    const robe = '#b08a5a'
    p.rounded(-5, 5, 0, 11, -4, 4, 2.5, (x, y) => (y >= 8 ? '#d9c49c' : y === 4 ? '#8a6a42' : robe)) // robe, with a belt and a light collar
    p.ellipsoid(0, 15, 0.5, 5.5, 5, 5, skin) // head
    p.box(-3, 3, 18, 19, 4, 5, shade(skin, -0.1)) // forehead wrinkle
    for (const s of [-1, 1]) {
      const ear = mk('ears', [s * 5, 16, 0], { side: s }) // the ears go up and down
      for (let i = 0; i < 13; i++) {
        const h = Math.max(1, Math.round(4.2 - i * 0.27))
        const y = 16 - Math.round(i * 0.3) // the ears droop a little
        const x = s > 0 ? 5 + i : -6 - i
        ear.box(x, x + 1, y, y + h, -1, 2, (xx, yy, zz) => (zz === 1 && i > 0 && i < 10 ? '#d9a89a' : skin))
      }
      p.box(s * 3 - (s > 0 ? 0 : 2), s * 3 + (s > 0 ? 2 : 0), 14, 17, 4, 6, '#1c1814') // big dark eyes
      p.set(s > 0 ? 4 : -5, 16, 6, WHITE)
      p.box(s * 3 - (s > 0 ? 0 : 3), s * 3 + (s > 0 ? 3 : 0), 7, 9, 4, 6, skin) // little hands
    }
    p.set(0, 13, 5, shade(skin, -0.1)) // nose
    p.box(-1, 1, 11, 12, 5, 6, shade(skin, -0.2)) // mouth
  },
}

const HEAD_PETS = {
  bunny(p, mk) {
    const fur = '#f3efe8'
    const pink = '#f4b6c2'
    p.ellipsoid(0, 4, -1, 6, 4.5, 6, fur) // haunches
    p.ellipsoid(0, 10, 2.5, 4.6, 4, 4, fur) // head
    for (const s of [-1, 1]) {
      const ear = mk('wiggle', [s * 2.5, 13, 1], { side: s }) // the ears sway and twitch
      for (let y = 13; y < 25; y++) {
        const w = y > 22 ? 1 : 2
        const x = Math.round(s * (2.5 + (y - 13) * 0.2)) - (s > 0 ? 0 : w)
        ear.box(x, x + w, y, y + 1, 0, 2, (xx, yy, zz) => (zz === 1 && y < 23 ? pink : fur)) // ears, pink inside
      }
    }
    for (const x of [-3, 2]) p.box(x, x + 1, 10, 12, 5, 7, DARK) // eyes
    p.box(-1, 1, 8, 9, 6, 7, pink) // nose
    p.box(0, 1, 7, 8, 6, 7, shade(pink, -0.2))
    for (const x of [-4, 3]) p.box(x, x + 1, 8, 9, 5, 6, '#f8d6dc') // cheeks
    p.ellipsoid(0, 4, -7, 2.6, 2.6, 2.6, '#ffffff') // fluffy tail
    for (const x of [-3, 1]) p.box(x, x + 2, 0, 2, 3, 6, fur) // front paws
  },
  // a macaw, flying above the head: hovering, with its wings beating
  parrot(p, mk) {
    const red = '#d63a2f'
    const blue = '#2a5db0'
    const beak = '#efe6d0'
    for (const x of [-3, 1]) p.box(x, x + 2, 0, 1, 0, 2, '#6f6a66') // feet, tucked up
    p.ellipsoid(0, 8, -1, 4.5, 7, 4, red) // body
    p.ellipsoid(0, 6, 1.5, 2.8, 4.5, 2.5, '#e8654a') // lighter chest
    for (const s of [-1, 1]) {
      // a wing, held out, red at the shoulder, then yellow, then blue; it beats from the shoulder
      const wing = mk('flap', [s * 4, 11, -1], { side: s })
      wing.ellipsoid(s * 10, 11, -1.5, 7, 1.8, 3.8, (x) => (Math.abs(x + 0.5) < 8 ? red : Math.abs(x + 0.5) < 12 ? '#f2c230' : blue))
    }
    p.ellipsoid(0, 16, 1, 4, 3.8, 3.8, red) // head
    for (const s of [-1, 1]) {
      p.ellipsoid(s * 3, 16, 2.6, 1.5, 1.9, 1.5, WHITE) // pale patch round the eye
      p.box(s > 0 ? 3 : -4, s > 0 ? 4 : -3, 16, 18, 4, 5, DARK) // eye
    }
    p.rounded(-2, 2, 13, 18, 4, 9, 1.2, beak) // beak, hooked down at the tip
    p.box(-1, 1, 11, 14, 8, 10, beak)
    p.box(-1, 1, 11, 12, 8, 10, '#4a4540')
    p.box(-1, 1, 13, 14, 5, 8, '#4a4540') // the lower beak
    // long tail feathers trailing behind
    for (let k = 0; k < 12; k++) p.box(-1, 2, 5 - Math.round(k * 0.4), 7 - Math.round(k * 0.4), -4 - k, -3 - k, k > 6 ? blue : (x) => (x === 0 ? red : blue))
  },
  // a rubber duck, sitting on the head and rocking as if in a bath
  duck(p) {
    const yellow = '#f7cf2e'
    p.ellipsoid(0, 4, -1, 6, 4.5, 6, yellow) // body
    p.ellipsoid(0, 7.5, -6.5, 2.2, 2.6, 2.2, yellow) // tail, turned up
    p.ellipsoid(0, 11, 2, 4.2, 4, 4, yellow) // head
    for (const s of [-1, 1]) p.ellipsoid(s * 5.6, 4.5, -1, 1.2, 3, 3.6, '#e9b81c') // wings
    p.rounded(-2.5, 2.5, 9, 12, 5, 10, 1, '#f08a24') // flat orange beak
    p.box(-2, 2, 9, 10, 6, 10, '#d9741a')
    for (const x of [-3, 2]) p.box(x, x + 1, 12, 14, 5, 6, DARK) // eyes
    p.set(-3, 13, 6, WHITE)
    p.set(2, 13, 6, WHITE)
    p.box(-2, 2, 15, 16, 1, 3, shade(yellow, 0.1)) // a little curl of fluff on top
  },
  // a sleepy little cloud bobbing over the head, with a drizzle of its own
  cloud(p, mk) {
    const col = (x, y) => (y < -6 ? '#dfe7f2' : '#fbfcfe')
    for (const [x, y, rx, ry] of [
      [-10, -3, 8.5, 6.5],
      [2, 1, 10, 9],
      [13, -3, 7.5, 6.5],
      [1, -5, 15, 5],
    ])
      p.ellipsoid(x, y, 0, rx, ry, 7, col)
    for (const x of [-4, 5]) p.box(x, x + 2, -1, 0, 6, 8, '#3a3a48') // sleepy eyes
    p.box(0, 2, -3, -2, 6, 8, '#3a3a48')
    // a few raindrops that fall from it and fade away
    for (const [i, x] of [-9, 3, 12].entries()) {
      const drop = mk('drip', [x, -11, 0], { arg: i })
      drop.box(x, x + 2, -13, -10, 0, 2, '#8fc7ee')
      drop.set(x, -10, 0, '#8fc7ee')
    }
  },
}

export const PET_MODELS = { ...FLOOR_PETS, ...HEAD_PETS }

// pets that spread wide stand a little further from the pedestal
const APART = { rocky: 4 }

// The row a pet on the head stands on: the median height of the columns under it, whatever is up
// there (hair, a hat, headphones), so a lone spike of hair doesn't hold it up on a stalk.
function topOf(g) {
  const tops = []
  for (let z = -7; z < 7; z++)
    for (let x = -7; x < 7; x++) {
      let y = g.sy - 1
      while (y >= HEAD0 && !g.has(x, y, z)) y--
      tops.push(y + 1)
    }
  return tops.sort((a, b) => a - b)[tops.length >> 1]
}

// Pets that move as a whole, and how: [move, arg] (see MOVES in Bommai.jsx)
const ROOT = { cat: ['hop', 1], dog: ['hop', 1.35], duck: ['rock'], parrot: ['flutter'], cloud: ['float'] }
// pets that hover a little above where they would stand
const HOVER = { parrot: 6 }

// Draw a pet into `host`, the grid of whatever it is next to: the floor, or the head. It stands
// next to the pedestal at x, on top of the head or floating over it. `part(anim, pivot, extra)` makes
// a grid that moves by itself (see buildBommai); a part hangs from the grid it is drawn on top of,
// so a pet on a dancing doll's head dances with it.
export function petAt(host, pet, x, part) {
  const draw = PET_MODELS[pet.id]
  if (!draw) return
  const anchor = pet.at === 'head' ? [0, topOf(host) + (HOVER[pet.id] || 0), 0] : pet.at === 'float' ? [0, HEAD1 + 21, 0] : [x + Math.sign(x) * (APART[pet.id] || 0), 0, 2]
  const [move, arg] = ROOT[pet.id] || []
  const root = move ? part(move, anchor, { arg, parent: host }) : host
  const mk = (anim, pivot, extra = {}) => {
    const grid = part(anim, [anchor[0] + pivot[0], anchor[1] + pivot[1], anchor[2] + pivot[2]], { parent: root, ...extra })
    return Object.assign(at(grid, anchor), { grid })
  }
  draw(at(root, anchor), mk)
}
