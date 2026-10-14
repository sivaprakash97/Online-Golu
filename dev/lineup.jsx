import { createRoot } from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import Bommai from '../src/three/bommai/Bommai.jsx'
import SoftEnv from '../src/three/SoftEnv.jsx'
import { SEED_BOMMAIS } from '../src/data/seed.js'
import { ACCESSORIES, DEFAULT_CONFIG, HAIR_STYLES, OUTFITS, POSES } from '../src/data/options.js'

// Dev-only page (not part of the build): `npm run dev`, then open /dev/lineup.html.
// Shows a row of Bommais under soft studio light, to judge the look of the dolls.
//   ?set=seed            the demo dolls (default)
//   ?set=showcase        one of each outfit
//   ?set=poses           every pose, twice
//   ?set=faces           the eye styles and face extras
//   ?set=items           every accessory
//   ?set=hair            every hairstyle
//   ?only=3              just one of them, close up
//   ?from=6&n=6          a few of them
//   ?pick=1,4,7          just these ones
//   ?angle=0.5           turn them (radians)
//   ?dist=1&y=0.7        move the camera in, looking at height y
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
// every accessory, standing and holding
const ITEMS = ACCESSORIES.slice(1).map((a, i) => ({ ...look, name: a.label, accessory: a.id, outfit: ['shirt-pants', 'pavadai', 'tee-jeans', 'salwar'][i % 4], outfit_color: ['sky', 'rose', 'mustard', 'peacock'][i % 4], hair: ['short-crop', 'long-straight', 'braid', 'ponytail'][i % 4], pose: i % 3 === 1 ? 'holding' : 'standing' }))
// every hairstyle, from the front
const HAIR = HAIR_STYLES.map((h, i) => ({ ...look, name: h.label, hair: h.id, outfit: ['kurta', 'pavadai', 'tee-jeans', 'salwar'][i % 4], outfit_color: ['sky', 'rose', 'mustard', 'peacock'][i % 4], skin_tone: ['wheat', 'honey', 'tan', 'brown'][i % 4], pose: 'standing' }))
const SETS = { hair: HAIR, items: ITEMS, showcase: SHOWCASE, poses: POSE_SET, faces: FACES, default: [DEFAULT_CONFIG] }
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

function App() {
  return (
    <Canvas shadows dpr={1} camera={{ fov: 30, position: [0, lookY + 0.2, dist] }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, preserveDrawingBuffer: true, alpha: true }}>
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
      <OrbitControls target={[0, lookY, 0]} />
    </Canvas>
  )
}
createRoot(document.getElementById('root')).render(<App />)
