// Web Share API where available, clipboard fallback otherwise.
export async function share(id, name) {
  const url = new URL(location.href)
  url.search = id ? `?b=${encodeURIComponent(id)}` : ''
  url.hash = ''
  const text = `I added my Bommai${name ? ` "${name}"` : ''} to the Internet Golu 🪆\nCome find me.`
  const data = { title: 'The Internet Golu', text, url: url.toString() }
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
      await navigator.share(data)
      return 'shared'
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelled'
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${data.url}`)
    return 'copied'
  } catch {
    // last resort for sandboxed frames without clipboard permission
    const ta = document.createElement('textarea')
    ta.value = `${text}\n${data.url}`
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok ? 'copied' : 'failed'
  }
}
