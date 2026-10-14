// Records a ~11 second demo video of the core loop: the Golu opens -> Add your Bommai -> customise
// it in the workshop -> Place my Bommai -> drag it onto step 2 -> "You're part of the Internet Golu".
//
//   npm run dev                               # without Supabase env vars (the demo store)
//   node scripts/demo-video/record.mjs [--name Sivaprakash] [--out golu-demo.mp4] [--scale 1.5] [--url http://localhost:5173/]
//
// Needs Playwright (`npm i -D playwright`, or PLAYWRIGHT=/path/to/playwright/index.mjs) and ffmpeg.
// Software WebGL in a headless browser is far too slow to record live, so the page runs on a
// virtual clock (vtime.js) and is captured frame by frame at 30 fps; cursor.js draws the mouse.
// The pointer paths are tuned for the 1280x720 layout and the demo seed Bommais.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`)
  return i > 0 ? process.argv[i + 1] : d
}
const URL = arg('url', 'http://localhost:5173/')
const NAME = arg('name', 'Sivaprakash')
const OUT = path.resolve(arg('out', 'golu-demo.mp4'))
const SCALE = Number(arg('scale', '1.5')) // 1.5 -> 1920x1080
const FPS = 30
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright')

const frames = fs.mkdtempSync(path.join(os.tmpdir(), 'golu-demo-'))
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: SCALE })
page.on('pageerror', (e) => console.log('pageerror:', e.message))
await page.addInitScript({ path: path.join(HERE, 'vtime.js') })
await page.goto(URL)
await page.waitForSelector('.btn-primary')
// never add a Bommai to the real, shared Golu
if (!(await page.locator('.demo-badge').count())) {
  await browser.close()
  throw new Error('This build talks to Supabase. Run the dev server without VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.')
}
await page.waitForTimeout(3000) // modules, fonts and images (real time; the scene hasn't drawn yet)
await page.addScriptTag({ path: path.join(HERE, 'cursor.js') })
await page.mouse.move(1279, 719)

let frame = 0
let rafs = 1
const cur = { x: 1180, y: 760, show: false, hand: false }
const t0 = Date.now()

async function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    await page.evaluate(([ms, r]) => window.__vt.advance(ms, r), [1000 / FPS, rafs])
    await page.waitForTimeout(15) // let React commit
    await page.evaluate((c) => (window.__vt.syncAnims(), window.__cursor.render(c.x, c.y, c.show, c.hand)), cur)
    await page.screenshot({ path: path.join(frames, `${String(frame).padStart(5, '0')}.png`), timeout: 0 })
    frame++
    if (frame % 30 === 0) console.log(`frame ${frame} (${Math.round((Date.now() - t0) / 1000)}s)`)
  }
}

const cubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const sine = (t) => (1 - Math.cos(Math.PI * t)) / 2
// glide the mouse along a gentle arc, one step per frame
async function moveTo(x, y, n, { arc = 0.12, ease = cubic } = {}) {
  const [ax, ay, dx, dy] = [cur.x, cur.y, x - cur.x, y - cur.y]
  for (let i = 1; i <= n; i++) {
    const t = ease(i / n)
    const bend = Math.sin(Math.PI * t) * arc
    cur.x = ax + dx * t - dy * bend
    cur.y = ay + dy * t + dx * bend
    if (cur.x >= 0 && cur.x < 1280 && cur.y >= 0 && cur.y < 720) await page.mouse.move(cur.x, cur.y)
    await page.waitForTimeout(10)
    await tick()
  }
}
async function click(hold = 2, after = 1) {
  await page.evaluate((c) => window.__cursor.down(c.x, c.y), cur)
  await page.mouse.down()
  await tick(hold)
  await page.mouse.up()
  await page.waitForTimeout(40)
  await tick(after)
}
async function centre(loc) {
  const b = await loc.boundingBox()
  if (!b) throw new Error(`not on screen: ${loc}`)
  return [b.x + b.width / 2, b.y + b.height / 2]
}

// ---- 1. the Golu opens ----
await tick(16)
cur.show = true
let [x, y] = await centre(page.locator('.cta-row .btn-primary'))
await moveTo(x + 8, y + 4, 30, { arc: 0.1 })
await tick(3)
await click()

