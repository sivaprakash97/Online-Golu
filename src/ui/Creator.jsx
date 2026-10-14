import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import Bommai from '../three/bommai/Bommai.jsx'
import { Cyl, Torus, GOLD } from '../three/prims.jsx'
import { useThumb } from '../three/Thumbnails.jsx'
import SoftEnv from '../three/SoftEnv.jsx'
import {
  SKIN_TONES,
  BODIES,
  HAIR_STYLES,
  HAIR_COLORS,
  OUTFITS,
  OUTFIT_COLORS,
  EYES,
  FACE_EXTRAS,
  ACCESSORIES,
  POSES,
  randomConfig,
} from '../data/options.js'

const CATEGORIES = [
  { id: 'body', label: 'Body', icon: '◐' },
  { id: 'hair', label: 'Hair', icon: '〰' },
  { id: 'outfit', label: 'Outfit', icon: '▲' },
  { id: 'face', label: 'Face', icon: '◉' },
  { id: 'accessory', label: 'Accessories', icon: '✦' },
  { id: 'pose', label: 'Pose', icon: '✋' },
]

function Tile({ selected, onClick, label, frame, config, multi }) {
  const url = useThumb(frame, config)
  return (
    <button className={`tile ${selected ? 'is-on' : ''}`} onClick={onClick} aria-pressed={selected}>
      <span className="tile-img">{url ? <img src={url} alt="" draggable={false} /> : <span className="tile-spin" />}</span>
      <span className="tile-label">{label}</span>
      {multi && <span className="tile-check">{selected ? '✓' : '+'}</span>}
    </button>
  )
}

function Swatches({ items, value, onPick, label }) {
  return (
    <div className="swatch-row" role="radiogroup" aria-label={label}>
      {items.map((s) => (
        <button
          key={s.id}
          className={`swatch ${value === s.id ? 'is-on' : ''}`}
          style={{ '--sw': s.color }}
          onClick={() => onPick(s.id)}
          aria-label={s.label || s.id}
          aria-checked={value === s.id}
          role="radio"
        />
      ))}
    </div>
  )
}

function Section({ title, children, aside }) {
  return (
    <section className="opt-section">
      <header>
        <h3>{title}</h3>
        {aside}
      </header>
      {children}
    </section>
  )
}

function Options({ cat, config, set }) {
  const grid = (items, field, frame) => (
    <div className="tile-grid">
      {items.map((o) => (
        <Tile key={o.id} label={o.label} frame={frame} config={{ ...config, [field]: o.id }} selected={config[field] === o.id} onClick={() => set({ [field]: o.id })} />
      ))}
    </div>
  )
  switch (cat) {
    case 'body':
      return (
        <>
          <Section title="Skin tone">
            <Swatches items={SKIN_TONES} value={config.skin_tone} onPick={(v) => set({ skin_tone: v })} label="Skin tone" />
          </Section>
          <Section title="Build">{grid(BODIES, 'body', 'full')}</Section>
        </>
      )
    case 'hair':
      return (
        <>
          <Section title="Colour">
            <Swatches items={HAIR_COLORS} value={config.hair_color} onPick={(v) => set({ hair_color: v })} label="Hair colour" />
          </Section>
          <Section title="Style">{grid(HAIR_STYLES, 'hair', 'hair')}</Section>
        </>
      )
    case 'outfit':
      return (
        <>
          <Section title="Colour">
            <Swatches items={OUTFIT_COLORS} value={config.outfit_color} onPick={(v) => set({ outfit_color: v })} label="Outfit colour" />
          </Section>
          <Section title="Style">
            <div className="tile-grid">
              {OUTFITS.map((o) => (
                <Tile
                  key={o.id}
                  label={o.label}
                  frame="full"
                  config={{ ...config, outfit: o.id, accessory: 'none', pose: 'standing' }}
                  selected={config.outfit === o.id}
                  onClick={() => set({ outfit: o.id })}
                />
              ))}
            </div>
          </Section>
        </>
      )
    case 'face':
      return (
        <>
          <Section title="Eyes">{grid(EYES, 'face', 'head')}</Section>
          <Section title="Extras" aside={<span className="hint">pick any</span>}>
            <div className="tile-grid">
              {FACE_EXTRAS.map((o) => {
                const on = config.face_extras.includes(o.id)
                return (
                  <Tile
                    key={o.id}
                    multi
                    label={o.label}
                    frame="head"
                    config={{ ...config, face_extras: [o.id] }}
                    selected={on}
                    onClick={() => {
                      let next = on ? config.face_extras.filter((e) => e !== o.id) : [...config.face_extras, o.id]
                      if (!on && o.id === 'glasses') next = next.filter((e) => e !== 'shades')
                      if (!on && o.id === 'shades') next = next.filter((e) => e !== 'glasses')
                      set({ face_extras: next })
                    }}
                  />
                )
              })}
            </div>
          </Section>
        </>
      )
    case 'accessory':
      return <Section title="Carry something">{grid(ACCESSORIES, 'accessory', 'full')}</Section>
    case 'pose':
      return <Section title="Pose">{grid(POSES, 'pose', 'full')}</Section>
    default:
      return null
  }
}

