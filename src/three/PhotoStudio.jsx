import { useLayoutEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import Bommai from './bommai/Bommai.jsx'
import StudioLights from './StudioLights.jsx'

// The photo booth's camera: renders one Bommai on a transparent background, big and still, and hands
// the picture back as a plain 2D canvas (snapshot.js lays the card out around it). Like the option
// tiles in Thumbnails.jsx it draws on a hidden canvas, but it is only mounted while the booth is open,
// so a phone isn't left holding another WebGL context.
export const STUDIO_SIZE = 1200

const CAMERA = { fov: 30, near: 0.05, far: 20, position: [0.5, 0.64, 3.1] }
const LOOK = [0, 0.52, 0]

function Shutter({ onShot }) {
  const { gl, scene, camera } = useThree()
  const frames = useRef(0)
  const taken = useRef(false)
  useLayoutEffect(() => {
    camera.lookAt(...LOOK)
    camera.updateProjectionMatrix()
  }, [camera])
  useFrame(() => {
    if (taken.current) return
    gl.render(scene, camera)
    // the canvas is sized from its container a frame or two after mounting, and geometry needs a
    // frame to upload, so wait for both before taking the picture
    if (gl.domElement.width < STUDIO_SIZE || ++frames.current < 3) return
    taken.current = true
    const out = document.createElement('canvas')
    out.width = gl.domElement.width
    out.height = gl.domElement.height
    out.getContext('2d').drawImage(gl.domElement, 0, 0)
    onShot(out)
  }, 1)
  return null
}

export default function PhotoStudio({ config, onShot }) {
  return (
    <div className="photo-studio" aria-hidden>
      <Canvas dpr={1} gl={{ preserveDrawingBuffer: true, alpha: true, antialias: true }} camera={CAMERA}>
        <StudioLights />
        <group rotation={[0, -0.3, 0]}>
          <Bommai config={config} idle={false} />
        </group>
        <Shutter onShot={onShot} />
      </Canvas>
    </div>
  )
}
