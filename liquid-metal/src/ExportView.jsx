import { Suspense, useEffect, useState } from 'react'
import { LiquidMetal } from '@paper-design/shaders-react'
import { liftFilter } from './lift.js'

// Frame-by-frame renderer driven by scripts/export.mjs. No UI, transparent background.
function Frame({ settings, logoUrl }) {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    window.__setFrame = (f) => new Promise((resolve) => {
      setFrame(f)
      // wait for React to commit and the shader to draw
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    })
    window.__ready = true
  }, [])
  const { background, speed, lift, ...shader } = settings
  return (
    <LiquidMetal
      {...shader}
      image={logoUrl}
      suspendWhenProcessingImage
      colorBack="#00000000"
      speed={0}
      frame={frame}
      style={{ width: '100vw', height: '100vh', filter: liftFilter(lift) }}
    />
  )
}

export default function ExportView() {
  const { settings, logoUrl } = window.__EXPORT__
  // The app's cream page background would otherwise end up in every frame.
  document.documentElement.style.background = 'transparent'
  document.body.style.background = 'transparent'
  return (
    <Suspense fallback={null}>
      <Frame settings={settings} logoUrl={logoUrl} />
    </Suspense>
  )
}
