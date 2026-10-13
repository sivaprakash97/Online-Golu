import { RBox, Ball, Gem, Cone, Cyl, Torus, Disc } from '../prims.jsx'

const STEEL = { rough: 0.22, metal: 0.85 }
const WOOD = '#b9733f'

// Each accessory is drawn around its grip point. `mode` says how it is being carried:
// hand | clasp | chest | tuck | head | back | ground (see carryMode in Bommai.jsx).
export default function Accessory({ id, mode, torso }) {
  switch (id) {
    case 'filter-coffee':
      return (
        <group position={[0, 0.02, 0.05]}>
          <Cyl rt={0.06} rb={0.05} h={0.035} position={[0, -0.03, 0]} color="#cfd3d6" mat={STEEL} />
          <Cyl rt={0.036} rb={0.028} h={0.1} position={[0, 0.03, 0]} color="#dfe2e4" mat={STEEL} />
          <Disc r={0.033} position={[0, 0.081, 0]} rotation={[-Math.PI / 2, 0, 0]} color="#8a5a35" />
        </group>
      )

    case 'laptop':
      if (mode === 'chest')
        return (
          <group rotation={[0.15, 0, 0]}>
            <RBox size={[0.32, 0.022, 0.21]} r={0.008} position={[0, 0, 0]} color="#b9bcc4" mat={{ rough: 0.35, metal: 0.4 }} />
            <group position={[0, 0.01, 0.1]} rotation={[-0.25, 0, 0]}>
              <RBox size={[0.32, 0.22, 0.016]} r={0.008} position={[0, 0.11, 0]} color="#c9ccd3" mat={{ rough: 0.35, metal: 0.4 }} />
              <Disc r={0.03} position={[0, 0.12, 0.0095]} color="#f2a541" />
              <Disc r={0.016} position={[0.07, 0.17, 0.0095]} color="#5fb3a1" />
            </group>
          </group>
        )
      // tucked under the arm: closed, standing on its long edge
      return (
        <group>
          <RBox size={[0.032, 0.2, 0.28]} r={0.01} color="#b9bcc4" mat={{ rough: 0.35, metal: 0.4 }} />
          <Disc r={0.022} position={[0.0165, 0.01, 0]} rotation={[0, Math.PI / 2, 0]} color="#f2a541" />
        </group>
      )

    case 'guitar':
      return (
        <group position={[0, -0.04, 0.05]} rotation={[0, 0, -0.85]}>
          <Cyl rt={0.13} h={0.06} s={14} position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]} color="#c9783a" mat={{ rough: 0.45 }} />
          <Cyl rt={0.1} h={0.06} s={14} position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]} color="#c9783a" mat={{ rough: 0.45 }} />
          <Disc r={0.04} position={[0, -0.03, 0.031]} color="#2a1a12" />
          <RBox size={[0.06, 0.02, 0.012]} r={0.004} position={[0, -0.14, 0.034]} color="#3b2618" />
          <RBox size={[0.05, 0.34, 0.03]} r={0.01} position={[0, 0.27, 0.01]} color="#5a3720" />
          <RBox size={[0.07, 0.09, 0.03]} r={0.012} position={[0, 0.47, 0.01]} color="#2b1b12" />
        </group>
      )

    case 'book':
      if (mode === 'chest')
        return (
          <group position={[0, 0.02, 0.02]} rotation={[-0.2, 0, 0]}>
            <RBox size={[0.21, 0.27, 0.055]} r={0.012} color="#2f6f9c" />
            <RBox size={[0.19, 0.25, 0.06]} r={0.006} position={[0.012, 0, 0]} color="#f5ecd6" />
            <RBox size={[0.12, 0.03, 0.01]} r={0.004} position={[0, 0.06, 0.03]} color="#e8b33c" />
          </group>
        )
      // tucked under the arm, cover facing out
      return (
        <group rotation={[0, Math.PI / 2, 0]}>
          <RBox size={[0.19, 0.24, 0.05]} r={0.012} color="#2f6f9c" />
          <RBox size={[0.17, 0.22, 0.055]} r={0.006} position={[-0.012, 0, 0]} color="#f5ecd6" />
          <RBox size={[0.1, 0.025, 0.01]} r={0.004} position={[0, 0.05, 0.026]} color="#e8b33c" />
        </group>
      )

    case 'camera': {
      const cam = (
        <group>
          <RBox size={[0.2, 0.13, 0.09]} r={0.02} color="#2b2c33" mat={{ rough: 0.4 }} />
          <RBox size={[0.06, 0.04, 0.06]} r={0.012} position={[-0.05, 0.08, 0]} color="#2b2c33" />
          <Cyl rt={0.052} h={0.07} s={14} position={[0.015, -0.005, 0.07]} rotation={[Math.PI / 2, 0, 0]} color="#3d3f48" />
          <Disc r={0.038} position={[0.015, -0.005, 0.106]} color="#1a3a5c" mat={{ rough: 0.1, metal: 0.5 }} />
          <Disc r={0.012} position={[0.03, 0.01, 0.107]} color="#ffffff" />
          <RBox size={[0.03, 0.02, 0.02]} r={0.006} position={[0.07, 0.075, 0]} color="#c8323a" />
        </group>
      )
      if (mode === 'chest') return <group position={[0, 0.0, 0.04]}>{cam}</group>
      return (
        <group>
          <group position={[0, -0.1, 0.02]} scale={0.8}>{cam}</group>
        </group>
      )
    }

    case 'controller':
      return (
        <group position={[0, mode === 'chest' ? 0 : -0.01, 0.04]} rotation={mode === 'chest' || mode === 'clasp' ? [0.7, 0, 0] : [0.2, Math.PI / 2, 0]}>
          <RBox size={[0.2, 0.05, 0.1]} r={0.022} color="#3b3e4a" />
          <Ball r={0.042} position={[0.085, -0.008, -0.03]} color="#3b3e4a" />
          <Ball r={0.042} position={[-0.085, -0.008, -0.03]} color="#3b3e4a" />
          <Ball r={0.012} position={[0.06, 0.028, 0.012]} color="#e05a47" />
          <Ball r={0.012} position={[0.08, 0.028, -0.008]} color="#f2c14e" />
          <Ball r={0.012} position={[0.04, 0.028, -0.008]} color="#5fb3a1" />
          <RBox size={[0.05, 0.012, 0.016]} r={0.004} position={[-0.06, 0.029, 0]} color="#1c1d22" />
          <RBox size={[0.016, 0.012, 0.05]} r={0.004} position={[-0.06, 0.029, 0]} color="#1c1d22" />
        </group>
      )

    case 'cricket-bat':
      return (
        <group position={[0, 0, 0.04]} rotation={mode === 'clasp' ? [0.12, 0, 0] : [0.25, 0, 0.1]}>
          <Cyl rt={0.02} h={0.14} position={[0, 0.02, 0]} color="#2f6f9c" />
          <RBox size={[0.08, 0.36, 0.035]} r={0.012} position={[0, -0.22, 0]} color="#e6c98f" />
          <RBox size={[0.082, 0.04, 0.037]} r={0.01} position={[0, -0.16, 0]} color="#c8323a" />
        </group>
      )

    case 'headphones':
      return (
        <group position={[0, 0.02, -0.01]}>
          <Torus r={0.255} t={0.022} rs={6} ts={16} arc={Math.PI} color="#2b2c33" />
          <Cyl rt={0.075} h={0.06} s={12} position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]} color="#e5734f" />
          <Cyl rt={0.075} h={0.06} s={12} position={[-0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]} color="#e5734f" />
        </group>
      )

    case 'backpack': {
      const [tw, th, td, ty] = torso
      return (
        <group>
          <RBox size={[tw * 0.86, th * 1.05, 0.14]} r={0.045} position={[0, ty, -td / 2 - 0.065]} color="#d9643a" />
          <RBox size={[tw * 0.6, th * 0.42, 0.05]} r={0.02} position={[0, ty - th * 0.2, -td / 2 - 0.15]} color="#b84f2c" />
          <RBox size={[0.04, th * 0.6, 0.02]} r={0.008} position={[tw * 0.27, ty + th * 0.2, td / 2 + 0.006]} color="#8c3a20" />
          <RBox size={[0.04, th * 0.6, 0.02]} r={0.008} position={[-tw * 0.27, ty + th * 0.2, td / 2 + 0.006]} color="#8c3a20" />
        </group>
      )
    }

    case 'plant':
      return (
        <group>
          <Cyl rt={0.095} rb={0.07} h={0.13} s={8} position={[0, 0.065, 0]} color="#c4643a" mat={{ flat: true }} />
          <Cyl rt={0.105} h={0.03} s={8} position={[0, 0.13, 0]} color="#d47549" mat={{ flat: true }} />
          {[
            [0, 0.27, 0, 0, 0],
            [0.07, 0.22, 0.02, 0, -0.6],
            [-0.07, 0.22, 0.02, 0, 0.6],
            [0.02, 0.21, 0.08, 0.6, 0],
            [-0.02, 0.21, -0.08, -0.6, 0],
          ].map(([x, y, z, rx, rz], i) => (
            <Ball key={i} r={0.07} w={6} hs={4} position={[x, y, z]} rotation={[rx, 0, rz]} scale={[0.55, 1.2, 0.25]} color={i % 2 ? '#3f9b4b' : '#2f7d3d'} mat={{ flat: true }} />
          ))}
        </group>
      )

    case 'cat':
      return (
        <group rotation={[0, -0.4, 0]}>
          <RBox size={[0.14, 0.14, 0.18]} r={0.05} position={[0, 0.07, 0]} color="#e09a4f" />
          <RBox size={[0.15, 0.13, 0.12]} r={0.045} position={[0, 0.2, 0.05]} color="#e09a4f" />
          <Cone r={0.03} h={0.06} s={4} position={[0.045, 0.28, 0.04]} color="#e09a4f" />
          <Cone r={0.03} h={0.06} s={4} position={[-0.045, 0.28, 0.04]} color="#e09a4f" />
          <Ball r={0.012} position={[0.035, 0.21, 0.112]} color="#2a1b17" shadow={false} />
          <Ball r={0.012} position={[-0.035, 0.21, 0.112]} color="#2a1b17" shadow={false} />
          <Ball r={0.01} position={[0, 0.185, 0.113]} color="#e58aa0" shadow={false} />
          <Cyl rt={0.02} rb={0.025} h={0.18} position={[0.07, 0.08, -0.1]} rotation={[0.6, 0, -0.5]} color="#c97f37" />
        </group>
      )

    case 'dog':
      return (
        <group rotation={[0, -0.4, 0]}>
          <RBox size={[0.16, 0.16, 0.22]} r={0.055} position={[0, 0.08, 0]} color="#e8d2a6" />
          <RBox size={[0.17, 0.15, 0.15]} r={0.05} position={[0, 0.22, 0.06]} color="#e8d2a6" />
          <RBox size={[0.09, 0.06, 0.08]} r={0.025} position={[0, 0.19, 0.15]} color="#f3e6c7" />
          <Ball r={0.018} position={[0, 0.21, 0.19]} color="#2a1b17" />
          <RBox size={[0.04, 0.1, 0.06]} r={0.018} position={[0.1, 0.22, 0.04]} rotation={[0, 0, -0.25]} color="#9c6a3c" />
          <RBox size={[0.04, 0.1, 0.06]} r={0.018} position={[-0.1, 0.22, 0.04]} rotation={[0, 0, 0.25]} color="#9c6a3c" />
          <Ball r={0.013} position={[0.04, 0.25, 0.133]} color="#2a1b17" shadow={false} />
          <Ball r={0.013} position={[-0.04, 0.25, 0.133]} color="#2a1b17" shadow={false} />
          <RBox size={[0.1, 0.025, 0.08]} r={0.01} position={[0, 0.15, 0.06]} color="#c8323a" />
          <Cyl rt={0.018} rb={0.022} h={0.12} position={[0, 0.16, -0.14]} rotation={[-0.7, 0, 0]} color="#e8d2a6" />
        </group>
      )

    case 'flowers':
      return (
        <group position={[0, 0.03, 0.05]} rotation={[0.15, 0, 0]}>
          <Cone r={0.06} h={0.16} s={6} position={[0, 0.02, 0]} rotation={[Math.PI, 0, 0]} color="#5c9a3e" mat={{ flat: true }} />
          {[
            [0, 0.14, 0, '#f08a24'],
            [0.05, 0.12, 0.02, '#f6b928'],
            [-0.05, 0.12, 0.02, '#f6b928'],
            [0.03, 0.12, -0.04, '#f08a24'],
            [-0.03, 0.13, -0.04, '#e8601c'],
            [0, 0.11, 0.05, '#e8601c'],
          ].map(([x, y, z, c], i) => (
            <Gem key={i} r={0.04} position={[x, y, z]} rotation={[i, i, 0]} color={c} />
          ))}
        </group>
      )

    case 'paintbrush':
      return (
        <group position={[0, 0.02, 0.04]} rotation={[0.4, 0, -0.3]}>
          <Cyl rt={0.012} rb={0.016} h={0.2} position={[0, 0.02, 0]} color="#e8b33c" />
          <Cyl rt={0.016} h={0.04} position={[0, 0.14, 0]} color="#cfd3d6" mat={STEEL} />
          <Cone r={0.02} h={0.06} s={6} position={[0, 0.19, 0]} color="#2f6fd0" />
        </group>
      )

    case 'ice-cream':
      return (
        <group position={[0, 0.02, 0.04]}>
          <Cyl rt={0.008} h={0.1} position={[0, 0, 0]} color="#d9b98b" />
          <Cyl rt={0.03} rb={0.042} h={0.14} s={8} position={[0, 0.11, 0]} color="#f0c75e" mat={{ flat: true }} />
          <Ball r={0.03} w={8} hs={6} position={[0, 0.18, 0]} color="#f0c75e" />
          <Ball r={0.008} position={[0.02, 0.15, 0.03]} color="#8bc34a" />
          <Ball r={0.008} position={[-0.02, 0.12, 0.035]} color="#8bc34a" />
          <Ball r={0.008} position={[0.01, 0.19, 0.022]} color="#c8323a" />
        </group>
      )

    default:
      return null
  }
}
