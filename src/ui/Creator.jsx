import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import Bommai from '../three/bommai/Bommai.jsx'
import { Cyl, Torus, GOLD } from '../three/prims.jsx'
import { useThumb } from '../three/Thumbnails.jsx'
import SoftEnv from '../three/SoftEnv.jsx'
import { MAX_DPR, PORTRAIT, useMedia } from '../lib/device.js'
import {
  SKIN_TONES,
  BODIES,
  HAIR_STYLES,
  HAIR_COLORS,
  HIJAB,
  OUTFITS,
  OUTFIT_COLORS,
  EYES,
  FACE_EXTRAS,
  HEADWEAR,
  ACCESSORIES,
  PETS,
  POSES,
  randomConfig,
  pairColor,
  showsPair,
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

// `paired`: two-tone outfits show each colour with its pair (the blouse, davani or top), split corner to corner
function Swatches({ items, value, onPick, label, paired = false }) {
  return (
    <div className="swatch-row" role="radiogroup" aria-label={label}>
      {items.map((s) => (
        <button
          key={s.id}
          className={`swatch ${value === s.id ? 'is-on' : ''}`}
          style={{ '--sw': paired ? `linear-gradient(135deg, ${s.color} 0 58%, ${pairColor(s.id)} 58% 100%)` : s.color }}
          onClick={() => onPick(s.id)}
          aria-label={paired ? `${s.label || s.id} with ${s.pair}` : s.label || s.id}
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

// Accessories has a lot in it, so it is split into tabs: what's worn, what's carried, and companions (the pets)
const ACCESSORY_TABS = [
  { id: 'headwear', label: 'Headwear' },
  { id: 'carry', label: 'Carriable' },
  { id: 'pets', label: 'Companions' },
]

function Accessories({ config, set, setHeadwear, grid }) {
  const [tab, setTab] = useState('headwear')
  return (
    <>
      <div className="sub-tabs" role="tablist" aria-label="Accessories">
        {ACCESSORY_TABS.map((t) => (
          <button
            key={t.id}
            className={`sub-tab ${tab === t.id ? 'is-on' : ''}`}
            role="tab"
            aria-selected={tab === t.id}
            onClick={(e) => {
              setTab(t.id)
              e.currentTarget.closest('.opt-panel')?.scrollTo({ top: 0 })
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'headwear' && <div className="sub-panel">{grid(HEADWEAR, 'headwear', 'full', setHeadwear)}</div>}
      {tab === 'carry' && <div className="sub-panel">{grid(ACCESSORIES, 'accessory', 'full')}</div>}
      {tab === 'pets' && (
        <div className="sub-panel">
          <p className="hint">Next to you on the floor, up on your head, or floating over it.</p>
          {/* what's carried is left out of the tiles: set down on the floor, it would crowd the pet or hide it */}
          <div className="tile-grid">
            {PETS.map((o) => (
              <Tile key={o.id} label={o.label} frame={o.at === 'floor' ? 'beside' : o.at ? 'crown' : 'full'} config={{ ...config, accessory: 'none', pet: o.id }} selected={config.pet === o.id} onClick={() => set({ pet: o.id })} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function Options({ cat, config, set }) {
  const grid = (items, field, frame, pick = (id) => set({ [field]: id })) => (
    <div className="tile-grid">
      {items.map((o) => (
        <Tile key={o.id} label={o.label} frame={frame} config={{ ...config, [field]: o.id }} selected={config[field] === o.id} onClick={() => pick(o.id)} />
      ))}
    </div>
  )
  // putting on a hijab takes off the bindi (every new Bommai starts with one) and vibhuti; they can
  // go back on under Face
  const setHeadwear = (id) => set({ headwear: id, ...(id === HIJAB.id ? { face_extras: config.face_extras.filter((e) => e !== 'bindi' && e !== 'namam') } : {}) })
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
          {config.headwear === HIJAB.id && <p className="hint">Your hijab is covering the hair. Take it off under Accessories to see it.</p>}
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
            <Swatches items={OUTFIT_COLORS} value={config.outfit_color} onPick={(v) => set({ outfit_color: v })} label="Outfit colour" paired={showsPair(config.outfit)} />
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
      return <Accessories config={config} set={set} setHeadwear={setHeadwear} grid={grid} />
    case 'pose':
      return <Section title="Pose">{grid(POSES, 'pose', 'full')}</Section>
    default:
      return null
  }
}

function PreviewBommai({ config }) {
  return (
    <group position={[0, 0.11, 0]}>
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

// The preview on a phone is small: it comes in a little closer ('near'), and on the Hair and Face
// tabs it moves in on the head.
const FRAMING = { full: { y: 0.6, dist: 3.378 }, near: { y: 0.62, dist: 2.9 }, head: { y: 0.78, dist: 2.1 } }

function Framing({ framing }) {
  const { camera, controls } = useThree()
  const off = useMemo(() => new THREE.Vector3(), [])
  useFrame((_, dt) => {
    if (!controls) return
    const f = FRAMING[framing]
    off.copy(camera.position).sub(controls.target)
    const d = off.length()
    if (Math.abs(f.y - controls.target.y) < 1e-3 && Math.abs(f.dist - d) < 1e-3) return
    const k = 1 - Math.exp(-dt * 6)
    controls.target.y += (f.y - controls.target.y) * k
    off.setLength(d + (f.dist - d) * k)
    camera.position.copy(controls.target).add(off)
    camera.lookAt(controls.target)
  })
  return null
}

function Preview({ config, framing = 'full' }) {
  return (
    <Canvas shadows dpr={[1, MAX_DPR]} camera={{ fov: 30, position: [0.6, 1.0, 3.3] }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, alpha: true }}>
      <hemisphereLight args={['#fff2dc', '#7a3a24', 0.9]} />
      <directionalLight position={[-2.5, 4, 3.5]} intensity={2.2} color="#ffe3bd" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} shadow-normalBias={0.02} />
      <directionalLight position={[3, 1.5, -2]} intensity={0.9} color="#ffb98a" />
      <SoftEnv intensity={0.25} />
      <Turntable />
      <PreviewBommai config={config} />
      <OrbitControls makeDefault target={[0, 0.6, 0]} enablePan={false} enableZoom={false} minPolarAngle={1.0} maxPolarAngle={1.65} rotateSpeed={0.7} />
      <Framing framing={framing} />
    </Canvas>
  )
}

// `editing`: changing a Bommai that is already on the Golu (its spot stays; the button saves).
// On a phone held upright the workshop is one column (preview, tabs, options) and the name tag
// gets its own screen after the styling, so the keyboard never covers the options.
export default function Creator({ initial, onBack, onDone, count, editing = false }) {
  const [config, setConfig] = useState(initial)
  const [cat, setCat] = useState('body')
  const portrait = useMedia(PORTRAIT)
  const [step, setStep] = useState('style') // style | name (portrait only)
  const naming = portrait && step === 'name'
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
  const set = (patch) => setConfig((c) => ({ ...c, ...patch }))
  const idx = CATEGORIES.findIndex((c) => c.id === cat)
  const gridRef = useRef()
  const railRef = useRef()
  // braces matter: newer Chrome returns a Promise from scrollTo, and React would call it as the cleanup
  useEffect(() => {
    gridRef.current?.scrollTo({ top: 0 })
    // the tabs scroll sideways on a phone: keep the open one in view
    const rail = railRef.current
    const on = rail?.querySelector('.is-on')
    if (on && rail.scrollWidth > rail.clientWidth) {
      rail.scrollTo({ left: on.offsetLeft - (rail.clientWidth - on.offsetWidth) / 2, behavior: 'smooth' })
    }
  }, [cat, step])

  return (
    <div className={`creator ${portrait ? 'is-portrait' : ''} ${naming ? 'is-naming' : ''}`}>
      <header className="creator-top">
        <button className="btn-ghost" onClick={naming ? () => setStep('style') : onBack}>
          <span aria-hidden>←</span> {naming ? 'Back' : 'Golu'}
        </button>
        <div className="creator-title">
          <span className="eyebrow">Bommai workshop</span>
          <h2>{naming ? 'Name your Bommai' : editing ? 'Edit your Bommai' : 'Make your Bommai'}</h2>
        </div>
        <div className="creator-count">
          <span className="creator-count-text">
            <b>{count}</b> already on the Golu
          </span>
        </div>
      </header>

      {!naming && (
        <nav className="cat-rail" ref={railRef} aria-label="Categories">
          {CATEGORIES.map((c, i) => (
            <button key={c.id} className={`cat ${cat === c.id ? 'is-on' : ''}`} onClick={() => setCat(c.id)}>
              <span className="cat-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="cat-label">{c.label}</span>
            </button>
          ))}
        </nav>
      )}

      {!naming && (
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
      )}

      {/* stays mounted between the two phone steps, so the 3D preview isn't rebuilt */}
      <aside className="preview">
        <div className="preview-stage">
          <Preview config={config} framing={!portrait || naming ? 'full' : cat === 'hair' || cat === 'face' ? 'head' : 'near'} />
          {naming ? (
            <div className="preview-tag" aria-hidden>
              <div className={`nametag mine ${config.name.trim() ? '' : 'is-empty'}`}>
                <span className="nametag-you">YOU</span>
                {config.name.trim() || 'Your name'}
              </div>
            </div>
          ) : (
            <button className="btn-dice" onClick={() => set(randomConfig(config.name))} title="Surprise me">
              <span aria-hidden>🎲</span> Surprise me
            </button>
          )}
        </div>
        {(!portrait || naming) && (
          <>
            <label className={`name-field ${needName ? 'is-missing' : ''}`}>
              <span>Name on the tag</span>
              <input
                ref={nameRef}
                value={config.name}
                maxLength={20}
                placeholder="Your name"
                required
                enterKeyHint="done"
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
              {editing ? 'Save changes' : 'Place my Bommai'} <span aria-hidden>→</span>
            </button>
          </>
        )}
      </aside>

      {portrait && !naming && (
        <footer className="creator-foot">
          <button className="btn-primary btn-place" onClick={() => setStep('name')}>
            Done <span aria-hidden>→</span>
          </button>
        </footer>
      )}
    </div>
  )
}