function PreviewBommai({ config, bump }) {
  const ref = useRef()
  const last = useRef({ bump, at: -10 })
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    if (last.current.bump !== bump) last.current = { bump, at: clock.elapsedTime }
    const t = clock.elapsedTime - last.current.at
    const hop = t < 0.45 ? Math.sin((t / 0.45) * Math.PI) * 0.12 : 0
    const sq = t < 0.6 ? Math.exp(-t * 8) * Math.sin(t * 30) * 0.06 : 0
    g.position.y = 0.11 + hop
    g.scale.set(1 + sq, 1 - sq, 1 + sq)
  })
  return (
    <group ref={ref}>
      <Bommai config={config} />
    </group>
  )
}

function Turntable() {
  const ref = useRef()
  useFrame((_, dt) => ref.current && (ref.current.rotation.y += dt * 0.2))
  return (
    <group ref={ref}>
      <Cyl rt={0.62} rb={0.68} h={0.1} s={32} position={[0, 0.05, 0]} color="#5e2f1b" receive mat={{ rough: 0.5 }} />
      <Torus r={0.63} t={0.015} rs={4} ts={40} position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} color="#e3a83a" mat={GOLD} />
      <Cyl rt={0.6} h={0.012} s={32} position={[0, 0.105, 0]} color="#8e1f2e" receive mat={{ rough: 0.6 }} />
    </group>
  )
}

function Preview({ config, bump }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ fov: 30, position: [0.6, 1.0, 3.3] }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, alpha: true }}>
      <hemisphereLight args={['#fff2dc', '#7a3a24', 0.9]} />
      <directionalLight position={[-2.5, 4, 3.5]} intensity={2.2} color="#ffe3bd" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} shadow-normalBias={0.02} />
      <directionalLight position={[3, 1.5, -2]} intensity={0.9} color="#ffb98a" />
      <SoftEnv intensity={0.25} />
      <Turntable />
      <PreviewBommai config={config} bump={bump} />
      <OrbitControls target={[0, 0.6, 0]} enablePan={false} enableZoom={false} minPolarAngle={1.0} maxPolarAngle={1.65} rotateSpeed={0.7} />
    </Canvas>
  )
}

export default function Creator({ initial, onBack, onDone, count }) {
  const [config, setConfig] = useState(initial)
  const [cat, setCat] = useState('body')
  const [bump, setBump] = useState(0)
  // the name tag is how friends find your Bommai, so it can't be left blank
  const [needName, setNeedName] = useState(false)
  const nameRef = useRef()
  const place = () => {
    const name = config.name.trim()
    if (!name) {
      setNeedName(true)
      nameRef.current?.focus()
      return
    }
    onDone({ ...config, name })
  }
  const set = (patch) => {
    setConfig((c) => ({ ...c, ...patch }))
    setBump((b) => b + 1)
  }
  const idx = CATEGORIES.findIndex((c) => c.id === cat)
  const gridRef = useRef()
  // braces matter: newer Chrome returns a Promise from scrollTo, and React would call it as the cleanup
  useEffect(() => {
    gridRef.current?.scrollTo({ top: 0 })
  }, [cat])

  return (
    <div className="creator">
      <header className="creator-top">
        <button className="btn-ghost" onClick={onBack}>
          <span aria-hidden>←</span> Golu
        </button>
        <div className="creator-title">
          <span className="eyebrow">Bommai workshop</span>
          <h2>Make your Bommai</h2>
        </div>
        <div className="creator-count">
          <b>{count}</b> already on the Golu
        </div>
      </header>

      <nav className="cat-rail" aria-label="Categories">
        {CATEGORIES.map((c, i) => (
          <button key={c.id} className={`cat ${cat === c.id ? 'is-on' : ''}`} onClick={() => setCat(c.id)}>
            <span className="cat-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="cat-label">{c.label}</span>
          </button>
        ))}
      </nav>

      <main className="opt-panel" ref={gridRef}>
        <div className="opt-head">
          <span className="eyebrow">
            {String(idx + 1).padStart(2, '0')} / {String(CATEGORIES.length).padStart(2, '0')}
          </span>
          <h3>{CATEGORIES[idx].label}</h3>
        </div>
        <Options cat={cat} config={config} set={set} />
        {idx < CATEGORIES.length - 1 && (
          <button className="btn-next" onClick={() => setCat(CATEGORIES[idx + 1].id)}>
            Next: {CATEGORIES[idx + 1].label} →
          </button>
        )}
      </main>

      <aside className="preview">
        <div className="preview-stage">
          <Preview config={config} bump={bump} />
          <button className="btn-dice" onClick={() => set(randomConfig(config.name))} title="Surprise me">
            <span aria-hidden>🎲</span> Surprise me
          </button>
        </div>
        <label className={`name-field ${needName ? 'is-missing' : ''}`}>
          <span>Name on the tag</span>
          <input
            ref={nameRef}
            value={config.name}
            maxLength={20}
            placeholder="Your name"
            required
            aria-invalid={needName}
            aria-describedby={needName ? 'name-hint' : undefined}
            onChange={(e) => {
              const name = e.target.value
              setConfig((c) => ({ ...c, name }))
              if (name.trim()) setNeedName(false)
            }}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
        </label>
        {needName && (
          <p className="name-hint" id="name-hint" role="alert">
            Add your name so friends can find your Bommai.
          </p>
        )}
        <button className="btn-primary btn-place" onClick={place}>
          Place my Bommai <span aria-hidden>→</span>
        </button>
      </aside>
    </div>
  )
}
