// Renders the liquid metal logo frame by frame and encodes a seamless loop.
//
//   npm run export -- path/to/logo.png [--seconds 6] [--fps 30] [--fade 1] [--size 1080]
//
// Needs: ffmpeg on PATH, and Playwright with Chromium
// (npm i -D playwright && npx playwright install chromium).
// Settings come from settings.json in this folder.
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(resolve(root, 'package.json'))
const { chromium } = require('playwright')

// ---- options ----
const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? Number(args[i + 1]) : fallback
}
const logoPath = resolve(args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--')) ?? resolve(root, 'public/placeholder-logo.png'))
const seconds = opt('seconds', 6) // length of the finished loop
const fps = opt('fps', 30)
const fade = opt('fade', 1) // seconds of crossfade that hide the loop seam
const size = opt('size', 1080) // square output, in pixels
if (!existsSync(logoPath)) throw new Error(`Logo not found: ${logoPath}`)

const settings = JSON.parse(readFileSync(resolve(root, 'settings.json'), 'utf8'))
const loopFrames = Math.round(seconds * fps)
const fadeFrames = Math.round(fade * fps)
const total = loopFrames + fadeFrames
const outDir = resolve(root, 'export')
const framesDir = resolve(outDir, 'frames')
rmSync(framesDir, { recursive: true, force: true })
mkdirSync(framesDir, { recursive: true })

// ---- render frames ----
const server = await createServer({ root, logLevel: 'error', server: { port: 0 } })
await server.listen()
const url = server.resolvedUrls.local[0]

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 })
page.on('pageerror', (e) => console.error('page error:', e.message))
// Serve the logo from memory: it never leaves this machine.
await page.route('**/__logo', (route) => route.fulfill({ body: readFileSync(logoPath), contentType: 'image/png' }))
await page.addInitScript((cfg) => { window.__EXPORT__ = cfg }, { settings, logoUrl: '/__logo' })
await page.goto(url)
await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 })

const msPerFrame = (1000 / fps) * settings.speed // same pace as the live preview
const canvas = page.locator('canvas')
const started = Date.now()
for (let i = 0; i < total; i++) {
  await page.evaluate((f) => window.__setFrame(f), i * msPerFrame)
  await canvas.screenshot({ path: resolve(framesDir, `${String(i).padStart(4, '0')}.png`), omitBackground: true })
  if (i % fps === 0) process.stdout.write(`\rrendered ${i + 1}/${total} frames`)
}
console.log(`\rrendered ${total}/${total} frames in ${((Date.now() - started) / 1000).toFixed(0)}s`)
await browser.close()
await server.close()

// ---- encode ----
// Frames 0..L+F-1 are rendered. The first F frames of the loop are a crossfade from
// frames L..L+F-1 into frames 0..F-1, so the last frame flows straight back into the first.
const L = loopFrames, F = fadeFrames
const loopGraph = [
  `[0:v]format=gbrap,split=3[a][b][c]`,
  `[a]trim=start_frame=${L}:end_frame=${L + F},setpts=PTS-STARTPTS[tail]`,
  `[b]trim=start_frame=0:end_frame=${F},setpts=PTS-STARTPTS[head]`,
  `[tail][head]blend=all_expr='A*(1-N/${F})+B*(N/${F})'[seam]`,
  `[c]trim=start_frame=${F}:end_frame=${L},setpts=PTS-STARTPTS[mid]`,
  `[seam][mid]concat=n=2:v=1,format=rgba[loop]`,
].join(';')
const bg = settings.background.replace('#', '0x')
const input = ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', resolve(framesDir, '%04d.png')]
const ffmpeg = (extraGraph, out, codec) => {
  const r = spawnSync('ffmpeg', [...input, '-filter_complex', `${loopGraph};${extraGraph}`, '-map', '[out]', ...codec, resolve(outDir, out)], { stdio: 'inherit' })
  if (r.status !== 0) throw new Error(`ffmpeg failed for ${out}`)
  console.log(`wrote export/${out}`)
}
// Tag colour explicitly so every browser decodes the background to the same cream.
const bt709 = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv']
const h264 = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', ...bt709, '-movflags', '+faststart']
// Composite in RGB, then convert to BT.709 YUV exactly once, so the cream stays exact.
const toVideo = (px, fmt) => `scale=${px}:${px}:flags=lanczos+accurate_rnd+full_chroma_int:out_color_matrix=bt709:out_range=tv,format=${fmt}`
const onBackground = (px) => `color=c=${bg}:s=${size}x${size}:r=${fps},format=gbrp[bg];[bg][loop]overlay=shortest=1:format=gbrp,${toVideo(px, 'yuv420p')}[out]`

// Socials: square, on your background colour.
ffmpeg(onBackground(size), `logo-loop-${size}.mp4`, h264)
// Website: transparent WebM (Chrome, Firefox, Edge) plus an MP4 on your background for Safari.
ffmpeg(`[loop]${toVideo(720, 'yuva420p')}[out]`, 'logo-loop-720.webm',
  ['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '32', '-pix_fmt', 'yuva420p', ...bt709, '-row-mt', '1'])
ffmpeg(onBackground(720), 'logo-loop-720.mp4', h264)
