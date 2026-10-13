import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import GoluScene from './three/GoluScene.jsx'
import Creator from './ui/Creator.jsx'
import { ThumbnailProvider } from './three/Thumbnails.jsx'
import { DEFAULT_CONFIG, OPEN_STEPS, spotsOnStep } from './data/options.js'
import { addBommai, moveBommai, loadBommais, subscribeBommais, storeKind, canMoveBommais } from './lib/store.js'
import { computeLayout, slotPos } from './three/golu/layout.js'
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

export default function App() {
  const [bommais, setBommais] = useState([])
  const [mode, setMode] = useState('home') // home (explorable Golu) | create | place | placing | done
  const [view, setView] = useState({ kind: null, n: 0 }) // camera commands from the view buttons
  const [draft, setDraft] = useState(() => ({ ...DEFAULT_CONFIG }))
  const [spawns, setSpawns] = useState({})
  const [myIds, setMyIds] = useState(readMine)
  const [focusId, setFocusId] = useState(null)
  const [tagId, setTagId] = useState(null)
  const [celebrate, setCelebrate] = useState(null)
  const [toast, setToast] = useState(null)
  const [justPlaced, setJustPlaced] = useState(null)
  const shared = useRef(new URLSearchParams(location.search).get('b'))

  // load + realtime
  useEffect(() => {
    let unsub = () => {}
    loadBommais().then((rows) => {
      setBommais(rows)
      const t0 = 0.25
      setSpawns(Object.fromEntries(rows.map((r, i) => [r.id, { type: 'pop', delay: t0 + i * 0.07 }])))
      unsub = subscribeBommais((row) => {
        // a new Bommai drops in; a moved one glides to its new spot
        setBommais((list) => {
          const i = list.findIndex((b) => b.id === row.id)
          if (i >= 0) return list[i].step === row.step && list[i].slot === row.slot ? list : list.map((b) => (b.id === row.id ? row : b))
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
  const fullSteps = useMemo(() => new Set(OPEN_STEPS.filter((k) => (stepCounts[k] || 0) >= spotsOnStep(k))), [stepCounts])
  const goluFull = fullSteps.size === OPEN_STEPS.length
  // one Bommai per visitor
  const hasMine = myIds.some((i) => bommais.some((b) => b.id === i))

  const startCreate = () => {
    setFocusId(null)
    setTagId(null)
    setMode('create')
  }

  const placeError = (e) => {
    console.error(e)
    if (e.code === 'slot_taken') showToast('Someone just took that spot. Try another one.')
    else if (e.code === 'step_full') showToast('That step just filled up. Try another one.')
    else if (e.code === 'already_placed') showToast('You already have a Bommai on the Golu.')
    else if (e.code === 'locked_step') showToast('The top two steps are reserved for the deities and gods.')
    else if (e.code === 'move_unavailable') showToast("Moving isn't switched on for this Golu yet.")
    else showToast('Could not place your Bommai. Try again?')
  }

  // Dropped on a free spot by drag and drop: place the new Bommai, or move your own.
  // Resolves true when it worked; false sends the doll back to where it came from.
  const onDropBommai = async (item, step, slot) => {
    if (item.kind === 'draft') {
      if (hasMine) return false
      try {
        const row = await addBommai(draft, step, slot)
        setBommais((list) => (list.some((b) => b.id === row.id) ? list : [...list, row]))
        // it was just set down by hand: no drop-in animation (the live update may have queued one)
        setSpawns(({ [row.id]: _, ...rest }) => rest)
        const mine = [...myIds, row.id]
        setMyIds(mine)
        writeMine(mine)
        setJustPlaced(row)
        setMode('placing')
        const p = slotPos(step, slot)
        setCelebrate({ key: row.id, at: [p.x, p.y, p.z] })
        setTimeout(() => setMode('done'), 1500)
        return true
      } catch (e) {
        placeError(e)
        return false
      }
    }
    const before = bommais.find((b) => b.id === item.id)
    if (!before) return false
    if (before.step === step && computeLayout(bommais).get(before.id)?.slot === slot) return true
    setBommais((list) => list.map((b) => (b.id === item.id ? { ...b, step, slot } : b)))
    try {
      await moveBommai(item.id, step, slot)
      return true
    } catch (e) {
      setBommais((list) => list.map((b) => (b.id === item.id ? before : b)))
      placeError(e)
      return false
    }
  }

  const onReject = (reason, step) => {
    if (reason === 'reserved') showToast('🙏 The top two steps are reserved for the deities and gods.')
    else if (reason === 'full') showToast(`Step ${step} is full. Try another step.`)
  }

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

  const camera = (kind) => setView((v) => ({ kind, n: v.n + 1 }))
  const resetView = () => {
    setFocusId(null)
    setTagId(null)
    camera('reset')
  }

  // the main call to action: make one, find yours, or nothing left to take
  const mainCta = hasMine ? (
    <button className="btn-primary" onClick={findMine}>
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
          <GoluScene
            bommais={bommais}
            mode={mode}
            draft={draft}
            myIds={myIds}
            spawns={spawns}
            canMove={canMoveBommais()}
            onDropBommai={onDropBommai}
            onReject={onReject}
            focusId={focusId}
            tagId={tagId}
            onPickBommai={(b) => {
              setTagId(b ? b.id : null)
            }}
            celebrate={celebrate}
            paused={mode === 'create'}
            view={view}
          />
        </div>

        {/* HOME */}
        {mode === 'home' && (
          <>
            <header className="hero">
              <div className="brand">
                <span className="brand-mark" aria-hidden>
                  ❋
                </span>
                <h1>
                  The Internet <em>Golu</em>
                </h1>
              </div>
              <p className="tagline">Make a little Bommai. Add it to the Golu.</p>
              <Counter n={count} live={live} />
            </header>
            <div className="cta-row">{mainCta}</div>
            <p className="explore-hint">
              {hasMine && canMoveBommais() ? 'Drag your Bommai to move it · ' : ''}Drag to look around · scroll to move · pinch to zoom · tap a Bommai to see who it is
            </p>
            <div className="view-controls" role="group" aria-label="View">
              <button onClick={() => camera('in')} aria-label="Zoom in" title="Zoom in">
                +
              </button>
              <button onClick={() => camera('out')} aria-label="Zoom out" title="Zoom out">
                −
              </button>
              <button className="view-reset" onClick={resetView} aria-label="Reset view" title="Reset view">
                ⟲ <span>Reset view</span>
              </button>
            </div>
          </>
        )}

        {/* CREATE */}
        {mode === 'create' && (
          <Creator
            initial={draft}
            count={count}
            onBack={() => setMode('home')}
            onDone={(cfg) => {
              setDraft(cfg)
              setMode('place')
            }}
          />
        )}

        {/* PLACE */}
        {placing && (
          <>
            <header className="place-head">
              <span className="eyebrow">Last step</span>
              <h2>Place your Bommai on the Golu</h2>
              <p>Pick it up and drop it on any glowing spot. The top two steps are reserved for the deities and gods.</p>
            </header>
            <div className="cta-row">
              <button className="btn-secondary" onClick={() => setMode('create')}>
                ← Edit
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
                <button className="btn-secondary" onClick={() => (setMode('home'), findMine())}>
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

      </div>
    </ThumbnailProvider>
  )
}
