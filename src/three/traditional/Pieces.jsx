import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import VoxelModel from '../voxel/VoxelModel.jsx'
import { VOXEL } from '../bommai/dims.js'
import { buildLamp } from '../golu/stage.js'
import { buildKalasam, buildMandapam, buildMarapachi, buildElephant, buildShop, buildVessels, buildPeacock } from './pieces.js'

// Traditional pieces for the locked top tiers, in voxels like the Bommais. They sit in
// replaceable slots (see TRADITIONAL_SLOTS in Golu.jsx) so the project owner's own figurines can
// drop in later.

const LAMP_VOXEL = 0.016

// A brass kuthuvilakku whose five flames glow; with `light`, a flickering point light sits in them.
export function Lamp({ stem = 52, size = LAMP_VOXEL, light = false }) {
  const ref = useRef()
  const seed = useRef(Math.random() * 10)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime * 9 + seed.current
    ref.current.intensity = 1.6 * (1 + Math.sin(t) * 0.08 + Math.sin(t * 2.3) * 0.06)
  })
  return (
    <group>
      <VoxelModel id={`lamp-${stem}`} build={() => buildLamp(stem)} size={size} />
      {light && <pointLight ref={ref} color="#ffb35c" intensity={1.6} distance={3.2} decay={2} position={[0, (stem + 15) * size, 0.1]} />}
    </group>
  )
}

const piece = (id, build, props = {}) =>
  function Piece() {
    return <VoxelModel id={id} build={build} size={VOXEL} {...props} />
  }

export const PIECES = {
  kalasam: piece('kalasam', () => buildKalasam(1.35)),
  kuthuvilakku: () => <Lamp stem={34} size={LAMP_VOXEL / 1.2} light />,
  mandapam: piece('mandapam', buildMandapam),
  marapachi: piece('marapachi', buildMarapachi),
  elephant: piece('elephant', buildElephant, { rotation: [0, 0.5, 0] }),
  'chettiar-shop': piece('chettiar-shop', buildShop),
  'brass-vessels': piece('brass-vessels', buildVessels),
  peacock: piece('peacock', buildPeacock, { rotation: [0, -0.4, 0] }),
}
