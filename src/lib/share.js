// The link to the Golu, or to one Bommai on it. `ref` says where a link was shared from.
function linkTo(id, ref) {
  const url = new URL(location.href)
  const params = new URLSearchParams()
  if (id) params.set('b', id)
  if (ref) params.set('ref', ref)
  url.search = params.toString() ? `?${params}` : ''
  url.hash = ''
  return url.toString()
}

// Clipboard, with a fallback for sandboxed frames without clipboard permission.
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok ? 'copied' : 'failed'
  }
}

// Web Share API where available, clipboard fallback otherwise.
export async function share(id, name) {
  const text = `I added my Bommai${name ? ` "${name}"` : ''} to the Internet Golu 🪆\nCome find me.`
  const data = { title: 'The Internet Golu', text, url: linkTo(id) }
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
      await navigator.share(data)
      return 'shared'
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelled'
  }
  return copyText(`${text}\n${data.url}`)
}

// ---------- pictures of a Bommai (the photo booth) ----------

// What goes with the picture when it's posted. The link sits in the text itself because some apps drop
// a separate `url` when a file is shared.
export function photoCaption(id, name) {
  return [
    name ? `Meet ${name}, my Bommai on the Internet Golu 🪆` : 'My Bommai on the Internet Golu 🪆',
    'Come visit my Golu 🪔',
    linkTo(id, 'snap'),
    '#InternetGolu #Golu #Navaratri',
  ].join('\n')
}

export const photoFileName = (name, ext = 'png') => `${(name || 'my-bommai').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-bommai'}-internet-golu.${ext}`

// Download the picture. Resolves 'saved'.
export function saveImage(blob, name) {
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = photoFileName(name)
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(href), 10000)
  return 'saved'
}

// Share the picture itself where the browser can (phones: straight into Instagram, WhatsApp...),
// otherwise save it. 'shared' | 'cancelled' | 'saved'
export async function shareImage(blob, { id, name }) {
  const file = new File([blob], photoFileName(name), { type: 'image/png' })
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'The Internet Golu', text: photoCaption(id, name) })
      return 'shared'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled'
    }
  }
  return saveImage(blob, name)
}

export const canShareImages = () => {
  try {
    return !!(navigator.share && navigator.canShare?.({ files: [new File([''], 'a.png', { type: 'image/png' })] }))
  } catch {
    return false
  }
}

// Put the picture itself on the clipboard, to paste into a post. 'copied' | 'failed'
export async function copyImage(blob) {
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    return 'copied'
  } catch {
    return 'failed'
  }
}

export const copyCaption = (id, name) => copyText(photoCaption(id, name))
