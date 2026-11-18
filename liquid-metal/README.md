# Liquid metal logo

A local tuning page and exporter for a warm-chrome liquid metal logo, built on the
`LiquidMetal` shader in `@paper-design/shaders-react` (the maintained version of
[paper-design/liquid-logo](https://github.com/paper-design/liquid-logo)).

## Why not liquid.paper.design or the liquid-logo repo?

- **No colour control.** That app hard-codes a cool silver. `LiquidMetal` has `colorTint`.
- **No export.** Neither the site nor the repo can save a video.
- **Your logo goes public.** The site uploads every logo you load to Vercel Blob with
  public access. This tool keeps the logo in your browser and on your machine.

## Tune

```
npm install
npm run dev        # http://localhost:5174
```

Drop your logo anywhere on the page (a transparent PNG or SVG; bold shapes work better
than thin text). Adjust the sliders, then click **Copy settings** and paste the result
into `settings.json`.

| Setting | What it does |
| --- | --- |
| Metal tint | Colour-burns into the chrome. Light peach or gold gives warm chrome. |
| Lift shadows | Softens the near-black reflections, which tint alone can't lighten. |
| Speed | Animation speed. Exports keep the same pace. |
| Stripe density, Softness | How many reflection bands there are and how sharp they look. |
| Edge refraction, Liquid distortion | How strongly the shape bends the reflections. |
| Red / Blue dispersion | Coloured fringing on the edges. Keep it low for a soft look. |

## Export a loop

Needs ffmpeg and Playwright with Chromium (`npm i -D playwright && npx playwright install chromium`).

```
npm run export -- path/to/logo.png            # 6 s loop, 30 fps, 1080 px
npm run export -- logo.png --seconds 8 --size 1350
```

This writes to `export/`:

| File | Use |
| --- | --- |
| `logo-loop-1080.mp4` | Socials. Square, on your background colour. |
| `logo-loop-720.mp4` | Your site, on your background colour. Plays everywhere. |
| `logo-loop-720.webm` | Your site, transparent background. Chrome, Firefox and Edge only. |

The shader doesn't repeat by itself, so the exporter renders one extra second and
crossfades it into the start. The last frame flows straight back into the first.

## On your site

If the logo sits on your cream background, use the MP4. It matches `#FAF7F2` exactly
(within 8-bit rounding) and plays in every browser:

```html
<video src="/logo-loop-720.mp4" autoplay muted loop playsinline
       width="360" height="360" aria-hidden="true"></video>
```

Use the transparent WebM only on a background other than cream. Safari can't show WebM
transparency, so give Safari the MP4.

**Or render it live** for the sharpest result and no video download. This uses the
same settings; the filter is "Lift shadows" at 0.5:

```jsx
import { LiquidMetal } from '@paper-design/shaders-react'

<LiquidMetal
  image="/logo.png"
  colorBack="#00000000" colorTint="#F2C29F"
  repetition={2} softness={0.35} shiftRed={0.12} shiftBlue={0}
  distortion={0.07} contour={0.4} angle={70} scale={0.6} speed={0.6}
  style={{ width: 360, height: 360, filter: 'contrast(0.825) brightness(1.09)' }}
/>
```

The live version pauses itself when the tab is hidden or the logo is scrolled out of view.
