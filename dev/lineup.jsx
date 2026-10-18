import { createRoot } from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import Bommai from '../src/three/bommai/Bommai.jsx'
import SoftEnv from '../src/three/SoftEnv.jsx'
import { SEED_BOMMAIS } from '../src/data/seed.js'
import { ACCESSORIES, HEADWEAR, PETS, DEFAULT_CONFIG, HAIR_STYLES, OUTFITS, OUTFIT_COLORS, POSES } from '../src/data/options.js'

// Dev-only page (not part of the build): `npm run dev`, then open /dev/lineup.html.
// Shows a row of Bommais under soft studio light, to judge the look of the dolls.
//   ?set=seed            the demo dolls (default)
//   ?set=showcase        one of each outfit
//   ?set=poses           every pose, twice
//   ?set=faces           the eye styles and face extras
//   ?set=items           every accessory
//   ?set=pets            every pet, beside a Bommai and with a hat on
//   ?set=hair            every hairstyle
//   ?set=pairs           the two-tone outfits (saree, pavadai, crop top + skirt) in every colour
//   ?set=modest          the hijab, abaya, sharara, thobe and kufi, in the poses that test them
//   ?only=3              just one of them, close up
//   ?from=6&n=6          a few of them
//   ?pick=1,4,7          just these ones
//   ?angle=0.5           turn them (radians)
//   ?dist=1&y=0.7        move the camera in, looking at height y
//   ?x=0.4               and at this far to the right (the pets beside the pedestal)
//   ?move                let them move (idle animation and their pose's moves)
//   ?clear               transparent background and no floor (for rendering icons)
const look = { body: 'regular', skin_tone: 'medium-brown', hair: 'long-wavy', hair_color: 'black', face: 'round', face_extras: [], accessory: 'none' }
// one of each outfit, standing
const SHOWCASE = OUTFITS.map((o, i) => ({ ...look, name: o.label, outfit: o.id, outfit_color: o.color, skin_tone: ['wheat', 'honey', 'tan', 'brown'][i % 4], hair: ['long-wavy', 'braid', 'top-bun', 'short-crop', 'side-part'][i % 5], pose: 'standing' }))
// every pose, in a pavadai and in shirt + pants, holding flowers
const POSE_SET = POSES.flatMap((p) => [
  { ...look, name: p.label, outfit: 'pavadai', outfit_color: 'parrot', hair: 'braid', face: 'sparkle', accessory: 'flowers', pose: p.id },
  { ...look, name: p.label, outfit: 'shirt-pants', outfit_color: 'sky', hair: 'side-part', skin_tone: 'tan', accessory: 'none', pose: p.id },
])
// the faces
const FACES = ['round', 'sparkle', 'happy', 'sleepy', 'wink', 'dots'].map((face, i) => ({ ...look, face, face_extras: [['blush'], [], ['bindi'], ['glasses', 'mustache'], ['beard'], ['shades', 'namam']][i], outfit: 'kurta', outfit_color: 'kumkum', hair: ['long-wavy', 'puffs', 'ponytail', 'curly', 'spiky', 'low-bun'][i] }))
const q = new URLSearchParams(location.search)
// every accessory and every piece of headwear, standing and holding
const ITEMS = [...ACCESSORIES.slice(1).map((a) => ({ name: a.label, accessory: a.id })), ...HEADWEAR.slice(1).map((h) => ({ name: h.label, headwear: h.id }))].map((item, i) => ({ ...look, ...item, outfit: ['shirt-pants', 'pavadai', 'tee-jeans', 'salwar'][i % 4], outfit_color: ['sky', 'rose', 'mustard', 'peacock'][i % 4], hair: ['short-crop', 'long-straight', 'braid', 'ponytail'][i % 4], pose: i % 3 === 1 ? 'holding' : 'standing' }))
// every hairstyle, from the front
const HAIR = HAIR_STYLES.map((h, i) => ({ ...look, name: h.label, hair: h.id, outfit: ['kurta', 'pavadai', 'tee-jeans', 'salwar'][i % 4], outfit_color: ['sky', 'rose', 'mustard', 'peacock'][i % 4], skin_tone: ['wheat', 'honey', 'tan', 'brown'][i % 4], pose: 'standing' }))
// every colour on the outfits that show its pair
const PAIRS = OUTFIT_COLORS.flatMap((c, i) =>
  ['silk-saree', 'pavadai', 'crop-skirt'].map((outfit) => ({ ...look, name: `${c.id} + ${c.pair}`, outfit, outfit_color: c.id, hair: ['braid', 'long-wavy', 'ponytail'][i % 3], pose: 'standing' })),
)
// the hijab with the outfits it's often worn with, and the thobe and kufi, through the trickier poses
const MODEST = [
  { outfit: 'abaya', outfit_color: 'charcoal', headwear: 'hijab', pose: 'standing' },
  { outfit: 'sharara', outfit_color: 'mint', headwear: 'hijab', pose: 'namaste', body: 'slim' },
  { outfit: 'salwar', outfit_color: 'peacock', headwear: 'hijab', pose: 'sitting', face_extras: ['glasses'] },
  { outfit: 'silk-saree', outfit_color: 'maroon', headwear: 'hijab', pose: 'cross-legged', body: 'round' },
  { outfit: 'tee-jeans', outfit_color: 'sky', headwear: 'hijab', pose: 'cheering', face: 'sparkle' },
  { outfit: 'thobe', outfit_color: 'cream', hair: 'short-crop', headwear: 'kufi', accessory: 'filter-coffee', face_extras: ['beard'], pose: 'waving' },
  { outfit: 'kurta', outfit_color: 'parrot', hair: 'curly', headwear: 'kufi', accessory: 'guitar', face_extras: ['beard', 'mustache'], pose: 'dancing', body: 'round' },
  { outfit: 'abaya', outfit_color: 'lavender', headwear: 'hijab', pose: 'hips', skin_tone: 'deep-brown' },
  { outfit: 'thobe', outfit_color: 'sky', hair: 'side-part', headwear: 'kufi', accessory: 'book', pose: 'sitting', skin_tone: 'tan' },
  { outfit: 'sharara', outfit_color: 'maroon', headwear: 'hijab', pose: 'cross-legged', accessory: 'flowers' },
].map((c) => ({ ...look, name: `${c.outfit} ${c.pose}`, ...c }))
// every pet, standing next to a Bommai; then each again with a hat or something on the floor, to check they share the space
const PET_SET = [
  ...PETS.slice(1).map((pet, i) => ({ ...look, name: pet.label, pet: pet.id, outfit: ['shirt-pants', 'pavadai', 'tee-jeans', 'salwar'][i % 4], outfit_color: ['sky', 'rose', 'mustard', 'peacock'][i % 4], hair: ['short-crop', 'long-straight', 'braid', 'ponytail'][i % 4], pose: 'standing' })),
  ...PETS.slice(1).map((pet, i) => ({ ...look, name: pet.label + ' +', pet: pet.id, headwear: ['cap', 'beanie', 'fedora', 'headphones', 'cloud', 'kufi', 'hijab', 'cap'][i % 8], accessory: ['plant', 'guitar', 'handbag', 'easel'][i % 4], hair: ['top-bun', 'spiky', 'puffs', 'curly'][i % 4], pose: ['standing', 'dancing', 'sitting', 'namaste'][i % 4] })),
  // the pets that perch, on top of each kind of headwear
  ...['cloud', 'beanie', 'fedora', 'headphones', 'hijab', 'cap', 'kufi', 'none'].map((headwear, i) => ({ ...look, name: headwear, pet: ['bunny', 'parrot', 'pikachu'][i % 3], headwear, outfit: headwear === 'hijab' ? 'abaya' : 'kurta', outfit_color: 'peacock', hair: ['top-bun', 'curly', 'puffs', 'spiky'][i % 4], pose: ['standing', 'dancing', 'namaste', 'cross-legged'][i % 4] })),
]
const SETS = { pets: PET_SET, modest: MODEST, pairs: PAIRS, hair: HAIR, items: ITEMS, showcase: SHOWCASE, poses: POSE_SET, faces: FACES, default: [DEFAULT_CONFIG] }
const set = SETS[q.get('set')] || SEED_BOMMAIS
const only = q.get('only')
const from = +(q.get('from') || 0)
const pick = q.get('pick')?.split(',').map(Number)
const list = pick ? pick.map((i) => set[i]) : only != null ? [set[+only]] : set.slice(from, from + +(q.get('n') || set.length))
const angle = +(q.get('angle') || 0)
const clear = q.has('clear') // transparent background, no floor (for icons)
const gap = 1.0
const width = (list.length - 1) * gap
const dist = +(q.get('dist') || 0) || (only != null ? 2.4 : Math.max(3, width * 0.62))
const lookY = +(q.get('y') || 0.5)
const lookX = +(q.get('x') || 0)

function App() {
  return (
    <Canvas shadows dpr={1} camera={{ fov: 30, position: [lookX, lookY + 0.2, dist] }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, preserveDrawingBuffer: true, alpha: true }}>
      {!clear && <color attach="background" args={['#e9dccd']} />}
      <hemisphereLight args={['#fff6ea', '#b89b86', 1.0]} />
      <directionalLight position={[-2.5, 4, 3.5]} intensity={2.0} color="#fff1df" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={4} shadow-camera-bottom={-2} />
      <directionalLight position={[3, 1.5, 2]} intensity={0.6} />
      <SoftEnv intensity={0.3} />
      {!clear && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#e2d3c2" />
        </mesh>
      )}
      {list.map((c, i) => (
        <Bommai key={i} config={c} idle={q.has('move')} position={[i * gap - width / 2, 0, 0]} rotation={[0, angle, 0]} />
      ))}
      <OrbitControls target={[lookX, lookY, 0]} />
    </Canvas>
  )
}
createRoot(document.getElementById('root')).render(<App />)
