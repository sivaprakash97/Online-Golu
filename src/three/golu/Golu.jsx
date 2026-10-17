import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { GOLU } from './layout.js'
import VoxelModel, { voxelGeometry } from '../voxel/VoxelModel.jsx'
import { VOXEL_MATERIALS } from '../voxel/mesh.js'
import { VOXEL } from '../bommai/dims.js'
import { S, stepDims, buildStep, buildDiamond, FLOOR, buildFloor, WALL, WALL_S, buildWall, buildPillar, BEAM, buildBeam, buildToran, buildGarlands, buildBanana, goluTheme } from './stage.js'
import { PIECES, Lamp, LampLight, KUTHUVILAKKU } from '../traditional/Pieces.jsx'

// The Golu and its room, drawn in voxels like the Bommais (see stage.js and traditional/pieces.js).

const { H, D } = GOLU // widths taper: GOLU.width(k)

// Replaceable slots for the foundation pieces on each Golu (by Golu number). Swap `piece` for the
// owner's own figurines (e.g. a glTF component) without touching anything else; `flip` mirrors a
// piece. The kuthuvilakkus stay at x = ±3.9 on every Golu: their flames' lights (GoluLights) are
// fixed in the room.
export const TRADITIONAL_SLOTS = {
  1: [
    { step: 9, x: -3.9, piece: 'kuthuvilakku' },
    { step: 9, x: -2.1, piece: 'mandapam' },
    { step: 9, x: 0, piece: 'kalasam' },
    { step: 9, x: 2.1, piece: 'mandapam' },
    { step: 9, x: 3.9, piece: 'kuthuvilakku' },
    { step: 8, x: -3.8, piece: 'elephant' },
    { step: 8, x: -1.9, piece: 'marapachi' },
    { step: 8, x: 0, piece: 'brass-vessels' },
    { step: 8, x: 1.9, piece: 'chettiar-shop' },
    { step: 8, x: 3.8, piece: 'peacock' },
  ],
  2: [
    { step: 9, x: -3.9, piece: 'kuthuvilakku' },
    { step: 9, x: -2, piece: 'kalasam' },
    { step: 9, x: 0, piece: 'mandapam' },
    { step: 9, x: 2, piece: 'kalasam' },
    { step: 9, x: 3.9, piece: 'kuthuvilakku' },
    { step: 8, x: -3.8, piece: 'peacock', flip: true },
    { step: 8, x: -1.9, piece: 'chettiar-shop' },
    { step: 8, x: 0, piece: 'marapachi' },
    { step: 8, x: 1.9, piece: 'brass-vessels' },
    { step: 8, x: 3.8, piece: 'elephant', flip: true },
  ],
}
const slotsFor = (golu) => TRADITIONAL_SLOTS[golu] || TRADITIONAL_SLOTS[1]
const FLOOR_LAMPS = [-4.4, 4.4].map((x) => [x, 0, 2.2])

// One step, fitted exactly to its width, rise and depth so Bommais stand on its tread.
function Step({ k, theme }) {
  const { nx, ny, nz } = stepDims(k)
  const depth = GOLU.front(k) - GOLU.backZ
  return (
    <VoxelModel
      id={`step-${k}${theme.key}`}
      build={() => buildStep(k, theme)}
      size={[GOLU.width(k) / nx, H / ny, depth / nz]}
      position={[0, (k - 1) * H, GOLU.front(k) - depth / 2]}
    />
  )
}

function TierGlow({ y, front, locked, selected, W }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.material.opacity = (selected ? 0.6 : 0.38) + Math.sin(clock.elapsedTime * 5) * 0.12
  })
  const color = locked ? '#5fa7a8' : '#ffb300'
  return (
    <group>
      <mesh ref={ref} position={[0, y + 0.034, front - D / 2 + 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W - 0.3, D - 0.05]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* glowing lip along the step edge */}
      <mesh position={[0, y + 0.03, front + 0.03]}>
        <boxGeometry args={[W - 0.25, 0.05, 0.05]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  )
}

