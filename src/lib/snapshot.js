// The photo booth's card: takes the picture of the Bommai (PhotoStudio.jsx, transparent) and lays
// it out on a 2D canvas for a size and a frame, with the name, "Bommai No. N" and the address.
// Everything here is plain canvas drawing, so changing the size, frame or caption is instant.

export const RATIOS = [
  { id: 'post', label: 'Post', hint: '4:5', w: 1080, h: 1350 },
  { id: 'story', label: 'Story', hint: '9:16', w: 1080, h: 1920 },
  { id: 'square', label: 'Square', hint: '1:1', w: 1080, h: 1080 },
]

export const FRAMES = [
  { id: 'steps', label: 'Golu steps' },
  { id: 'lamp', label: 'Lamp glow' },
  { id: 'marigold', label: 'Marigold' },
  { id: 'sticker', label: 'Sticker' },
]

const SITE = 'internet-golu.vercel.app'
const DISPLAY = "'Unbounded', 'Arial Black', system-ui, sans-serif"
const BODY = "'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"

// Text on a canvas draws in whatever font is ready, so wait for the two the page uses.
export async function loadCardFonts() {
  try {
    await Promise.all([document.fonts.load(`800 64px Unbounded`), document.fonts.load(`700 28px Unbounded`), document.fonts.load(`500 28px 'DM Sans'`)])
  } catch {
    /* fall back to the system fonts */
  }
}

const canvasOf = (w, h) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

// The picture is a big square with the doll somewhere in it: crop to the doll, so it can be placed
// and scaled exactly.
export function trimFigure(src) {
  const { width: w, height: h } = src
  const { data } = src.getContext('2d').getImageData(0, 0, w, h)
  let x0 = w
  let y0 = h
  let x1 = -1
  let y1 = -1
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (data[(y * w + x) * 4 + 3] > 12) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
  if (x1 < 0) return src
  const out = canvasOf(x1 - x0 + 1, y1 - y0 + 1)
  out.getContext('2d').drawImage(src, x0, y0, out.width, out.height, 0, 0, out.width, out.height)
  return out
}

// small deterministic random, so a Bommai's card always has the same sparkle
function rng(seed) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const hash = (s = '') => {
  let h = 7
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}

function glow(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, color.replace('A', alpha))
  g.addColorStop(1, color.replace('A', 0))
  ctx.fillStyle = g
  ctx.fillRect(x - r, y - r, r * 2, r * 2)
}

function diamond(ctx, x, y, r) {
  ctx.beginPath()
  ctx.moveTo(x, y - r)
  ctx.lineTo(x + r, y)
  ctx.lineTo(x, y + r)
  ctx.lineTo(x - r, y)
  ctx.closePath()
  ctx.fill()
}

// A thin gold frame inset from the edge, with a diamond at each corner.
function goldFrame(ctx, w, h, inset, color) {
  ctx.strokeStyle = color
  ctx.lineWidth = 4
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2)
  ctx.lineWidth = 1.5
  ctx.strokeRect(inset + 14, inset + 14, w - (inset + 14) * 2, h - (inset + 14) * 2)
  ctx.fillStyle = color
  for (const [x, y] of [
    [inset, inset],
    [w - inset, inset],
    [inset, h - inset],
    [w - inset, h - inset],
  ])
    diamond(ctx, x, y, 13)
}

