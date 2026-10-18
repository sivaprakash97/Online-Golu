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
  { id: 'long-straight', label: 'Long with bangs' },
  { id: 'long-wavy', label: 'Long wavy' },
  { id: 'braid', label: 'Jasmine braid' },
  { id: 'twin-braids', label: 'Twin braids' },
  { id: 'top-bun', label: 'Top bun' },
  { id: 'low-bun', label: 'Bun with jasmine' },
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
  { id: 'caramel', color: '#a0703f' },
  { id: 'blonde', color: '#dcbf86' },
]

// bottom: pants | skirt | saree | dhoti | dress | maxi (an ankle-length skirt) | robe (an ankle-length
//   abaya or thobe) | sharara (wide flared pants)
// topLength: how far down the top reaches (1 = waist, 1.6 = knee-length tunic)
// pattern: woven into the voxels of the main colour (butta = little gold motifs, dots = a light print)
// The blouse and davani (saree, pavadai), the crop top and the jumpsuit's belt take the colour's pair.
export const OUTFITS = [
  { id: 'silk-saree', label: 'Silk saree', bottom: 'saree', top: 'blouse', drape: 'pallu', accent: '#e8b33c', pattern: 'butta', color: 'kumkum' },
  { id: 'pavadai', label: 'Pavadai', bottom: 'skirt', top: 'blouse', drape: 'davani', accent: '#e8b33c', pattern: 'butta', color: 'parrot' },
  { id: 'salwar', label: 'Salwar + dupatta', bottom: 'pants', topLength: 1.55, drape: 'dupatta', pants: '#f3ead7', accent: '#e8b33c', color: 'rose' },
  { id: 'dress', label: 'Dress', bottom: 'dress', accent: '#ffffff', color: 'peacock' },
  { id: 'crop-skirt', label: 'Crop top + skirt', bottom: 'maxi', top: 'crop', pattern: 'dots', color: 'peacock' },
  { id: 'jumpsuit', label: 'Jumpsuit', bottom: 'pants', top: 'jumpsuit', color: 'maroon' },
  { id: 'abaya', label: 'Abaya', bottom: 'robe', accent: '#e8b33c', color: 'charcoal' },
  { id: 'sharara', label: 'Sharara', bottom: 'sharara', topLength: 1.3, drape: 'dupatta', accent: '#e8b33c', color: 'mint' },
  { id: 'kurta', label: 'Kurta', bottom: 'pants', topLength: 1.5, accent: '#e8b33c', pants: '#f3ead7', color: 'turmeric' },
  { id: 'veshti', label: 'Veshti + shirt', bottom: 'dhoti', top: 'shirt', drape: 'angavastram', accent: '#e8b33c', color: 'cream' },
  { id: 'sherwani', label: 'Sherwani', bottom: 'pants', topLength: 1.7, accent: '#e8b33c', pants: '#f3ead7', color: 'maroon' },
  { id: 'thobe', label: 'Thobe', bottom: 'robe', color: 'cream' },
  { id: 'shirt-pants', label: 'Shirt + pants', bottom: 'pants', top: 'shirt', pants: '#3d4660', color: 'sky' },
  { id: 'tee-jeans', label: 'Tee + jeans', bottom: 'pants', top: 'tee', pants: '#3b5b8c', color: 'kumkum' },
  { id: 'hoodie', label: 'Hoodie', bottom: 'pants', top: 'hoodie', pants: '#2f2f38', color: 'lavender' },
]
// Outfits that were dropped, and what dolls already wearing them change into.
const RETIRED_OUTFITS = { jibba: 'kurta', overalls: 'shirt-pants' }

// pair: the colour that goes with it on two-tone outfits, picked the way silk sarees and pavadais
// are paired (red with parrot green, maroon with mustard, cream with red…)
export const OUTFIT_COLORS = [
  { id: 'kumkum', color: '#c8323a', pair: 'parrot' },
  { id: 'maroon', color: '#7a1f2b', pair: 'mustard' },
  { id: 'turmeric', color: '#eab12f', pair: 'kumkum' },
  { id: 'mustard', color: '#c99a2e', pair: 'peacock' },
  { id: 'parrot', color: '#3f9b4b', pair: 'rose' },
  { id: 'mint', color: '#8fd1b4', pair: 'maroon' },
  { id: 'peacock', color: '#16727c', pair: 'mustard' },
  { id: 'sky', color: '#7fb4e0', pair: 'rose' },
  { id: 'lavender', color: '#9a86d1', pair: 'mustard' },
  { id: 'rose', color: '#e58aa0', pair: 'parrot' },
  { id: 'cream', color: '#f3ead7', pair: 'kumkum' },
  { id: 'charcoal', color: '#2e2f38', pair: 'turmeric' },
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
  { id: 'blush', label: 'Rosy cheeks' },
  { id: 'nosering', label: 'Nose ring' },
]

