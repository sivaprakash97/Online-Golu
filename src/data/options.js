// The Bommai catalog. Every Bommai is just a combination of these ids, so adding a
// new hairstyle / outfit / accessory means adding one entry here and (if it needs new
// geometry) one case in the matching renderer under src/three/bommai/.

export const SKIN_TONES = [
  { id: 'porcelain', label: 'Porcelain', color: '#f6d7c3' },
  { id: 'wheat', label: 'Wheat', color: '#eac09a' },
  { id: 'honey', label: 'Honey', color: '#d9a273' },
  { id: 'medium-brown', label: 'Medium brown', color: '#c08456' },
  { id: 'tan', label: 'Tan', color: '#a86c43' },
  { id: 'brown', label: 'Brown', color: '#8a5434' },
  { id: 'deep-brown', label: 'Deep brown', color: '#6b3d24' },
  { id: 'ebony', label: 'Ebony', color: '#4a2a19' },
]

export const BODIES = [
  { id: 'slim', label: 'Slim', w: 0.9, d: 0.92, h: 1.04 },
  { id: 'regular', label: 'Regular', w: 1, d: 1, h: 1 },
  { id: 'round', label: 'Round', w: 1.18, d: 1.14, h: 0.97 },
]

export const HAIR_STYLES = [
  { id: 'short-crop', label: 'Short crop' },
  { id: 'side-part', label: 'Side part' },
  { id: 'spiky', label: 'Spiky' },
  { id: 'curly', label: 'Curly' },
  { id: 'long-straight', label: 'Long' },
  { id: 'long-wavy', label: 'Long wavy' },
  { id: 'braid', label: 'Jasmine braid' },
  { id: 'top-bun', label: 'Top bun' },
  { id: 'low-bun', label: 'Low bun' },
  { id: 'ponytail', label: 'Ponytail' },
  { id: 'puffs', label: 'Twin puffs' },
  { id: 'bald', label: 'Shaved' },
]

export const HAIR_COLORS = [
  { id: 'black', color: '#1f1a1c' },
  { id: 'espresso', color: '#3b2620' },
  { id: 'chestnut', color: '#6a3c22' },
  { id: 'silver', color: '#c9c6c2' },
  { id: 'henna', color: '#8c2f1e' },
  { id: 'indigo', color: '#2f3f8f' },
]

// bottom: pants | skirt | saree | dhoti | dress | shorts
// top length: how far down the torso block extends (1 = waist, 1.6 = knee-length tunic)
export const OUTFITS = [
  { id: 'silk-saree', label: 'Silk saree', bottom: 'saree', top: 'blouse', drape: 'pallu', accent: '#e8b33c', color: 'kumkum' },
  { id: 'kurta', label: 'Kurta', bottom: 'pants', topLength: 1.55, accent: '#e8b33c', pants: '#f3ead7', color: 'turmeric' },
  { id: 'veshti', label: 'Veshti + shirt', bottom: 'dhoti', top: 'shirt', drape: 'angavastram', accent: '#e8b33c', color: 'cream' },
  { id: 'pavadai', label: 'Pavadai', bottom: 'skirt', top: 'blouse', drape: 'davani', accent: '#e8b33c', color: 'parrot' },
  { id: 'shirt-pants', label: 'Shirt + pants', bottom: 'pants', top: 'shirt', pants: '#3d4660', color: 'sky' },
  { id: 'tee-jeans', label: 'Tee + jeans', bottom: 'pants', pants: '#3b5b8c', color: 'kumkum' },
  { id: 'dress', label: 'Dress', bottom: 'dress', accent: '#ffffff', color: 'peacock' },
  { id: 'hoodie', label: 'Hoodie', bottom: 'pants', top: 'hoodie', pants: '#2f2f38', color: 'lavender' },
  { id: 'sherwani', label: 'Sherwani', bottom: 'pants', topLength: 1.7, accent: '#e8b33c', pants: '#f3ead7', color: 'maroon' },
  { id: 'salwar', label: 'Salwar + dupatta', bottom: 'pants', topLength: 1.5, drape: 'dupatta', pants: '#f3ead7', accent: '#e8b33c', color: 'rose' },
  { id: 'overalls', label: 'Overalls', bottom: 'pants', top: 'overalls', pants: null, color: 'mustard' },
  { id: 'jibba', label: 'Jibba + shorts', bottom: 'shorts', topLength: 1.15, pants: '#e9dfc9', color: 'mint' },
]

export const OUTFIT_COLORS = [
  { id: 'kumkum', color: '#c8323a' },
  { id: 'maroon', color: '#7a1f2b' },
  { id: 'turmeric', color: '#eab12f' },
  { id: 'mustard', color: '#c99a2e' },
  { id: 'parrot', color: '#3f9b4b' },
  { id: 'mint', color: '#8fd1b4' },
  { id: 'peacock', color: '#16727c' },
  { id: 'sky', color: '#7fb4e0' },
  { id: 'lavender', color: '#9a86d1' },
  { id: 'rose', color: '#e58aa0' },
  { id: 'cream', color: '#f3ead7' },
  { id: 'charcoal', color: '#2e2f38' },
]

export const EYES = [
  { id: 'round', label: 'Round' },
  { id: 'happy', label: 'Happy' },
  { id: 'sparkle', label: 'Sparkly' },
  { id: 'sleepy', label: 'Sleepy' },
  { id: 'wink', label: 'Wink' },
  { id: 'dots', label: 'Dot eyes' },
]

