import { createRoot } from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import Bommai from '../src/three/bommai/Bommai.jsx'
import SoftEnv from '../src/three/SoftEnv.jsx'
import { SEED_BOMMAIS } from '../src/data/seed.js'
import { DEFAULT_CONFIG } from '../src/data/options.js'

// Dev-only page (not part of the build): `npm run dev`, then open /dev/lineup.html.
// Shows a row of Bommais under soft studio light, to judge the look of the dolls.
//   ?set=seed            the demo dolls (default)
//   ?set=showcase        looks taken from the reference renders
//   ?only=3              just one of them, close up
//   ?from=6&n=6          a few of them
//   ?angle=0.5           turn them (radians)
const SHOWCASE = [
  { name: 'Cowgirl', body: 'slim', skin_tone: 'porcelain', hair: 'long-wavy', hair_color: 'blonde', outfit: 'polka-dress', outfit_color: 'mint', face: 'round', face_extras: [], accessory: 'sun-hat', pose: 'standing' },
  { name: 'Guitar', body: 'slim', skin_tone: 'wheat', hair: 'long-straight', hair_color: 'caramel', outfit: 'dress', outfit_color: 'lavender', face: 'round', face_extras: [], accessory: 'guitar', pose: 'holding' },
  { name: 'Roses', body: 'slim', skin_tone: 'honey', hair: 'long-straight', hair_color: 'chestnut', outfit: 'dress', outfit_color: 'kumkum', face: 'round', face_extras: [], accessory: 'flower-crown', pose: 'standing' },
  { name: 'Shades', body: 'slim', skin_tone: 'wheat', hair: 'long-straight', hair_color: 'caramel', outfit: 'sparkle-dress', outfit_color: 'sky', face: 'round', face_extras: ['shades'], accessory: 'none', pose: 'standing' },
  { name: 'Bear', body: 'regular', skin_tone: 'honey', hair: 'long-straight', hair_color: 'black', outfit: 'check-jacket', outfit_color: 'charcoal', face: 'round', face_extras: ['glasses'], accessory: 'bear-hat', pose: 'standing' },
  { name: 'Bunny', body: 'regular', skin_tone: 'wheat', hair: 'long-straight', hair_color: 'espresso', outfit: 'tee-jeans', outfit_color: 'charcoal', face: 'round', face_extras: [], accessory: 'bunny-hat', pose: 'standing' },
  { name: 'Cat', body: 'regular', skin_tone: 'medium-brown', hair: 'long-straight', hair_color: 'black', outfit: 'stripe-skirt', outfit_color: 'sky', face: 'round', face_extras: [], accessory: 'cat-hat', pose: 'standing' },
  { name: 'Bun', body: 'regular', skin_tone: 'porcelain', hair: 'top-bun', hair_color: 'chestnut', outfit: 'polka-dress', outfit_color: 'turmeric', face: 'sparkle', face_extras: ['blush'], accessory: 'handbag', pose: 'waving' },
]
const q = new URLSearchParams(location.search)
const set = q.get('set') === 'showcase' ? SHOWCASE : q.get('set') === 'default' ? [DEFAULT_CONFIG] : SEED_BOMMAIS
const only = q.get('only')
const from = +(q.get('from') || 0)
const list = only != null ? [set[+only]] : set.slice(from, from + +(q.get('n') || set.length))
const angle = +(q.get('angle') || 0)
const gap = 1.0
const width = (list.length - 1) * gap
const dist = only != null ? 2.4 : Math.max(3, width * 0.62)

function App() {
  return (
    <Canvas shadows dpr={1} camera={{ fov: 30, position: [0, 0.7, dist] }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, preserveDrawingBuffer: true }}>
      <color attach="background" args={['#e9dccd']} />
      <hemisphereLight args={['#fff6ea', '#b89b86', 1.0]} />
      <directionalLight position={[-2.5, 4, 3.5]} intensity={2.0} color="#fff1df" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={4} shadow-camera-bottom={-2} />
      <directionalLight position={[3, 1.5, 2]} intensity={0.6} />
      <SoftEnv intensity={0.3} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#e2d3c2" />
      </mesh>
      {list.map((c, i) => (
        <Bommai key={i} config={c} idle={false} position={[i * gap - width / 2, 0, 0]} rotation={[0, angle, 0]} />
      ))}
      <OrbitControls target={[0, 0.5, 0]} />
    </Canvas>
  )
}
createRoot(document.getElementById('root')).render(<App />)