// What goes on the head. It's a choice of its own, apart from what's carried, so a Bommai can wear
// a cap and hold a guitar. The hijab covers the hair (which is kept, for when it comes off); it's
// always black.
export const HIJAB = { id: 'hijab', label: 'Hijab', color: '#24222a' }
export const HEADWEAR = [
  { id: 'none', label: 'None' },
  { id: 'cap', label: 'Cap' },
  { id: 'beanie', label: 'Beanie' },
  { id: 'fedora', label: 'Hat' },
  { id: 'kufi', label: 'Kufi' },
  HIJAB,
  { id: 'headphones', label: 'Headphones' },
]

// What's carried. hold: hand (right hand), both (in front, both hands), side (carried at the side),
// back, ground (next to the pedestal)
export const ACCESSORIES = [
  { id: 'none', label: 'Nothing', hold: null },
  { id: 'filter-coffee', label: 'Filter coffee', hold: 'hand' },
  { id: 'flowers', label: 'Marigolds', hold: 'hand' },
  { id: 'ice-cream', label: 'Kulfi', hold: 'hand' },
  { id: 'paintbrush', label: 'Paintbrush', hold: 'hand' },
  { id: 'cricket-bat', label: 'Cricket bat', hold: 'hand' },
  { id: 'book', label: 'Book', hold: 'both' },
  { id: 'laptop', label: 'Laptop', hold: 'both' },
  { id: 'camera', label: 'Camera', hold: 'both' },
  { id: 'controller', label: 'Controller', hold: 'both' },
  { id: 'guitar', label: 'Guitar', hold: 'both' },
  { id: 'veena', label: 'Veena', hold: 'both' },
  { id: 'skateboard', label: 'Skateboard', hold: 'side' },
  { id: 'backpack', label: 'Backpack', hold: 'back' },
  { id: 'easel', label: 'Easel', hold: 'ground' },
  { id: 'plant', label: 'Plant', hold: 'ground' },
  { id: 'handbag', label: 'Handbag', hold: 'ground' },
]

// Pets are a choice of their own, apart from what's carried, so a Bommai can hold a guitar and have
// a cat. at: 'floor' (sits next to the pedestal), 'head' (perched on top of whatever is up there:
// hair, a hat) or 'float' (bobs in the air above the head). Keep the ids to 7 letters or fewer: the
// database packs headwear, what's carried and the pet into one 32-character column (see packAccessory).
export const PETS = [
  { id: 'none', label: 'None', at: null },
  { id: 'cat', label: 'Cat', at: 'floor' },
  { id: 'dog', label: 'Dog', at: 'floor' },
  { id: 'rocky', label: 'Rocky', at: 'floor' }, // the Eridian from Project Hail Mary
  { id: 'grogu', label: 'Baby Yoda', at: 'floor' },
  { id: 'bunny', label: 'Bunny', at: 'head' },
  { id: 'parrot', label: 'Parrot', at: 'head' },
  { id: 'duck', label: 'Rubber duck', at: 'head' },
  { id: 'cloud', label: 'Little cloud', at: 'float' }, // was headwear; old rows that wore it read as this
]

