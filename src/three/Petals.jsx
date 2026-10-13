import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// A short, gentle shower of marigold and jasmine petals over a freshly placed Bommai.
const COLORS = ['#f6b928', '#f08a24', '#e8601c', '#fbf6ea', '#c8323a']
const N = 70

export default function Petals({ center = [0, 3, 0] }) {
  const ref = useRef()
  const start = useRef(null)
  const parts = useMemo(
    () =>
      Array.from({ length: N }, () => ({
        x: (Math.random() - 0.5) * 3.2,
        z: (Math.random() - 0.5) * 1.6,
        y: 2.2 + Math.random() * 1.8,
        speed: 0.7 + Math.random() * 0.6,
        spin: (Math.random() - 0.5) * 6,
        sway: Math.random() * Math.PI * 2,
      })),
    [],
  )
  const geo = useMemo(() => new THREE.CircleGeometry(0.05, 5), [])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.7, transparent: true }), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const setRef = (m) => {
    if (!m || ref.current === m) return
    ref.current = m
    const c = new THREE.Color()
    for (let i = 0; i < N; i++) m.setColorAt(i, c.set(COLORS[i % COLORS.length]))
    m.instanceColor.needsUpdate = true
  }
  useFrame(({ clock }) => {
    const m = ref.current
    if (!m) return
    if (start.current == null) start.current = clock.elapsedTime
    const t = clock.elapsedTime - start.current
    mat.opacity = Math.max(0, Math.min(1, 3.6 - t))
    parts.forEach((p, i) => {
      const y = p.y - t * p.speed
      dummy.position.set(center[0] + p.x + Math.sin(t * 2 + p.sway) * 0.15, center[1] + Math.max(y, 0.03), center[2] + p.z)
      dummy.rotation.set(t * p.spin, p.sway + t, 0)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={setRef} args={[geo, mat, N]} frustumCulled={false} />
}