export const FACE_EXTRAS = [
  { id: 'glasses', label: 'Glasses' },
  { id: 'shades', label: 'Shades' },
  { id: 'bindi', label: 'Bindi' },
  { id: 'namam', label: 'Vibhuti' },
  { id: 'mustache', label: 'Mustache' },
  { id: 'beard', label: 'Beard' },
  { id: 'blush', label: 'Blush' },
  { id: 'nosering', label: 'Nose ring' },
]

// hold: hand (right hand), both (in front, both hands), head, back, ground (next to feet)
export const ACCESSORIES = [
  { id: 'none', label: 'Nothing', hold: null },
  { id: 'filter-coffee', label: 'Filter coffee', hold: 'hand' },
  { id: 'laptop', label: 'Laptop', hold: 'both' },
  { id: 'guitar', label: 'Guitar', hold: 'both' },
  { id: 'book', label: 'Book', hold: 'both' },
  { id: 'camera', label: 'Camera', hold: 'both' },
  { id: 'controller', label: 'Controller', hold: 'both' },
  { id: 'cricket-bat', label: 'Cricket bat', hold: 'hand' },
  { id: 'headphones', label: 'Headphones', hold: 'head' },
  { id: 'backpack', label: 'Backpack', hold: 'back' },
  { id: 'plant', label: 'Plant', hold: 'ground' },
  { id: 'cat', label: 'Cat', hold: 'ground' },
  { id: 'dog', label: 'Dog', hold: 'ground' },
  { id: 'flowers', label: 'Marigolds', hold: 'hand' },
  { id: 'paintbrush', label: 'Paintbrush', hold: 'hand' },
  { id: 'ice-cream', label: 'Kulfi', hold: 'hand' },
]

export const POSES = [
  { id: 'standing', label: 'Standing' },
  { id: 'waving', label: 'Waving' },
  { id: 'namaste', label: 'Hands together' },
  { id: 'holding', label: 'Holding' },
  { id: 'sitting', label: 'Sitting' },
]

export const DEFAULT_CONFIG = {
  name: '',
  body: 'regular',
  skin_tone: 'medium-brown',
  hair: 'long-wavy',
  hair_color: 'black',
  outfit: 'silk-saree',
  outfit_color: 'kumkum',
  face: 'round',
  face_extras: ['bindi'],
  accessory: 'filter-coffee',
  pose: 'standing',
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

export function randomConfig(name = '') {
  const outfit = pick(OUTFITS)
  const extras = FACE_EXTRAS.filter(() => Math.random() < 0.18).map((e) => e.id)
  // keep it readable: never both glasses kinds
  const face_extras = extras.includes('shades') ? extras.filter((e) => e !== 'glasses') : extras
  return {
    name,
    body: pick(BODIES).id,
    skin_tone: pick(SKIN_TONES).id,
    hair: pick(HAIR_STYLES).id,
    hair_color: Math.random() < 0.7 ? pick(HAIR_COLORS.slice(0, 3)).id : pick(HAIR_COLORS).id,
    outfit: outfit.id,
    outfit_color: Math.random() < 0.5 ? outfit.color : pick(OUTFIT_COLORS).id,
    face: pick(EYES).id,
    face_extras,
    accessory: pick(ACCESSORIES.slice(1)).id,
    pose: pick(POSES).id,
  }
}

const byId = (arr) => Object.fromEntries(arr.map((o) => [o.id, o]))
export const LOOKUP = {
  skin: byId(SKIN_TONES),
  body: byId(BODIES),
  hair: byId(HAIR_STYLES),
  hairColor: byId(HAIR_COLORS),
  outfit: byId(OUTFITS),
  outfitColor: byId(OUTFIT_COLORS),
  eyes: byId(EYES),
  accessory: byId(ACCESSORIES),
  pose: byId(POSES),
}

// Unknown ids (e.g. an option removed later) fall back to defaults so old rows still render.
export function normalizeConfig(c = {}) {
  const ok = (table, v, d) => (v && table[v] ? v : d)
  const D = DEFAULT_CONFIG
  return {
    name: (c.name || '').slice(0, 24),
    body: ok(LOOKUP.body, c.body, D.body),
    skin_tone: ok(LOOKUP.skin, c.skin_tone, D.skin_tone),
    hair: ok(LOOKUP.hair, c.hair, D.hair),
    hair_color: ok(LOOKUP.hairColor, c.hair_color, D.hair_color),
    outfit: ok(LOOKUP.outfit, c.outfit, D.outfit),
    outfit_color: ok(LOOKUP.outfitColor, c.outfit_color, D.outfit_color),
    face: ok(LOOKUP.eyes, c.face, D.face),
    face_extras: Array.isArray(c.face_extras) ? c.face_extras.filter((e) => FACE_EXTRAS.some((f) => f.id === e)) : [],
    accessory: ok(LOOKUP.accessory, c.accessory, 'none'),
    pose: ok(LOOKUP.pose, c.pose, D.pose),
  }
}

export const OPEN_STEPS = [1, 2, 3, 4, 5, 6, 7]
export const LOCKED_STEPS = [8, 9]
// How many Bommais each community step holds: the third row from the top (step 7) holds 4, and each
// row further down holds 2 more (step 6: 6, step 5: 8 … step 1: 16), 70 in all. Steps 8 and 9 hold
// the traditional pieces. supabase/migrations/20261015000000_slots_and_moving.sql repeats the rule.
export const spotsOnStep = (step) => (step >= 1 && step <= 7 ? 18 - 2 * step : 0)
// The order spots fill when none is chosen: from the middle outward (n/2, n/2 - 1, n/2 + 1, …).
export const centreOut = (n) => Array.from({ length: n }, (_, r) => (r % 2 ? n / 2 - (r + 1) / 2 : n / 2 + r / 2))
