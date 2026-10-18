import { shade, mod, hash3, HEAD0, HEAD1 } from './dims.js'
import { at } from './items.js'

// Pets as little voxel models. Each is drawn relative to where it stands (x = 0, z = 0 is the middle
// of its feet, y = 0 the floor it stands on). A pet that sits next to the pedestal is
// drawn on the floor; one on the head is drawn on top of whatever is up there (see petAt).
// Most face the viewer (+z); the raptor is drawn from the side.

const DARK = '#1c1c22'
const WHITE = '#f8f5ee'

// a straight run of t×t voxels from a to b (a leg, a tail, a feather)
function strut(p, [x0, y0, z0], [x1, y1, z1], t, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), 1)
  for (let i = 0; i <= n; i++) {
    const [x, y, z] = [x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, z0 + ((z1 - z0) * i) / n].map(Math.round)
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
  // Rocky, the Eridian from Project Hail Mary: a rocky carapace on five jointed legs, the two at the
  // front raised like hands, and no eyes
  rocky(p) {
    const rock = (x, y, z) => {
      const h = hash3(x, y, z) % 100
      return h < 12 ? '#4e3f35' : h < 22 ? '#927c68' : h < 26 ? '#c9a45a' : '#6f5a4a'
    }
    p.ellipsoid(0, 7.5, 0, 7.5, 5.5, 7, rock) // the carapace
    p.ellipsoid(0, 10.5, -0.5, 4.5, 2.4, 4, (x, y, z) => (hash3(x, y, z) % 5 ? '#5d4a3d' : '#927c68')) // a ridge along the top
    // five legs, the corners of a pentagon with one corner at the back
    for (const [k, a] of [-90, -18, -162, 54, 126].entries()) {
      const [dx, dz] = [Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)]
      const out = (r, y) => [Math.round(dx * r) - 1, y, Math.round(dz * r) - 1]
      const raised = k > 2
      const leg = (x, y, z) => (hash3(x, y, z) % 6 ? '#5d4a3d' : '#927c68')
      strut(p, out(5, 6), out(raised ? 8 : 9, raised ? 12 : 10), 3, leg)
      strut(p, out(raised ? 8 : 9, raised ? 12 : 10), out(raised ? 11 : 12, raised ? 9 : 0), 2, leg)
      const [fx, fy, fz] = out(raised ? 11 : 12, raised ? 9 : 0)
      p.box(fx - 1, fx + 3, fy, fy + 2, fz - 1, fz + 3, '#3f3229') // the foot, or the hand
    }
  },
  // Grogu, in his robe, sitting with big ears and bigger eyes
  grogu(p) {
    const skin = '#9fba7a'
    const robe = '#b08a5a'
    p.rounded(-5, 5, 0, 11, -4, 4, 2.5, (x, y) => (y >= 8 ? '#d9c49c' : y === 4 ? '#8a6a42' : robe)) // robe, with a belt and a light collar
    p.ellipsoid(0, 15, 0.5, 5.5, 5, 5, skin) // head
    p.box(-3, 3, 18, 19, 4, 5, shade(skin, -0.1)) // forehead wrinkle
    for (const s of [-1, 1]) {
      for (let i = 0; i < 13; i++) {
        const h = Math.max(1, Math.round(4.2 - i * 0.27))
        const y = 16 - Math.round(i * 0.3) // the ears droop a little
        const x = s > 0 ? 5 + i : -6 - i
        p.box(x, x + 1, y, y + h, -1, 2, (xx, yy, zz) => (zz === 1 && i > 0 && i < 10 ? '#d9a89a' : skin))
      }
      p.box(s * 3 - (s > 0 ? 0 : 2), s * 3 + (s > 0 ? 2 : 0), 14, 17, 4, 6, '#1c1814') // big dark eyes
      p.set(s > 0 ? 4 : -5, 16, 6, WHITE)
      p.box(s * 3 - (s > 0 ? 0 : 3), s * 3 + (s > 0 ? 3 : 0), 7, 9, 4, 6, skin) // little hands
    }
    p.set(0, 13, 5, shade(skin, -0.1)) // nose
    p.box(-1, 1, 11, 12, 5, 6, shade(skin, -0.2)) // mouth
  },
  // a velociraptor in miniature, seen from the side (drawn facing +x; see `profile`): up on its toes,
  // a long stiff tail behind and a sickle claw raised
  raptor(p) {
    const hide = (x, y, z) => (y > 12 && mod(x, 4) < 2 ? '#3f6a2d' : y < 9 ? '#a9c47a' : '#6f9a4a')
    const belly = '#d8d29a'
    const dark = '#5b8a3d'
    for (const z of [-5, 2]) {
      p.ellipsoid(-3, 7.5, z + 1.5, 3.6, 4.4, 2.4, hide) // thigh
      strut(p, [-4, 6, z], [-6, 1, z], 3, dark) // the shin, angled back to the ankle
      p.box(-7, 0, 0, 1, z, z + 3, dark) // foot, toes forward
      p.box(-3, 1, 0, 1, z + 1, z + 2, dark)
      p.box(1, 3, 0, 1, z, z + 3, '#f0e6c0') // toe claws
      p.box(-1, 1, 2, 4, z + 1, z + 2, '#f0e6c0') // the raised sickle claw
    }
    p.ellipsoid(-4, 10.5, 0, 6.5, 4.4, 4.2, hide) // body
    p.ellipsoid(1.5, 9.8, 0, 3.5, 3, 3.4, belly)
    p.ellipsoid(2.5, 14.5, 0, 2.6, 3.8, 2.6, hide) // neck, curving up and forward
    p.ellipsoid(5, 18, 0, 4, 3, 3.2, hide) // head
    p.rounded(6, 13, 16, 19, -2, 2, 1, '#7ba656') // snout
    p.box(6, 13, 15, 16, -2, 2, belly) // jaw
    for (const x of [8, 11]) for (const z of [-2, 1]) p.set(x, 15, z, WHITE) // teeth
    for (const z of [-2, 1]) (p.box(5, 7, 18, 20, z, z + 1, '#f2b632'), p.set(6, 19, z, DARK)) // amber eyes
    p.set(12, 18, -1, DARK) // nostrils
    p.set(12, 18, 0, DARK)
    for (const z of [-5, 4]) p.box(3, 7, 9, 10, z, z + 1, dark) // tiny arms
    for (const z of [-5, 4]) p.box(6, 8, 8, 9, z, z + 1, '#f0e6c0')
    for (let x = -9; x > -26; x--) {
      const r = Math.max(0.7, 3.2 - (-9 - x) * 0.15) // the tail thins out and lifts a little
      p.ellipsoid(x + 0.5, 11 + (-9 - x) * 0.18, 0, 1, r, r, hide)
    }
  },
}

