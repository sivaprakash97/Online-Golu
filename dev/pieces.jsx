import { createRoot } from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import SoftEnv from '../src/three/SoftEnv.jsx'
import { PIECES } from '../src/three/traditional/Pieces.jsx'
import VoxelModel from '../src/three/voxel/VoxelModel.jsx'
import { S, buildBanana } from '../src/three/golu/stage.js'
import { Lamp } from '../src/three/traditional/Pieces.jsx'

// Dev-only page (not part of the build): `npm run dev`, then open /dev/pieces.html.
// The traditional pieces of the top two steps in a row, close up; ?set=room for the banana plant and lamp.
const q = new URLSearchParams(location.search)
const names = Object.keys(PIECES)
const gap = 1.25

function App() {
  const room = q.get('set') === 'room'
  return (
    <Canvas shadows dpr={1} camera={{ fov: 30, position: room ? [0, 2, 9] : [0, 1.6, 7.4] }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, preserveDrawingBuffer: true }}>
      <color attach="background" args={['#e9dccd']} />
      <hemisphereLight args={['#fff6ea', '#b89b86', 1.0]} />
      <directionalLight position={[-2.5, 4, 3.5]} intensity={2.0} color="#fff1df" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={4} shadow-camera-bottom={-2} />
      <SoftEnv intensity={0.3} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#e2d3c2" />
      </mesh>
      {room ? (
        <>
          <VoxelModel id="banana" build={buildBanana} size={S} position={[-1.5, 0, 0]} />
          <group position={[1.5, 0, 0]}>
            <Lamp stem={52} light />
          </group>
        </>
      ) : (
        names.map((n, i) => {
          const Piece = PIECES[n]
          return (
            <group key={n} position={[(i - (names.length - 1) / 2) * gap, 0, 0]} scale={1.2}>
              <Piece />
            </group>
          )
        })
      )}
      <OrbitControls target={[0, room ? 1.6 : 0.5, 0]} />
    </Canvas>
  )
}
createRoot(document.getElementById('root')).render(<App />)
