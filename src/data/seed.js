// Fictional demo Bommais so the Golu never loads empty. The same rows are inserted
// into Supabase by supabase/seed.sql (generated from this file: `npm run seed:sql`).
export const SEED_BOMMAIS = [
  { name: 'Meera', step: 4, body: 'slim', skin_tone: 'honey', hair: 'long-wavy', hair_color: 'black', outfit: 'kurta', outfit_color: 'peacock', face: 'happy', face_extras: ['glasses'], accessory: 'laptop', pose: 'holding' },
  { name: 'Arjun', step: 3, body: 'regular', skin_tone: 'brown', hair: 'spiky', hair_color: 'black', outfit: 'hoodie', outfit_color: 'charcoal', face: 'round', face_extras: [], accessory: 'controller', pose: 'holding' },
  { name: 'Karthik', step: 5, body: 'regular', skin_tone: 'tan', hair: 'curly', hair_color: 'espresso', outfit: 'tee-jeans', outfit_color: 'mustard', face: 'sparkle', face_extras: ['mustache'], accessory: 'guitar', pose: 'holding' },
  { name: 'Priya', step: 2, body: 'regular', skin_tone: 'medium-brown', hair: 'braid', hair_color: 'black', outfit: 'silk-saree', outfit_color: 'kumkum', face: 'happy', face_extras: ['bindi', 'nosering'], accessory: 'filter-coffee', pose: 'standing' },
  { name: 'Ananya', step: 6, body: 'slim', skin_tone: 'wheat', hair: 'ponytail', hair_color: 'chestnut', outfit: 'dress', outfit_color: 'lavender', face: 'round', face_extras: ['blush'], accessory: 'book', pose: 'holding' },
  { name: 'Ravi', step: 1, body: 'round', skin_tone: 'deep-brown', hair: 'side-part', hair_color: 'silver', outfit: 'veshti', outfit_color: 'cream', face: 'happy', face_extras: ['glasses', 'namam'], accessory: 'none', pose: 'namaste' },
  { name: 'Divya', step: 3, body: 'slim', skin_tone: 'tan', hair: 'top-bun', hair_color: 'black', outfit: 'shirt-pants', outfit_color: 'sky', face: 'sparkle', face_extras: [], accessory: 'camera', pose: 'holding' },
  { name: 'Vikram', step: 5, body: 'regular', skin_tone: 'medium-brown', hair: 'short-crop', hair_color: 'black', outfit: 'jibba', outfit_color: 'mint', face: 'wink', face_extras: ['beard'], accessory: 'cricket-bat', pose: 'standing' },
  { name: 'Lakshmi', step: 1, body: 'round', skin_tone: 'brown', hair: 'low-bun', hair_color: 'silver', outfit: 'silk-saree', outfit_color: 'parrot', face: 'happy', face_extras: ['bindi', 'glasses'], accessory: 'flowers', pose: 'standing' },
  { name: 'Sanjay', step: 7, body: 'regular', skin_tone: 'honey', hair: 'curly', hair_color: 'black', outfit: 'shirt-pants', outfit_color: 'cream', face: 'sleepy', face_extras: ['mustache'], accessory: 'headphones', pose: 'waving' },
  { name: 'Nila', step: 2, body: 'slim', skin_tone: 'deep-brown', hair: 'puffs', hair_color: 'black', outfit: 'pavadai', outfit_color: 'rose', face: 'sparkle', face_extras: ['bindi'], accessory: 'cat', pose: 'waving' },
  { name: 'Farhan', step: 4, body: 'regular', skin_tone: 'wheat', hair: 'side-part', hair_color: 'espresso', outfit: 'sherwani', outfit_color: 'maroon', face: 'round', face_extras: ['beard'], accessory: 'none', pose: 'waving' },
  { name: 'Kavya', step: 6, body: 'regular', skin_tone: 'medium-brown', hair: 'long-straight', hair_color: 'indigo', outfit: 'overalls', outfit_color: 'mustard', face: 'happy', face_extras: [], accessory: 'paintbrush', pose: 'standing' },
  { name: 'Joseph', step: 7, body: 'round', skin_tone: 'tan', hair: 'bald', hair_color: 'black', outfit: 'kurta', outfit_color: 'kumkum', face: 'happy', face_extras: ['glasses'], accessory: 'ice-cream', pose: 'sitting' },
  { name: 'Aditi', step: 3, body: 'slim', skin_tone: 'porcelain', hair: 'long-wavy', hair_color: 'henna', outfit: 'salwar', outfit_color: 'turmeric', face: 'round', face_extras: ['bindi'], accessory: 'backpack', pose: 'waving' },
  { name: 'Selvam', step: 2, body: 'regular', skin_tone: 'ebony', hair: 'short-crop', hair_color: 'black', outfit: 'veshti', outfit_color: 'cream', face: 'wink', face_extras: ['mustache'], accessory: 'dog', pose: 'standing' },
  { name: 'Tara', step: 5, body: 'slim', skin_tone: 'brown', hair: 'top-bun', hair_color: 'chestnut', outfit: 'hoodie', outfit_color: 'parrot', face: 'dots', face_extras: ['shades'], accessory: 'plant', pose: 'sitting' },
  { name: 'Gopal', step: 4, body: 'round', skin_tone: 'deep-brown', hair: 'curly', hair_color: 'silver', outfit: 'tee-jeans', outfit_color: 'peacock', face: 'sleepy', face_extras: ['beard', 'glasses'], accessory: 'book', pose: 'sitting' },
  { name: 'Zoya', step: 6, body: 'regular', skin_tone: 'honey', hair: 'ponytail', hair_color: 'black', outfit: 'tee-jeans', outfit_color: 'rose', face: 'sparkle', face_extras: ['blush'], accessory: 'camera', pose: 'holding' },
].map((b, i) => ({
  ...b,
  id: `seed-${i + 1}`,
  // spread fictional join times over the past few days
  created_at: new Date(Date.UTC(2026, 9, 10, 9) + i * 3.7 * 3600e3).toISOString(),
  seeded: true,
}))
