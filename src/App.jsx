import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import GoluScene from './three/GoluScene.jsx'
import Creator from './ui/Creator.jsx'
import signboard from './assets/golu-signboard.png'
import SoundToggle from './ui/SoundToggle.jsx'
import { GoluArrow, GoluNow } from './ui/GoluNav.jsx'
import { ThumbnailProvider } from './three/Thumbnails.jsx'
import { DEFAULT_CONFIG, normalizeConfig, freeSpotsByGolu } from './data/options.js'
import { addBommai, moveBommai, updateBommai, loadBommais, subscribeBommais, isLive, canMoveBommais, goluCount, SANDBOX } from './lib/store.js'
import { computeLayout, slotPos } from './three/golu/layout.js'
import { share } from './lib/share.js'
import { TOUCH, useMedia } from './lib/device.js'

const MINE_KEY = 'golu.mine'
// The sandbox never remembers whose Bommai is whose, so every reload is a first visit again.
const readMine = () => {
  if (SANDBOX) return []
  try {
    return JSON.parse(localStorage.getItem(MINE_KEY) || '[]')
  } catch {
    return []
  }
}
const writeMine = (ids) => {
  if (SANDBOX) return
  try {
    localStorage.setItem(MINE_KEY, JSON.stringify(ids))
  } catch {
    /* private mode: fine */
  }
}

