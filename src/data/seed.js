// Fictional demo Bommais so the Golu never loads empty: one on each community step, scattered
// left and right so the steps don't look bunched in the middle. The same rows are inserted into
// Supabase by supabase/seed.sql (generated from this file: `npm run seed:sql`).
export const SEED_BOMMAIS = [
  { name: 'Ravi', step: 1, slot: 3, body: 'round', skin_tone: 'deep-brown', hair: 'side-part', hair_color: 'silver', outfit: 'veshti', outfit_color: 'cream', face: 'happy', face_extras: ['glasses', 'namam'], accessory: 'none', pose: 'namaste' },
  { name: 'Priya', step: 2, slot: 10, body: 'regular', skin_tone: 'medium-brown', hair: 'braid', hair_color: 'black', outfit: 'silk-saree', outfit_color: 'kumkum', face: 'happy', face_extras: ['bindi', 'nosering'], accessory: 'filter-coffee', pose: 'standing' },
  { name: 'Arjun', step: 3, slot: 5, body: 'regular', skin_tone: 'brown', hair: 'spiky', hair_color: 'black', outfit: 'hoodie', outfit_color: 'charcoal', face: 'round', face_extras: [], accessory: 'controller', pose: 'holding' },
  { name: 'Meera', step: 4, slot: 10, body: 'slim', skin_tone: 'honey', hair: 'long-wavy', hair_color: 'black', outfit: 'kurta', outfit_color: 'peacock', face: 'happy', face_extras: ['glasses'], accessory: 'laptop', pose: 'holding' },
  { name: 'Karthik', step: 5, slot: 1, body: 'regular', skin_tone: 'tan', hair: 'curly', hair_color: 'espresso', outfit: 'tee-jeans', outfit_color: 'mustard', face: 'sparkle', face_extras: ['mustache'], accessory: 'guitar', pose: 'holding' },
  { name: 'Nila', step: 6, slot: 6, body: 'slim', skin_tone: 'deep-brown', hair: 'puffs', hair_color: 'black', outfit: 'pavadai', outfit_color: 'rose', face: 'sparkle', face_extras: ['bindi'], accessory: 'cat', pose: 'waving' },
  { name: 'Kavya', step: 7, slot: 2, body: 'regular', skin_tone: 'medium-brown', hair: 'long-straight', hair_color: 'indigo', outfit: 'overalls', outfit_color: 'mustard', face: 'happy', face_extras: [], accessory: 'paintbrush', pose: 'standing' },
].map((b, i) => ({
  ...b,
  id: `seed-${i + 1}`,
  // spread fictional join times over the past few days
  created_at: new Date(Date.UTC(2026, 9, 10, 9) + i * 9 * 3600e3).toISOString(),
  seeded: true,
}))
