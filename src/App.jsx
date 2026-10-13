import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import GoluScene from './three/GoluScene.jsx'
import Creator from './ui/Creator.jsx'
import ErrorBoundary from './ui/ErrorBoundary.jsx'
import { ThumbnailProvider } from './three/Thumbnails.jsx'
import { DEFAULT_CONFIG, OPEN_STEPS, STEP_CAP } from './data/options.js'
import { addBommai, loadBommais, subscribeBommais, storeKind } from './lib/store.js'
import { computeLayout } from './three/golu/layout.js'
import { share } from './lib/share.js'

const MINE_KEY = 'golu.mine'
const readMine = () => {
  try {
    return JSON.parse(localStorage.getItem(MINE_KEY) || '[]')
  } catch {
    return []
  }
}
const writeMine = (ids) => {
  try {
    localStorage.setItem(MINE_KEY, JSON.stringify(ids))
  } catch {
    /* private mode: fine */
  }
}

function useCountUp(n) {
  const [v, setV] = useState(n)
  const from = useRef(n)
  useEffect(() => {
    const start = performance.now()
    const a = from.current
    let raf
    const tick = (t) => {
      const k = Math.min(1, (t - start) / 900)
      const e = 1 - Math.pow(1 - k, 3)
      setV(Math.round(a + (n - a) * e))
      if (k < 1) raf = requestAnimationFrame(tick)
      else from.current = n
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [n])
  return v
}

function Counter({ n, live }) {
  const v = useCountUp(n)
  return (
    <div className="counter" aria-live="polite">
      <span className={`dot ${live ? 'live' : ''}`} />
      <b>{v}</b> Bommais have joined
    </div>
  )
}

function StepRail({ counts, hover, selected, onHover, onPick }) {
  return (
    <div className="step-rail" role="radiogroup" aria-label="Choose a step">
      <div className="rail-cap">Traditional</div>
      {[9, 8].map((k) => (
        <div key={k} className="rail-step locked" aria-disabled title="Reserved for the traditional Golu">
          <span className="rail-num">{k}</span>
          <span className="rail-lock" aria-hidden>
            ✦
          </span>
        </div>
      ))}
      <div className="rail-cap">Community</div>
      {[7, 6, 5, 4, 3, 2, 1].map((k) => {
        const full = (counts[k] || 0) >= STEP_CAP
        return (
          <button
            key={k}
            role="radio"
            aria-checked={selected === k}
            aria-disabled={full}
            title={full ? 'This step is full' : undefined}
            className={`rail-step ${full ? 'full' : ''} ${selected === k ? 'is-on' : ''} ${hover === k ? 'is-hover' : ''}`}
            onMouseEnter={() => onHover(k)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onPick(k)}
          >
            <span className="rail-num">{k}</span>
            <span className="rail-count">{full ? 'Full' : `${counts[k] || 0}/${STEP_CAP}`}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function App() {
  const [bommais, setBommais] = useState([])
  const [mode, setMode] = useState('home') // home | explore | create | place | placing | done
  const [draft, setDraft] = useState(() => ({ ...DEFAULT_CONFIG }))
  const [hoverStep, setHoverStep] = useState(null)
  const [selectedStep, setSelectedStep] = useState(null)
  const [spawns, setSpawns] = useState({})
  const [myIds, setMyIds] = useState(readMine)
  const [focusId, setFocusId] = useState(null)
  const [tagId, setTagId] = useState(null)
  const [celebrate, setCelebrate] = useState(null)
  const [toast, setToast] = useState(null)
  const [justPlaced, setJustPlaced] = useState(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(null)
  const shared = useRef(new URLSearchParams(location.search).get('b'))

  // load + realtime
  useEffect(() => {
    let unsub = () => {}
    loadBommais().then((rows) => {
      setBommais(rows)
      const t0 = 0.25
      setSpawns(Object.fromEntries(rows.map((r, i) => [r.id, { type: 'pop', delay: t0 + i * 0.07 }])))
      unsub = subscribeBommais((row) => {
        setBommais((list) => {
          if (list.some((b) => b.id === row.id)) return list
          setSpawns((s) => (s[row.id] ? s : { ...s, [row.id]: { type: 'drop', delay: 0 } }))
          return [...list, row]
        })
      })
      const sid = shared.current
      if (sid && rows.some((r) => r.id === sid)) {
        setTimeout(() => {
          setFocusId(sid)
          setTagId(sid)
        }, 1600)
      }
    })
    return () => unsub()
  }, [])

  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(showToast.t)
    showToast.t = setTimeout(() => setToast(null), 2600)
  }, [])

  const stepCounts = useMemo(() => {
    const m = {}
    bommais.forEach((b) => (m[b.step] = (m[b.step] || 0) + 1))
    return m
  }, [bommais])
  const fullSteps = useMemo(() => new Set(OPEN_STEPS.filter((k) => (stepCounts[k] || 0) >= STEP_CAP)), [stepCounts])
  const goluFull = fullSteps.size === OPEN_STEPS.length
  // one Bommai per visitor
  const hasMine = myIds.some((i) => bommais.some((b) => b.id === i))

  // someone else may take the last spot on the step you picked
  useEffect(() => {
    if (selectedStep && fullSteps.has(selectedStep) && mode === 'place') setSelectedStep(null)
  }, [fullSteps, selectedStep, mode])

  const startCreate = () => {
    setFocusId(null)
    setTagId(null)
    setMode('create')
  }

  const showNote = (msg) => {
    setNote(msg)
    clearTimeout(showNote.t)
    showNote.t = setTimeout(() => setNote(null), 2400)
  }

  const pickStep = (k) => {
    if (k >= 8) return showNote('The top two steps hold the traditional Golu. Pick any step from 1 to 7.')
    if (fullSteps.has(k)) return showNote(`Step ${k} is full. Pick another step.`)
    setSelectedStep(k)
  }

  const confirmPlace = async () => {
    if (!selectedStep || busy || hasMine) return
    setBusy(true)
    try {
      const row = await addBommai(draft, selectedStep)
      setSpawns((s) => ({ ...s, [row.id]: { type: 'fly', delay: 0 } }))
      setBommais((list) => (list.some((b) => b.id === row.id) ? list : [...list, row]))
      const mine = [...myIds, row.id]
      setMyIds(mine)
      writeMine(mine)
      setJustPlaced(row)
      setMode('placing')
    } catch (e) {
      console.error(e)
      if (e.code === 'step_full') {
        setSelectedStep(null)
        showToast('That step just filled up. Pick another one.')
      } else if (e.code === 'already_placed') showToast('You already have a Bommai on the Golu.')
      else if (e.code === 'locked_step') showToast('That step is reserved for the traditional Golu.')
      else showToast('Could not place your Bommai. Try again?')
    } finally {
      setBusy(false)
    }
  }

  const onLanded = useCallback(
    (b) => {
      if (!justPlaced || b.id !== justPlaced.id) return
      const t = computeLayout(bommais).get(b.id)
      setCelebrate({ key: b.id, at: [t.x, t.y, t.z] })
      setFocusId(b.id)
      setTimeout(() => {
        setFocusId(null)
        setMode('done')
      }, 1500)
    },
    [justPlaced, bommais],
  )

  const shareMine = async () => {
    const id = justPlaced?.id || myIds[myIds.length - 1]
    const res = await share(id, justPlaced?.name)
    if (res === 'copied') showToast('Link copied. Send it to a friend!')
    else if (res === 'failed') showToast('Could not share from this browser.')
  }

  const findMine = () => {
    const id = myIds.filter((i) => bommais.some((b) => b.id === i)).pop()
    if (!id) return
    setFocusId(id)
    setTagId(id)
  }

  // the main call to action: make one, find yours, or nothing left to take
  const mainCta = hasMine ? (
    <button className="btn-primary" onClick={() => (setMode('explore'), findMine())}>
      Find my Bommai
    </button>
  ) : goluFull ? (
    <button className="btn-primary" disabled>
      The Golu is full
    </button>
  ) : (
    <button className="btn-primary" onClick={startCreate}>
      Add your Bommai
    </button>
  )

  const placing = mode === 'place'
  const count = bommais.length
  const live = storeKind() === 'supabase'

  return (
    <ThumbnailProvider>
      <div className={`app mode-${mode}`}>
        <div className="stage">
          <ErrorBoundary name="golu scene" fallback={null}>
            <GoluScene
              bommais={bommais}
              mode={mode}
              draft={draft}
              myIds={myIds}
              spawns={spawns}
              selectedStep={selectedStep}
              hoverStep={hoverStep}
              onHoverStep={setHoverStep}
              fullSteps={fullSteps}
              onPickStep={pickStep}
              onLanded={onLanded}
              focusId={focusId}
              tagId={tagId}
              onPickBommai={(b) => {
                if (mode === 'home' && b) setMode('explore')
                setTagId(b ? b.id : null)
              }}
              celebrate={celebrate}
              paused={mode === 'create'}
            />
          </ErrorBoundary>
        </div>

        {/* HOME */}
        {(mode === 'home' || mode === 'explore') && (
          <>
            <header className={`hero ${mode === 'explore' ? 'hero-min' : ''}`}>
              <div className="brand">
                <span className="brand-mark" aria-hidden>
                  ❋
                </span>
                <h1>
                  The Internet <em>Golu</em>
                </h1>
              </div>
              {mode === 'home' && <p className="tagline">Make a little Bommai. Add it to the Golu.</p>}
              <Counter n={count} live={live} />
            </header>
            <div className="cta-row">
              {mode === 'home' ? (
                <>
                  {mainCta}
                  <button className="btn-secondary" onClick={() => setMode('explore')}>
                    Explore the Golu
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-secondary" onClick={() => (setMode('home'), setTagId(null), setFocusId(null))}>
                    ← Back
                  </button>
                  {mainCta}
                </>
              )}
            </div>
            {mode === 'explore' && <p className="explore-hint">Drag to look around · tap a Bommai to see who it is</p>}
          </>
        )}

        {/* CREATE */}
        {mode === 'create' && (
          <ErrorBoundary name="creator">
            <Creator
              config={draft}
              onChange={setDraft}
              count={count}
              onBack={() => setMode('home')}
              onDone={() => {
                setSelectedStep(null)
                setMode('place')
              }}
            />
          </ErrorBoundary>
        )}

        {/* PLACE */}
        {placing && (
          <>
            <header className="place-head">
              <span className="eyebrow">Last step</span>
              <h2>Choose a step for your Bommai</h2>
              <p>Steps 1 to 7 belong to the community, {STEP_CAP} Bommais each. The top two hold the traditional Golu.</p>
            </header>
            <StepRail counts={stepCounts} hover={hoverStep} selected={selectedStep} onHover={setHoverStep} onPick={pickStep} />
            {note && <div className="locked-note">{note}</div>}
            <div className="cta-row">
              <button className="btn-secondary" onClick={() => setMode('create')}>
                ← Edit
              </button>
              <button className="btn-primary" disabled={!selectedStep || busy} onClick={confirmPlace}>
                {selectedStep ? `Place on step ${selectedStep}` : 'Tap a step'}
              </button>
            </div>
          </>
        )}

        {/* DONE */}
        {mode === 'done' && (
          <div className="celebrate" role="status">
            <div className="celebrate-card">
              <p className="celebrate-title">
                You're part of the Internet Golu <span aria-hidden>🪆</span>
              </p>
              <Counter n={count} live={live} />
              <div className="celebrate-actions">
                <button className="btn-primary" onClick={shareMine}>
                  Share my Bommai
                </button>
                <button className="btn-secondary" onClick={() => (setMode('explore'), findMine())}>
                  Explore
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}

        {!live && mode !== 'create' && (
          <div className="demo-badge" title="Supabase is not connected in this build, so new Bommais only live in this tab.">
            Preview · not shared yet
          </div>
        )}

        <div className="rotate-prompt" aria-hidden={false}>
          <div className="phone">
            <div className="phone-screen">
              <span>❋</span>
            </div>
          </div>
          <h2>Turn your phone sideways</h2>
          <p>The Golu is best experienced in landscape.</p>
        </div>
      </div>
    </ThumbnailProvider>
  )
}