// Same spot and same look: a live update that changes nothing (e.g. the echo of our own edit).
const sameRow = (a, b) => a.step === b.step && a.slot === b.slot && JSON.stringify(normalizeConfig(a)) === JSON.stringify(normalizeConfig(b))

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
  const [mode, setMode] = useState('home') // home (explorable Golu) | create | edit | place | placing | done
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
  // The Golus on the carousel and which one faces you. A turn is { golu, dir, n }: dir is the way the
  // stage turns (+1 brings the next Golu on the right round, -1 the one on the left, 0 the shorter way).
  const [golus, setGolus] = useState(1)
  const [turn, setTurn] = useState({ golu: 1, dir: 0, n: 0 })
  const active = turn.golu
  const goTo = useCallback((golu, dir = 0) => setTurn((t) => (t.golu === golu ? t : { golu, dir, n: t.n + 1 })), [])

  // load + realtime
  useEffect(() => {
    let unsub = () => {}
    loadBommais().then((rows) => {
      setBommais(rows)
      setGolus(goluCount())
      const t0 = 0.25
      setSpawns(Object.fromEntries(rows.map((r, i) => [r.id, { type: 'pop', delay: t0 + i * 0.07 }])))
      unsub = subscribeBommais((row) => {
        // a new Bommai drops in; a moved one glides to its new spot; an edited one changes its look
        setBommais((list) => {
          const i = list.findIndex((b) => b.id === row.id)
          if (i >= 0) return sameRow(list[i], row) ? list : list.map((b) => (b.id === row.id ? row : b))
          setSpawns((s) => (s[row.id] ? s : { ...s, [row.id]: { type: 'drop', delay: 0 } }))
          return [...list, row]
        })
      })
      const sid = shared.current
      const sharedRow = sid && rows.find((r) => r.id === sid)
      if (sharedRow) {
        goTo(sharedRow.golu)
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

  // free spots on each Golu (index 0 is Golu 1)
  const free = useMemo(() => freeSpotsByGolu(bommais, golus), [bommais, golus])
  const goluFull = free.every((n) => n === 0)
  const roomy = free.findIndex((n) => n > 0) + 1 // the first Golu with a free spot (0: none)
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
    else if (e.code === 'golu_unavailable') showToast("This Golu isn't open yet. Try another one.")
    else showToast('Could not place your Bommai. Try again?')
  }

  // Dropped on a free spot by drag and drop: place the new Bommai, or move your own.
  // Resolves true when it worked; false sends the doll back to where it came from.
  const onDropBommai = async (item, step, slot) => {
    if (item.kind === 'draft') {
      if (hasMine) return false
      try {
        const row = await addBommai(draft, active, step, slot)
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
    const sameGolu = bommais.filter((b) => b.golu === before.golu)
    if (before.step === step && computeLayout(sameGolu).get(before.id)?.slot === slot) return true
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
    // a sandbox Bommai lives only in this tab, so share the Golu itself
    const res = await share(SANDBOX ? null : id, justPlaced?.name)
    if (res === 'copied') showToast('Link copied. Send it to a friend!')
    else if (res === 'failed') showToast('Could not share from this browser.')
  }

  const findMine = () => {
    const id = myIds.filter((i) => bommais.some((b) => b.id === i)).pop()
    if (!id) return
    goTo(bommais.find((b) => b.id === id).golu)
    setFocusId(id)
    setTagId(id)
  }

  // Turn the carousel to the next Golu on either side (arrows, arrow keys, or dragging past the edge).
  const turnBy = useCallback(
    (dir) => {
      if (golus < 2) return
      setFocusId(null)
      setTagId(null)
      setTurn((t) => ({ golu: ((t.golu - 1 + dir + golus) % golus) + 1, dir, n: t.n + 1 }))
    },
    [golus],
  )
  const turnable = mode === 'home' || mode === 'place'
  useEffect(() => {
    if (!turnable || golus < 2) return
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea')) return
      if (e.key === 'ArrowLeft') turnBy(-1)
      else if (e.key === 'ArrowRight') turnBy(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [turnable, golus, turnBy])

  // Ready to place: if the Golu facing you is full, turn to the nearest one with room.
  const startPlacing = () => {
    setMode('place')
    if (free[active - 1] > 0) return
    for (let d = 1; d < golus; d++)
      for (const dir of [1, -1]) {
        const g = ((active - 1 + dir * d + golus) % golus) + 1
        if (free[g - 1] > 0) return goTo(g, dir)
      }
  }

  // Your Bommai, once you've found it or clicked it, can be edited: back to the workshop with its
  // look loaded; saving changes the look and name tag but keeps its spot.
  const mine = bommais.find((b) => b.id === tagId && myIds.includes(b.id))
  const [editingId, setEditingId] = useState(null)
  const editing = bommais.find((b) => b.id === editingId)
  const startEdit = () => {
    if (!mine) return
    setEditingId(mine.id)
    setMode('edit')
  }
  const saveEdit = async (cfg) => {
    const before = editing
    if (!before) return setMode('home')
    const id = before.id
    setBommais((list) => list.map((b) => (b.id === id ? { ...b, ...normalizeConfig(cfg) } : b)))
    setMode('home')
    setFocusId(id)
    setTagId(id)
    try {
      const row = await updateBommai(id, cfg)
      setBommais((list) => list.map((b) => (b.id === id ? row : b)))
      showToast('Your Bommai has its new look.')
    } catch (e) {
      console.error(e)
      setBommais((list) => list.map((b) => (b.id === id ? before : b)))
      showToast(e.code === 'edit_unavailable' ? "Editing isn't switched on for this Golu yet." : 'Could not save your changes. Try again?')
    }
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
  const touch = useMedia(TOUCH)
  const count = bommais.length
  const live = isLive()

  return (
    <ThumbnailProvider>
      <div className={`app mode-${mode}`}>
        <div className="stage">
          <GoluScene
            bommais={bommais}
            golus={golus}
            turn={turn}
            onTurnBy={turnBy}
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
              // clicking your own Bommai does what "Find my Bommai" does: the camera comes in to it
              if (b && myIds.includes(b.id)) setFocusId(b.id)
            }}
            celebrate={celebrate}
            paused={mode === 'create' || mode === 'edit'}
            view={view}
          />
        </div>

        {/* HOME */}
        {mode === 'home' && (
          <>
            <header className="hero">
              {/* a festival signboard nailed to the top-left of the screen, so the title stays
                  readable however far the camera moves into the Golu */}
              <h1 className="signboard">
                <img src={signboard} alt="Internet Golu. Create your own figurine, and add it to the Golu!" width="563" height="260" />
              </h1>
            </header>
            <div className="hud-count">
              <Counter n={count} live={live} />
            </div>
            {/* the turn arrows flank the main button, so the other Golus are hard to miss */}
            <div className="cta-row">
              <GoluArrow dir={-1} count={golus} active={active} free={free} onTurn={turnBy} />
              {mainCta}
              {mine && (
                <button className="btn-secondary" onClick={startEdit}>
                  Edit
                </button>
              )}
              <GoluArrow dir={1} count={golus} active={active} free={free} onTurn={turnBy} />
            </div>
            <p className="explore-hint">
              {hasMine && canMoveBommais() ? 'Drag your Bommai to move it · ' : ''}Drag to look around{golus > 1 ? ', further to turn the Golu' : ''} · {touch ? 'two fingers to zoom and move' : 'scroll to move · pinch to zoom'} · tap a Bommai to see who it is
            </p>
            <GoluNow count={golus} active={active} free={free} />
            {/* secondary controls, kept quiet so "Add your Bommai" is the one that stands out */}
            <div className="view-controls" role="group" aria-label="Music and view">
              <SoundToggle />
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
              startPlacing()
            }}
          />
        )}

        {/* EDIT (your Bommai, already on the Golu) */}
        {mode === 'edit' && editing && (
          <Creator key={editing.id} editing initial={normalizeConfig(editing)} count={count} onBack={() => setMode('home')} onDone={saveEdit} />
        )}

        {/* PLACE */}
        {placing && (
          <>
            <header className="place-head">
              <span className="eyebrow">Last step{golus > 1 ? ` · Golu ${active}` : ''}</span>
              <h2>Place your Bommai on the Golu</h2>
              <p>
                {free[active - 1] > 0
                  ? `Pick it up and drop it on any glowing spot (${free[active - 1]} left${golus > 1 ? ' on this Golu' : ''}). The top two steps are reserved for the deities and gods.`
                  : roomy
                    ? `Golu ${active} is full. Turn to Golu ${roomy} with the arrows.`
                    : 'Every Golu is full.'}
              </p>
            </header>
            <div className="cta-row">
              <GoluArrow dir={-1} count={golus} active={active} free={free} onTurn={turnBy} />
              <button className="btn-secondary" onClick={() => setMode('create')}>
                ← Edit
              </button>
              <GoluArrow dir={1} count={golus} active={active} free={free} onTurn={turnBy} />
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

        {(placing || mode === 'done') && (
          <div className="view-controls" role="group" aria-label="Music">
            <SoundToggle />
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}

        {!live && !SANDBOX && mode !== 'create' && mode !== 'edit' && (
          <div className="demo-badge" title="Supabase is not connected in this build, so new Bommais only live in this tab.">
            Preview · not shared yet
          </div>
        )}

      </div>
    </ThumbnailProvider>
  )
}
