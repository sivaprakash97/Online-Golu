import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import Bommai from './bommai/Bommai.jsx'
import SoftEnv from './SoftEnv.jsx'

// Renders option tiles as real little 3D renders of the Bommai, one frame per tile, on a
// single hidden canvas. Results are cached by (framing + config).
const ThumbCtx = createContext(null)
const cache = new Map()

const FRAMES = {
  full: { pos: [0.55, 0.68, 2.55], look: [0, 0.5, 0], rotY: -0.25 },
  head: { pos: [0.35, 0.9, 1.25], look: [0, 0.8, 0], rotY: -0.35 },
  hair: { pos: [0.95, 0.85, 1.3], look: [0, 0.68, -0.05], rotY: -0.6 },
}

function Worker({ job, onDone }) {
  const { gl, camera, scene } = useThree()
  const mounted = useRef(null)
  const frames = useRef(0)
  useLayoutEffect(() => {
    if (!job) return
    const f = FRAMES[job.frame] || FRAMES.full
    camera.position.set(...f.pos)
    camera.lookAt(...f.look)
    camera.updateProjectionMatrix()
    mounted.current = job.key
    frames.current = 0
  }, [job, camera])
  useFrame(() => {
    if (!job || mounted.current !== job.key) return
    gl.render(scene, camera)
    // wait one extra frame so geometry uploads before capture
    if (++frames.current < 2) return
    onDone(job.key, gl.domElement.toDataURL('image/png'))
  }, 1)
  if (!job) return null
  const f = FRAMES[job.frame] || FRAMES.full
  return (
    <group rotation={[0, f.rotY, 0]}>
      <Bommai config={job.config} idle={false} />
    </group>
  )
}

export function ThumbnailProvider({ children }) {
  const [queue, setQueue] = useState([])
  const [version, force] = useState(0)
  const pending = useRef(new Set())

  const request = useCallback((key, frame, config) => {
    if (cache.has(key) || pending.current.has(key)) return
    pending.current.add(key)
    setQueue((q) => [...q, { key, frame, config }])
  }, [])

  const done = useCallback((key, url) => {
    cache.set(key, url)
    pending.current.delete(key)
    setQueue((q) => q.filter((j) => j.key !== key))
    force((n) => n + 1)
  }, [])

  return (
    <ThumbCtx.Provider value={useMemo(() => ({ request, version }), [request, version])}>
      {children}
      <div className="thumb-factory" aria-hidden>
        <Canvas
          dpr={1}
          gl={{ preserveDrawingBuffer: true, alpha: true, antialias: true }}
          camera={{ fov: 30, near: 0.05, far: 20 }}
          frameloop={queue.length ? 'always' : 'never'}
        >
          <hemisphereLight args={['#fff2dc', '#8a4a30', 1.1]} />
          <directionalLight position={[-2, 4, 4]} intensity={2.1} color="#ffe6c4" />
          <directionalLight position={[3, 1, 2]} intensity={0.5} />
          <SoftEnv intensity={0.25} />
          <Worker job={queue[0]} onDone={done} />
        </Canvas>
      </div>
    </ThumbCtx.Provider>
  )
}

export function useThumb(frame, config) {
  const { request } = useContext(ThumbCtx) || {}
  // the name doesn't change how a Bommai looks, so typing it must not invalidate every tile
  const { name, ...look } = config
  const key = frame + JSON.stringify(look)
  const url = cache.get(key)
  useLayoutEffect(() => {
    if (!url) request?.(key, frame, look)
  })
  return url
}
