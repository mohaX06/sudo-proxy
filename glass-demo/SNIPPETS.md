# Liquid glass nav and pricing cards: paste-in code

Tested in [`index.html`](index.html), which is the same code plus a tuning panel.
Liquid Glass JS has no npm package, so it loads from jsDelivr pinned to commit `78cb6cc`.
It needs WebGL and must be served over http(s), not opened as a `file://` page.

## 1. Mark the elements that should be glass

Add `data-glass` to the nav wrapper and to each pricing card. `data-glass-radius`
sets the corner radius in pixels. The element keeps its tag and its children.

```html
<header class="site-nav" data-glass data-glass-radius="22">
  <nav class="nav-inner" aria-label="Main"> ...your links... </nav>
</header>

<article class="card" data-glass data-glass-radius="24">
  <div class="card-body"> ...your card content... </div>
</article>
```

Your text colour stays as it is. The contrast numbers below assume dark text (`#1F1612`).

## 2. CSS (add to your stylesheet)

```css
/* ---------- Liquid glass panels ---------- */
.lg-panel {
  position: relative;
  isolation: isolate;   /* keeps the library's z-index:-1 canvas inside the panel */
  display: block;
  width: 100%;
  height: 100%;
}
.lg-panel > canvas { box-shadow: 0 10px 30px rgba(60, 30, 10, .14) !important; }
/* Readability layer: a light frosted wash between the glass and the text. */
.lg-scrim {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: rgba(255, 255, 255, var(--glass-scrim, .45));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .55);
}
.lg-content { position: relative; height: 100%; }
@media (prefers-reduced-transparency: reduce) { .lg-scrim { background: rgba(255, 255, 255, .92); } }

```

## 3. Scripts (paste just before `</body>`)

```html
<!-- Liquid Glass JS (+ html2canvas, which it uses to capture the page) -->
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dashersw/liquid-glass-js@78cb6ccb0b9987bb60a88b14ccbd13a9e6e8ab2a/container.js"></script>
<script>
  // Glass settings shared by every panel. Read once when each panel's WebGL starts.
  window.glassControls = {
    blurRadius: 8,       // 1-15
    edgeIntensity: 0.01,
    rimIntensity: 0.05,
    baseIntensity: 0.01,
    edgeDistance: 0.15,
    rimDistance: 0.8,
    baseDistance: 0.1,
    cornerBoost: 0.02,
    rippleEffect: 0.1,
  }
  const GLASS_TINT = 0.2   // 0-1
  const GLASS_SCRIM = 0.45 // white wash behind text, 0-1

  // Turn an existing element into a liquid glass panel. The element keeps its tag
  // and its children; the library's own <div> goes inside it, behind the content.
  function makeGlass(host) {
    const glass = new Container({
      type: 'rounded',
      borderRadius: Number(host.dataset.glassRadius || 24),
      tintOpacity: GLASS_TINT,
    })
    const scrim = document.createElement('div')
    scrim.className = 'lg-scrim'
    const content = document.createElement('div')
    content.className = 'lg-content'
    content.append(...host.childNodes)
    glass.element.classList.add('lg-panel')
    glass.element.append(scrim, content)
    host.append(glass.element)
    return glass
  }

  // Snapshot of the page for the glass to refract. The library's own capture removes
  // the glass panels from its copy of the page, which collapses in-flow panels (like
  // pricing cards) and shifts everything below them. Hiding them keeps the layout.
  function captureSnapshot() {
    return html2canvas(document.body, {
      scale: 1, useCORS: true, backgroundColor: null,
      onclone: doc => doc.querySelectorAll('.glass-container').forEach(el => { el.style.visibility = 'hidden' }),
    })
  }


  // The library captures the page once. Re-capture after a resize so the glass
  // keeps lining up with what is behind it.
  let resizeTimer
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(async () => {
      Container.instances.forEach(c => c.updateSizeFromDOM())
      const snapshot = await captureSnapshot()
      Container.pageSnapshot = snapshot
      Container.instances.forEach(c => {
        const gl = c.gl_refs.gl
        if (!gl) return
        gl.bindTexture(gl.TEXTURE_2D, c.gl_refs.texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, snapshot)
        gl.uniform2f(c.gl_refs.textureSizeLoc, snapshot.width, snapshot.height)
        c.render?.()
      })
    }, 250)
  })

  window.addEventListener('load', () => {
    document.documentElement.style.setProperty('--glass-scrim', GLASS_SCRIM)
    // The library snapshots the page the moment the first Container is created,
    // before panel text has moved into the glass. Hold that off, build every
    // panel, then take one snapshot and start the glass.
    Container.isCapturing = true
    document.querySelectorAll('[data-glass]').forEach(makeGlass)
    captureSnapshot().then(snapshot => {
      Container.pageSnapshot = snapshot
      Container.isCapturing = false
      Container.waitingForSnapshot.splice(0).forEach(c => c.initWebGL())
    })
  })
</script>
```

## Tuning

- `blurRadius` (1-15): how frosted the glass is.
- `GLASS_TINT` (0-1): the library's own colour wash, sampled from the background.
- `GLASS_SCRIM` (0-1): the white wash that keeps text readable.

Measured worst-case contrast of dark text over the glass on the demo background
(WCAG AA needs 4.5:1):

| Blur | Wash | Worst text | Passing |
| ---- | ---- | ---------- | ------- |
| 8    | 0.45 | 8.7:1      | 19/19   |
| 5    | 0.3  | 5.0:1      | 19/19   |
| 3    | 0.2  | 3.1:1      | 6/19    |
| 2    | 0    | 1.7:1      | 2/19    |

Stay at blur 5 / wash 0.3 or above. A busier or darker background than the demo
needs more wash, so re-check on your real page.

## Known limits

- The glass refracts an `html2canvas` redraw of the page, not the real pixels.
  CSS that html2canvas can't draw won't appear in the glass. In testing,
  `repeating-linear-gradient` and `vw`-sized gradients were missing.
- The snapshot is taken once at load and again after a resize. Content that changes
  later (animations, video, lazy-loaded images) won't update in the glass.
- Glass panels don't show up in each other's glass. When the fixed nav scrolls over
  a card, it refracts the page background behind the card, not the card itself.
- Visitors without WebGL still get the white wash behind the text, so it stays readable.