export const POSES = [
  { id: 'standing', label: 'Standing' },
  { id: 'waving', label: 'Waving' },
  { id: 'namaste', label: 'Hands together' },
  { id: 'holding', label: 'Holding' },
  { id: 'sitting', label: 'Sitting' },
  { id: 'cross-legged', label: 'Cross-legged' },
  { id: 'dancing', label: 'Dancing' },
  { id: 'hips', label: 'Hands on hips' },
  { id: 'cheering', label: 'Cheering' },
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
  headwear: 'none',
  accessory: 'filter-coffee',
  pet: 'none',
  pose: 'standing',
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// Headwear that sits on the hair, so hair that would poke through it is left out.
export const HATS = ['cap', 'beanie', 'fedora', 'kufi']

export function randomConfig(name = '') {
  const outfit = pick(OUTFITS)
  // an abaya comes with a hijab, a salwar or sharara sometimes; no other outfit gets one by chance
  const hijab = outfit.id === 'abaya' || (['salwar', 'sharara'].includes(outfit.id) && Math.random() < 0.35)
  const hats = HEADWEAR.filter((h) => h.id !== 'none' && h.id !== HIJAB.id)
  let extras = FACE_EXTRAS.filter(() => Math.random() < 0.18).map((e) => e.id)
  if (hijab) extras = extras.filter((e) => !['bindi', 'namam', 'mustache', 'beard'].includes(e))
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
    headwear: hijab ? HIJAB.id : Math.random() < 0.25 ? pick(hats).id : 'none',
    accessory: pick(ACCESSORIES.slice(1)).id,
    pet: Math.random() < 0.3 ? pick(PETS.slice(1)).id : 'none',
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
  headwear: byId(HEADWEAR),
  accessory: byId(ACCESSORIES),
  pet: byId(PETS),
  pose: byId(POSES),
}

// A colour's pair (see OUTFIT_COLORS), and whether an outfit shows it big enough to put on the swatch.
export const pairColor = (colorId) => LOOKUP.outfitColor[LOOKUP.outfitColor[colorId]?.pair]?.color
export const showsPair = (outfitId) => ['blouse', 'crop'].includes(LOOKUP.outfit[outfitId]?.top)

// The database has one accessory column, so the headwear, what's carried and the pet share it:
// 'cap+guitar+cat', or any of them alone. Each id belongs to exactly one table, so they can be told
// apart wherever they sit. Rows from before pets existed hold 'cat', 'dog' or the cloud, which now
// read as the pet; rows from before the headwear was split hold a single id.
export const packAccessory = (headwear, accessory, pet) => [headwear, accessory, pet].filter((v) => v && v !== 'none').join('+') || 'none'
function unpackAccessory(v) {
  const out = ['none', 'none', 'none'] // headwear, carried, pet
  for (const id of String(v || '').split('+')) {
    if (LOOKUP.pet[id] && id !== 'none') out[2] = id
    else if (LOOKUP.headwear[id] && id !== 'none') out[0] = id
    else out[1] = id
  }
  return out
}

// Unknown ids (e.g. an option removed later) fall back to defaults so old rows still render.
export function normalizeConfig(c = {}) {
  const ok = (table, v, d) => (v && table[v] ? v : d)
  const D = DEFAULT_CONFIG
  // headwear and the pet come apart from the accessory column when read from the database (see packAccessory)
  const [head, held, packed] = c.headwear === undefined ? unpackAccessory(c.accessory) : [c.headwear, c.accessory, 'none']
  const kept = c.pet && c.pet !== 'none' ? c.pet : packed
  // a cat or dog saved as the carried item, or the cloud saved as headwear, is the pet now
  const pet = [kept, held, head].find((id) => LOOKUP.pet[id] && id !== 'none') || 'none'
  return {
    name: (c.name || '').slice(0, 24),
    body: ok(LOOKUP.body, c.body, D.body),
    skin_tone: ok(LOOKUP.skin, c.skin_tone, D.skin_tone),
    hair: ok(LOOKUP.hair, c.hair, D.hair),
    hair_color: ok(LOOKUP.hairColor, c.hair_color, D.hair_color),
    outfit: ok(LOOKUP.outfit, RETIRED_OUTFITS[c.outfit] || c.outfit, D.outfit),
    outfit_color: ok(LOOKUP.outfitColor, c.outfit_color, D.outfit_color),
    face: ok(LOOKUP.eyes, c.face, D.face),
    face_extras: Array.isArray(c.face_extras) ? c.face_extras.filter((e) => FACE_EXTRAS.some((f) => f.id === e)) : [],
    headwear: ok(LOOKUP.headwear, head, 'none'),
    accessory: ok(LOOKUP.accessory, held, 'none'),
    pet: ok(LOOKUP.pet, pet, 'none'),
    pose: ok(LOOKUP.pose, c.pose, D.pose),
  }
}

export const OPEN_STEPS = [1, 2, 3, 4, 5, 6, 7]
export const LOCKED_STEPS = [8, 9]
// How many Bommais each community step holds. The third row from the top (step 7) is 10.6 wide
// (~9.7 usable); a Bommai on its stand is ~0.54 wide, and with about one Bommai's width between
// neighbours, n of them need (2n - 1) x 0.54, so 9 fit. Each row further down holds one more
// (step 6: 10 … step 1: 15), 84 in all. Steps 8 and 9 hold the traditional pieces.
// supabase/migrations/20261015000000_slots_and_moving.sql repeats the rule.
export const spotsOnStep = (step) => (step >= 1 && step <= 7 ? 16 - step : 0)
export const SPOTS_PER_GOLU = OPEN_STEPS.reduce((n, k) => n + spotsOnStep(k), 0)

// The Golus on the carousel, numbered from 1. Each is a full nine-step Golu with the same spots.
// supabase/migrations/20261017000000_second_golu.sql repeats the count (check golu between 1 and 2);
// to open another Golu, raise both.
export const GOLU_COUNT = 2

// Free spots left on each Golu (index 0 is Golu 1), counting only spots that exist.
export function freeSpotsByGolu(bommais, count = GOLU_COUNT) {
  const taken = Array.from({ length: count }, () => ({}))
  for (const b of bommais) {
    const t = taken[(b.golu || 1) - 1]
    if (t) t[b.step] = (t[b.step] || 0) + 1
  }
  return taken.map((t) => OPEN_STEPS.reduce((n, k) => n + Math.max(0, spotsOnStep(k) - (t[k] || 0)), 0))
}
// The order spots fill when none is chosen: from the middle outward (c, c - 1, c + 1, … with c = ⌊n/2⌋).
export const centreOut = (n) => {
  const c = Math.floor(n / 2)
  return Array.from({ length: n }, (_, r) => (r % 2 ? c - (r + 1) / 2 : c + r / 2))
}
