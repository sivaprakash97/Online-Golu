import { useEffect, useMemo, useRef, useState } from 'react'
import PhotoStudio from '../three/PhotoStudio.jsx'
import { normalizeConfig } from '../data/options.js'
import { FRAMES, RATIOS, composeCard, loadCardFonts, toBlob } from '../lib/snapshot.js'
import { canShareImages, copyCaption, copyImage, saveImage, shareImage } from '../lib/share.js'

// The photo booth: a picture of your Bommai as a card you can post. The Bommai is photographed once
// (PhotoStudio), then the card is laid out around it for the size and frame you pick (snapshot.js).
// `id` is null for a sandbox Bommai, which lives only in this tab, so the caption links to the Golu itself.
export default function SnapshotSheet({ bommai, number, id, onClose, onToast }) {
  const look = useMemo(() => normalizeConfig(bommai), [bommai])
  const [figure, setFigure] = useState(null)
  const [ratio, setRatio] = useState('post')
  const [frame, setFrame] = useState('steps')
  const [caption, setCaption] = useState(true)
  const [card, setCard] = useState(null) // { blob, url }
  const shareBtn = useRef(null)
  const sticker = frame === 'sticker'
  const canShare = useMemo(canShareImages, [])
  const canCopyImage = typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write

  const tagline = [number ? `Bommai No. ${number}` : '', bommai.golu ? `Golu ${bommai.golu}` : '', bommai.step ? `Step ${bommai.step}` : ''].filter(Boolean).join(' · ')

  // Lay the card out again whenever a choice changes. The blob is made here, ahead of any tap, because
  // some browsers only let a share start straight from a tap, with no waiting in between.
  useEffect(() => {
    if (!figure) return
    let stale = false
    ;(async () => {
      await loadCardFonts()
      const blob = await toBlob(composeCard(figure, { ratio, frame, name: look.name, tagline, caption }))
      if (!stale) setCard({ blob, url: URL.createObjectURL(blob) })
    })().catch((e) => {
      console.error(e)
      if (!stale) onToast?.('Could not make the picture. Try again?')
    })
    return () => {
      stale = true
    }
  }, [figure, ratio, frame, caption, look.name, tagline])
  // a picture's address is released once the next one has replaced it on screen
  useEffect(() => () => card && URL.revokeObjectURL(card.url), [card])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  useEffect(() => {
    if (card) shareBtn.current?.focus({ preventScroll: true })
  }, [!!card])

  const ready = !!card
  const doShare = async () => {
    const res = await shareImage(card.blob, { id, name: look.name })
    if (res === 'saved') onToast?.('Saved. Add it to your post!')
  }
  const doSave = () => {
    saveImage(card.blob, look.name)
    onToast?.('Saved. Add it to your post!')
  }
  const doCopyImage = async () => onToast?.((await copyImage(card.blob)) === 'copied' ? 'Picture copied. Paste it into your post!' : 'Could not copy the picture. Try Save instead.')
  const doCopyCaption = async () => onToast?.((await copyCaption(id, look.name)) === 'copied' ? 'Caption copied.' : 'Could not copy from this browser.')

  return (
    <div className="snap" role="dialog" aria-modal="true" aria-label="Photo booth" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {!figure && <PhotoStudio config={look} onShot={setFigure} />}
      <div className="snap-sheet">
        <div className="snap-head">
          <h2>Photo booth</h2>
          <button className="snap-close" onClick={onClose} aria-label="Close photo booth">
            ✕
          </button>
        </div>

        <div className={`snap-preview${sticker ? ' is-sticker' : ''}`}>
          {card ? <img src={card.url} alt={`A picture card of ${look.name || 'your Bommai'}`} /> : <p className="snap-wait">Developing your photo…</p>}
        </div>

        <div className="snap-options">
          <div className="snap-group" role="group" aria-label="Frame">
            {FRAMES.map((f) => (
              <button key={f.id} className="snap-chip" aria-pressed={frame === f.id} onClick={() => setFrame(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="snap-group" role="group" aria-label="Size">
            {RATIOS.map((r) => (
              <button key={r.id} className="snap-chip" aria-pressed={!sticker && ratio === r.id} disabled={sticker} onClick={() => setRatio(r.id)}>
                {r.label} <small>{r.hint}</small>
              </button>
            ))}
          </div>
          <label className={`snap-check${sticker ? ' is-off' : ''}`}>
            <input type="checkbox" checked={caption} disabled={sticker} onChange={(e) => setCaption(e.target.checked)} />
            Show name and number
          </label>
        </div>

        <div className="snap-actions">
          {canShare ? (
            <button ref={shareBtn} className="btn-primary" disabled={!ready} onClick={doShare}>
              Share
            </button>
          ) : (
            <button ref={shareBtn} className="btn-primary" disabled={!ready} onClick={doSave}>
              Save image
            </button>
          )}
          <div className="snap-more">
            {canShare && (
              <button className="btn-secondary" disabled={!ready} onClick={doSave}>
                Save
              </button>
            )}
            {!canShare && canCopyImage && (
              <button className="btn-secondary" disabled={!ready} onClick={doCopyImage}>
                Copy image
              </button>
            )}
            <button className="btn-secondary" onClick={doCopyCaption}>
              Copy caption
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