function TierHitZone({ k, state, onOver, onOut, onPick }) {
  const W = GOLU.width(k)
  const front = GOLU.front(k)
  const y = GOLU.top(k)
  const locked = k >= 8
  return (
    <group>
      <mesh
        position={[0, y + 0.55, front - D / 2]}
        onPointerOver={(e) => (e.stopPropagation(), onOver?.(k))}
        onPointerOut={(e) => (e.stopPropagation(), onOut?.(k))}
        onClick={(e) => (e.stopPropagation(), onPick?.(k))}
      >
        <boxGeometry args={[W, 1.1, D]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      {state && <TierGlow y={y} front={front} locked={locked || state === 'full'} selected={state === 'selected'} W={W} />}
    </group>
  )
}

// A sparse row of small gold diamonds along every riser (one instanced mesh for all nine steps).
function RiserDiamonds() {
  const geo = useMemo(() => voxelGeometry('riser-diamond', buildDiamond), [])
  const spots = useMemo(() => {
    const out = []
    for (let k = 1; k <= GOLU.steps; k++) {
      const W = GOLU.width(k)
      const n = Math.round(W * 2.1)
      for (let i = 0; i < n; i++) out.push([-W / 2 + 0.55 + (i * (W - 1.1)) / (n - 1), (k - 1) * H + H * 0.42 - 3.5 * VOXEL, GOLU.front(k)])
    }
    return out
  }, [])
  const setRef = (m) => {
    if (!m || m.userData.placed) return
    m.userData.placed = true
    const o = new THREE.Object3D()
    spots.forEach((p, i) => {
      o.position.set(...p)
      o.scale.setScalar(VOXEL)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  }
  return <instancedMesh ref={setRef} args={[geo, VOXEL_MATERIALS, spots.length]} />
}

// Marigold swags sway a little in the breeze.
function Garlands({ z }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.8) * 0.015
  })
  const origin = [0, 5.5]
  const build = () =>
    buildGarlands(
      origin,
      [
        { from: [-7.5, 7.3], to: [0, 7.3], sag: 0.7 },
        { from: [0, 7.3], to: [7.5, 7.3], sag: 0.7 },
      ],
      [-7.5, 7.5].map((x) => ({ x, top: 7.14, length: 1.6 })),
    )
  return (
    <group ref={ref} position={[0, 7.3, z]}>
      <VoxelModel id="garlands" build={build} size={S} position={[0, origin[1] - 7.3, 0]} cast={false} />
    </group>
  )
}

function Room({ theme, lights }) {
  const backZ = GOLU.backZ - 0.25
  const floorZ = backZ + 6.75 - 0.2
  const kolamZ = Math.round((2.1 - floorZ) / S)
  return (
    <group>
      {/* the red-oxide floor, with the kolam in front of the Golu */}
      <VoxelModel id="floor" build={() => buildFloor(kolamZ)} size={[19.4 / FLOOR.nx, 0.5 / FLOOR.ny, 13.5 / FLOOR.nz]} position={[0, -0.5, floorZ]} cast={false} />
      {/* back wall with the painted arch */}
      <VoxelModel id={`wall${theme.key}`} build={() => buildWall(theme)} size={WALL_S} position={[0, 0, backZ - (WALL.nz / 2) * WALL_S]} />
      {/* pillars, the beam across them, the toran and the marigold garlands */}
      {[-7.8, 7.8].map((x) => (
        <VoxelModel key={x} id="pillar" build={buildPillar} size={S} position={[x, 0, backZ + 0.45]} />
      ))}
      <VoxelModel id="beam" build={buildBeam} size={S} position={[0, 7.9 - (BEAM.ny / 2) * S, backZ + 0.45]} />
      <VoxelModel id="toran" build={() => buildToran(15.2)} size={S} position={[0, 7.66 - 12 * S, backZ + 0.75]} cast={false} />
      <Garlands z={backZ + 0.85} />
      {/* banana plants flank the Golu */}
      <VoxelModel id="banana" build={buildBanana} size={S} position={[-8.1, 0, 0.6]} />
      <VoxelModel id="banana" build={buildBanana} size={S} position={[8.1, 0, 0.6]} rotation={[0, Math.PI, 0]} />
      {/* floor lamps */}
      {FLOOR_LAMPS.map((p) => (
        <group key={p[0]} position={p}>
          <Lamp stem={52} light={lights} />
        </group>
      ))}
    </group>
  )
}

const pieceAt = (s) => [s.x, GOLU.top(s.step) + 0.025, GOLU.standZ(s.step)]

function TraditionalPieces({ golu, lights }) {
  return slotsFor(golu).map((s, i) => {
    const Piece = PIECES[s.piece]
    return (
      <group key={i} position={pieceAt(s)} scale={[s.flip ? -1.2 : 1.2, 1.2, 1.2]}>
        <Piece light={lights} />
      </group>
    )
  })
}

// The flickering lights of the floor lamps and the lamps on the top step, fixed in the room: on the
// carousel the Golus turn but these stay put (see LampLight), lighting whichever Golu faces you.
export function GoluLights() {
  return (
    <>
      {FLOOR_LAMPS.map((p) => (
        <group key={p[0]} position={p}>
          <LampLight stem={52} />
        </group>
      ))}
      {slotsFor(1)
        .filter((s) => s.piece === 'kuthuvilakku')
        .map((s) => (
          <group key={s.x} position={pieceAt(s)} scale={1.2}>
            <LampLight {...KUTHUVILAKKU} />
          </group>
        ))}
    </>
  )
}

// `golu` picks the colours and the traditional pieces; `lights={false}` leaves the lamps' lights
// to GoluLights.
export default function Golu({ golu = 1, lights = true, tierStates = {}, onTierOver, onTierOut, onTierPick, interactive }) {
  const steps = Array.from({ length: GOLU.steps }, (_, i) => i + 1)
  const theme = goluTheme(golu)
  return (
    <group>
      <Room theme={theme} lights={lights} />
      {steps.map((k) => (
        <Step key={k} k={k} theme={theme} />
      ))}
      <RiserDiamonds />
      <TraditionalPieces golu={golu} lights={lights} />
      {interactive &&
        steps.map((k) => <TierHitZone key={k} k={k} state={tierStates[k]} onOver={onTierOver} onOut={onTierOut} onPick={onTierPick} />)}
    </group>
  )
}