const HEAD_PETS = {
  bunny(p) {
    const fur = '#f3efe8'
    const pink = '#f4b6c2'
    p.ellipsoid(0, 4, -1, 6, 4.5, 6, fur) // haunches
    p.ellipsoid(0, 10, 2.5, 4.6, 4, 4, fur) // head
    for (const s of [-1, 1])
      for (let y = 13; y < 25; y++) {
        const w = y > 22 ? 1 : 2
        const x = Math.round(s * (2.5 + (y - 13) * 0.2)) - (s > 0 ? 0 : w)
        p.box(x, x + w, y, y + 1, 0, 2, (xx, yy, zz) => (zz === 1 && y < 23 ? pink : fur)) // ears, pink inside
      }
    for (const x of [-3, 2]) p.box(x, x + 1, 10, 12, 5, 7, DARK) // eyes
    p.box(-1, 1, 8, 9, 6, 7, pink) // nose
    p.box(0, 1, 7, 8, 6, 7, shade(pink, -0.2))
    for (const x of [-4, 3]) p.box(x, x + 1, 8, 9, 5, 6, '#f8d6dc') // cheeks
    p.ellipsoid(0, 4, -7, 2.6, 2.6, 2.6, '#ffffff') // fluffy tail
    for (const x of [-3, 1]) p.box(x, x + 2, 0, 2, 3, 6, fur) // front paws
  },
  // a macaw, perched upright
  parrot(p) {
    const red = '#d63a2f'
    const blue = '#2a5db0'
    const beak = '#efe6d0'
    for (const x of [-3, 1]) p.box(x, x + 2, 0, 1, 0, 3, '#6f6a66') // feet
    p.ellipsoid(0, 8, -1, 4.5, 7, 4, red) // body
    p.ellipsoid(0, 6, 1.5, 2.8, 4.5, 2.5, '#e8654a') // lighter chest
    for (const s of [-1, 1]) p.ellipsoid(s * 4.3, 8, -2, 1.6, 6, 3, (x, y) => (y > 10 ? red : y > 6 ? '#f2c230' : blue)) // wings
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
  pikachu(p) {
    const yellow = '#f6d043'
    const brown = '#9a6a2a'
    p.ellipsoid(0, 5, -0.5, 5, 5, 4.5, (x, y, z) => (z < -3 && (y === 3 || y === 6) ? brown : yellow)) // body, with its back stripes
    p.ellipsoid(0, 12, 1, 5.5, 4.5, 4.5, yellow) // head
    for (const s of [-1, 1]) {
      for (let k = 0; k < 10; k++) {
        const w = k < 5 ? 3 : 2
        const x = s > 0 ? Math.round(2.5 + k * 0.4) : -Math.round(2.5 + k * 0.4) - w
        p.box(x, x + w, 15 + k, 16 + k, 0, 2, k > 6 ? DARK : yellow) // long ears, black at the tips
      }
      p.box(s > 0 ? 2 : -4, s > 0 ? 4 : -2, 12, 14, 4, 6, DARK) // eyes
      p.set(s > 0 ? 3 : -4, 13, 6, WHITE)
      p.ellipsoid(s * 4.2, 9.8, 3.2, 1.9, 1.9, 1.6, '#e0402f') // red cheeks
      p.ellipsoid(s * 4.6, 4, 3, 1.4, 2, 1.4, yellow) // arms
      p.ellipsoid(s * 2.5, 1, 2.5, 2, 1.2, 3, yellow) // feet
    }
    p.set(0, 11, 5, DARK) // nose
    p.box(-1, 1, 9, 10, 5, 6, DARK) // mouth
    // the lightning-bolt tail
    p.box(0, 2, 2, 4, -8, -6, brown)
    p.box(1, 5, 4, 7, -8, -6, yellow)
    p.box(-1, 3, 7, 10, -8, -6, yellow)
    p.box(2, 8, 10, 14, -8, -6, yellow)
  },
}

export const PET_MODELS = { ...FLOOR_PETS, ...HEAD_PETS }
// models drawn from the side, facing +x: they turn to face the doll (see petAt)
const PROFILE = ['raptor']

// The row a pet on the head stands on: the median height of the columns under it, whatever is up
// there (hair, a hat, headphones, a cloud), so a lone spike of hair doesn't hold it up on a stalk.
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

// Draw a pet into `g`: next to the pedestal at x (the floor grid), or on top of the head (the head's grid).
export function petAt(g, pet, x) {
  const draw = PET_MODELS[pet.id]
  if (!draw) return
  if (pet.at === 'head') draw(at(g, [0, topOf(g), 0]))
  else draw(at(g, [x, 0, 2], { mx: PROFILE.includes(pet.id) && x > 0 }))
}