// ---- 2. the workshop ----
rafs = 2 // a real browser draws at 60 Hz; lets the option tiles render at their normal pace
await page.waitForSelector('.creator')
await tick(4)
const cat = (label) => page.locator('.cat', { hasText: label })
const tile = (label) => page.locator('.tile', { has: page.locator('.tile-label', { hasText: new RegExp(`^${label}$`) }) })
;[x, y] = await centre(cat('Outfit'))
await moveTo(x, y, 10)
await click(2, 1)
await tick(1)
;[x, y] = await centre(tile('Kurta'))
await moveTo(x, y, 10)
await click(2, 1)
;[x, y] = await centre(page.locator('.swatch[aria-label="peacock"]'))
await moveTo(x, y, 9)
await click(2, 1)
;[x, y] = await centre(cat('Pose'))
await moveTo(x, y, 10)
await click(2, 1)
await tick(1)
;[x, y] = await centre(tile('Waving'))
await moveTo(x, y, 10)
await click(2, 2)
;[x, y] = await centre(page.locator('.name-field input'))
await moveTo(x - 60, y, 10)
await click(2, 1)
for (const ch of NAME) {
  await page.keyboard.type(ch)
  await page.waitForTimeout(20)
  await tick(2)
}
await tick(2)
;[x, y] = await centre(page.locator('.btn-place'))
await moveTo(x, y, 11)
await tick(1)
await click()

// ---- 3. place it on the Golu ----
rafs = 1
await page.waitForSelector('.place-head')
await moveTo(425, 600, 22, { arc: -0.08 })
// a point on the hopping doll that the 3D scene says is grabbable (the camera is still settling,
// so look again right before pressing)
async function findGrab(cx, cy) {
  for (const [ox, oy] of [[0, 0], [0, 15], [0, -15], [-8, 30], [8, 8], [-12, -8], [12, 25], [0, 40], [0, -30]]) {
    await page.mouse.move(cx + ox, cy + oy)
    await page.waitForTimeout(30)
    if (/grab/.test(await page.evaluate(() => document.body.style.cursor))) return [cx + ox, cy + oy]
  }
  return null
}
let grab = await findGrab(390, 585)
if (!grab) throw new Error('could not find the doll to grab')
await page.mouse.move(cur.x, cur.y)
await moveTo(grab[0], grab[1], 6, { arc: 0 })
grab = (await findGrab(grab[0], grab[1])) || (await findGrab(390, 585))
if (!grab) throw new Error('lost the doll before grabbing')
;[cur.x, cur.y] = grab
cur.hand = true
await tick(2)
await page.evaluate((c) => window.__cursor.down(c.x, c.y), cur)
await page.mouse.down()
await tick(2)
// step 2's top is a thin band on screen (about y 451-465 at 1280x720); aim for its middle, slowly,
// and hold still a moment so the doll stops swinging before it is set down
await moveTo(536, 458, 40, { arc: -0.05, ease: sine })
await tick(7)
await page.mouse.up()
await tick(4)
cur.hand = false
await moveTo(1010, 470, 26, { arc: 0.08 })
// the "You're part of the Internet Golu" card comes up 1.5 s after it lands
const dropped = frame
while (!(await page.locator('.celebrate').count()) && frame < dropped + 120) await tick()
await tick(22)
await browser.close()
console.log(`${frame} frames in ${Math.round((Date.now() - t0) / 1000)}s; encoding ${OUT}`)

// ---- encode, with the Golu's own music under it ----
const dur = frame / FPS
const enc = spawnSync(
  'ffmpeg',
  [
    ...['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(frames, '%05d.png')],
    ...['-i', path.join(ROOT, 'src/assets/golu-bgm.mp3')],
    '-filter_complex',
    `[0:v]fade=t=in:st=0:d=0.25,fade=t=out:st=${(dur - 0.4).toFixed(2)}:d=0.4,format=yuv420p[v];` +
      `[1:a]atrim=0:${dur.toFixed(2)},afade=t=in:st=0:d=1.2,afade=t=out:st=${(dur - 0.9).toFixed(2)}:d=0.9[a]`,
    ...['-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-c:a', 'aac', '-b:a', '160k'],
    ...['-movflags', '+faststart', '-shortest', OUT],
  ],
  { stdio: 'inherit' },
)
fs.rmSync(frames, { recursive: true, force: true })
if (enc.status !== 0) process.exit(enc.status || 1)
console.log(`wrote ${OUT}`)