// Where the doll stands, set by the layout: `base` is the floor under its pedestal.
const BACKDROPS = {
  // warm saffron wall, lamps glowing out of focus, and three steps to stand on
  steps(ctx, w, h, { base, figW }, rand) {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#ffe7b0')
    g.addColorStop(0.45, '#f6a947')
    g.addColorStop(1, '#7a1f2b')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 14; i++) {
      glow(ctx, rand() * w, rand() * base * 0.8, 40 + rand() * 90, 'rgba(255,226,150,A)', 0.55)
    }
    const stepH = Math.max(34, h * 0.03)
    const shades = ['#e8a23a', '#c8323a', '#7a1f2b']
    for (let k = 0; k < 3; k++) {
      const half = Math.max(figW * 0.8, w * 0.36) + k * w * 0.1
      const y = base + k * stepH
      ctx.fillStyle = shades[k]
      ctx.fillRect(w / 2 - half, y, half * 2, stepH + (k === 2 ? h : 0))
      ctx.fillStyle = 'rgba(255,236,190,0.55)'
      ctx.fillRect(w / 2 - half, y, half * 2, 5)
    }
    goldFrame(ctx, w, h, 36, 'rgba(255,229,160,0.9)')
  },
  // a dark room lit by one diya, with sparks drifting up
  lamp(ctx, w, h, { base }, rand) {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#1d1016')
    g.addColorStop(1, '#3a1520')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    glow(ctx, w / 2, base - h * 0.14, h * 0.5, 'rgba(255,170,60,A)', 0.62)
    glow(ctx, w / 2, base, h * 0.22, 'rgba(255,214,120,A)', 0.5)
    for (let i = 0; i < 46; i++) {
      const r = 1.5 + rand() * 4
      ctx.fillStyle = `rgba(255,${190 + Math.floor(rand() * 50)},110,${0.25 + rand() * 0.6})`
      ctx.beginPath()
      ctx.arc(rand() * w, rand() * base, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillRect(0, base, w, h)
    goldFrame(ctx, w, h, 36, 'rgba(232,179,60,0.85)')
  },
  // cream paper inside a garland of marigolds
  marigold(ctx, w, h, { base }, rand) {
    ctx.fillStyle = '#f6ead2'
    ctx.fillRect(0, 0, w, h)
    glow(ctx, w / 2, base - h * 0.15, h * 0.42, 'rgba(255,196,80,A)', 0.4)
    const colors = ['#f59a1f', '#ffc42e', '#ee7c10', '#ffd96a']
    const flower = (x, y, r) => {
      ctx.fillStyle = colors[Math.floor(rand() * colors.length)]
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(122,31,43,0.28)'
      ctx.beginPath()
      ctx.arc(x, y, r * 0.38, 0, Math.PI * 2)
      ctx.fill()
    }
    const r = 30
    const edge = 46
    for (let x = edge; x <= w - edge; x += r * 1.45) {
      flower(x, edge, r)
      flower(x, h - edge, r)
    }
    for (let y = edge + r * 1.45; y < h - edge; y += r * 1.45) {
      flower(edge, y, r)
      flower(w - edge, y, r)
    }
    ctx.fillStyle = 'rgba(120,70,40,0.14)'
    ctx.fillRect(edge + r + 10, base + 6, w - (edge + r + 10) * 2, 4)
  },
}

// colours for the text on each backdrop
const INK = {
  steps: { name: '#fff3e0', sub: '#ffd98a', foot: 'rgba(255,243,224,0.85)' },
  lamp: { name: '#fff3e0', sub: '#e8b33c', foot: 'rgba(255,243,224,0.7)' },
  marigold: { name: '#3a1d17', sub: '#a8700f', foot: 'rgba(58,29,23,0.72)' },
}

// Fit a line of text to a width by shrinking the font.
function fitText(ctx, text, family, weight, size, maxW) {
  let s = size
  do {
    ctx.font = `${weight} ${s}px ${family}`
    s -= 2
  } while (ctx.measureText(text).width > maxW && s > 18)
}

// A white sticker edge: the doll's outline, thickened, behind the doll.
function stickerCard(fig) {
  const pad = Math.round(Math.max(fig.width, fig.height) * 0.07)
  const edge = Math.round(pad * 0.55)
  const out = canvasOf(fig.width + pad * 2, fig.height + pad * 2)
  const ctx = out.getContext('2d')
  const sil = canvasOf(out.width, out.height)
  const sctx = sil.getContext('2d')
  sctx.drawImage(fig, pad, pad)
  sctx.globalCompositeOperation = 'source-in'
  sctx.fillStyle = '#fff'
  sctx.fillRect(0, 0, sil.width, sil.height)
  for (let a = 0; a < 32; a++) {
    const t = (a / 32) * Math.PI * 2
    ctx.drawImage(sil, Math.cos(t) * edge, Math.sin(t) * edge)
  }
  ctx.drawImage(fig, pad, pad)
  return out
}

/**
 * Lay the card out. `figure` is the picture from PhotoStudio. Options:
 *   ratio    one of RATIOS (an id)
 *   frame    one of FRAMES (an id)
 *   name     the Bommai's name (may be empty)
 *   tagline  e.g. "Bommai No. 137 · Golu 2 · Step 4"
 *   caption  draw the name and tagline
 * Returns a canvas.
 */
export function composeCard(figure, { ratio = 'post', frame = 'steps', name = '', tagline = '', caption = true } = {}) {
  const fig = trimFigure(figure)
  if (frame === 'sticker') return stickerCard(fig)

  const { w, h } = RATIOS.find((r) => r.id === ratio) || RATIOS[0]
  const out = canvasOf(w, h)
  const ctx = out.getContext('2d')
  const pad = Math.round(w * 0.07)

  // from the bottom up: the address, then the tagline and the name, then the floor the doll stands on
  const footY = h - pad * 1.25
  const tagY = footY - 78
  const nameY = tagY - 86
  const below = caption ? (name ? 3 : 2) : 1 // how many rows of text sit under the doll
  const textTop = below === 3 ? nameY - 70 : below === 2 ? tagY - 50 : footY - 50
  const floorGap = 90 // steps under the doll
  const top = pad * 1.5
  const availH = textTop - floorGap - top
  const scale = Math.min((w - pad * 4.2) / fig.width, availH / fig.height)
  const figW = fig.width * scale
  const figH = fig.height * scale
  const base = top + availH / 2 + figH / 2

  const rand = rng(hash(name) + hash(tagline))
  BACKDROPS[frame]?.(ctx, w, h, { base, figW }, rand)

  // soft contact shadow under the pedestal, then the doll
  const sh = ctx.createRadialGradient(w / 2, base, 0, w / 2, base, figW * 0.5)
  sh.addColorStop(0, 'rgba(30,8,10,0.45)')
  sh.addColorStop(1, 'rgba(30,8,10,0)')
  ctx.save()
  ctx.translate(w / 2, base)
  ctx.scale(1, 0.18)
  ctx.translate(-w / 2, -base)
  ctx.fillStyle = sh
  ctx.fillRect(w / 2 - figW * 0.5, base - figW * 0.5, figW, figW)
  ctx.restore()
  ctx.drawImage(fig, (w - figW) / 2, base - figH, figW, figH)

  const ink = INK[frame] || INK.steps
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  if (caption) {
    if (name) {
      ctx.fillStyle = ink.name
      fitText(ctx, name.toUpperCase(), DISPLAY, 800, 72, w - pad * 3)
      ctx.fillText(name.toUpperCase(), w / 2, nameY)
    }
    if (tagline) {
      ctx.fillStyle = ink.sub
      fitText(ctx, tagline.toUpperCase(), DISPLAY, 700, 26, w - pad * 2.4)
      ctx.fillText(tagline.toUpperCase(), w / 2, tagY)
    }
  }
  ctx.fillStyle = ink.foot
  ctx.font = `500 28px ${BODY}`
  ctx.fillText(`The Internet Golu  ·  ${SITE}`, w / 2, footY)
  return out
}

export const toBlob = (canvas) => new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('empty image'))), 'image/png'))
