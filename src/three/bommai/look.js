import * as THREE from 'three'
import { LOOKUP } from '../../data/options.js'

// Colours and outfit details for one Bommai, resolved from its config.

const tmp = new THREE.Color()
export function shade(hex, amt) {
  tmp.set(hex)
  const hsl = {}
  tmp.getHSL(hsl)
  tmp.setHSL(hsl.h, hsl.s, THREE.MathUtils.clamp(hsl.l + amt, 0, 1))
  return '#' + tmp.getHexString()
}
export function mix(a, b, t) {
  const c = new THREE.Color(a).lerp(new THREE.Color(b), t)
  return '#' + c.getHexString()
}

export const GOLD = '#e8b33c'
export const GOLD_DARK = '#b8862a'
export const WHITE = '#fbf7ec'
const isWarm = (id) => ['turmeric', 'mustard', 'cream'].includes(id)

export function resolveLook(cfg) {
  const outfit = LOOKUP.outfit[cfg.outfit]
  const c = LOOKUP.outfitColor[cfg.outfit_color].color
  const contrast = isWarm(cfg.outfit_color) ? '#7a1f2b' : GOLD
  const skin = LOOKUP.skin[cfg.skin_tone].color
  const look = {
    skin,
    skinShade: shade(skin, -0.06),
    hair: LOOKUP.hairColor[cfg.hair_color].color,
    body: LOOKUP.body[cfg.body],
    outfit,
    main: c,
    accent: outfit.accent || shade(c, -0.15),
    top: c,
    pants: outfit.pants === null ? c : outfit.pants || shade(c, -0.2),
    sleeves: 'long',
    shoes: '#3a2a24',
    sole: '#f4efe6',
    pattern: outfit.pattern || null,
  }
  if (outfit.top === 'blouse') {
    look.top = contrast
    look.sleeves = 'short'
  }
  if (outfit.top === 'overalls') {
    look.top = '#f4efe6'
    look.sleeves = 'short'
  }
  if (['tee-jeans', 'jibba', 'dress'].includes(outfit.id)) look.sleeves = 'short'
  if (outfit.bottom === 'dhoti') look.pants = '#f6f0e1'
  if (['saree', 'skirt', 'dhoti'].includes(outfit.bottom) || outfit.id === 'kurta' || outfit.id === 'salwar') look.shoes = null // barefoot
  if (outfit.id === 'tee-jeans' || outfit.id === 'hoodie' || outfit.id === 'overalls') {
    look.shoes = '#f4efe6' // white sneakers
    look.sole = '#c8323a'
  }
  if (outfit.id === 'dress') look.shoes = shade(c, -0.12)
  look.drapeColor =
    outfit.drape === 'davani' ? contrast : outfit.drape === 'angavastram' ? '#f6f0e1' : outfit.drape === 'dupatta' ? shade(c, 0.18) : c
  return look
}

// Small deterministic hash for "random" sparkles and curls that stay put between renders.
export function hash3(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

// Surface patterns, as functions of the voxel position on the front/side of a garment.
export function patterned(kind, base) {
  const light = shade(base, 0.12)
  const dark = shade(base, -0.1)
  switch (kind) {
    case 'butta': // little gold motifs, as on silk
      return (x, y, z) => ((((x + 64) % 4) === 1 && ((y + 64) % 4) === 1) || (((x + 64) % 4) === 3 && ((y + 64) % 4) === 3) ? GOLD : base)
    case 'polka':
      return (x, y) => ((((x + 64) % 3) === 1 && ((y + 64) % 4) === 1) || (((x + 64) % 3) === 2 && ((y + 64) % 4) === 3) ? WHITE : base)
    case 'check':
      return (x, y, z) => ((Math.floor((x + z + 64) / 2) + Math.floor((y + 64) / 2)) % 2 ? base : mix(base, '#ffffff', 0.55))
    case 'stripes':
      return (x, y) => (((y + 64) % 3) === 0 ? mix(base, '#ffffff', 0.6) : base)
    case 'sparkle':
      return (x, y, z) => (hash3(x, y, z) > 0.86 ? light : hash3(x + 7, y, z) > 0.8 ? dark : base)
    default:
      return () => base
  }
}
