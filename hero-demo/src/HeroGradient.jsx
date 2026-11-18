import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react'

// Brand colours
export const CREAM = '#FAF7F2'
export const WARM_ORANGE = '#D97757'
// A soft blend of the two, so the orange fades into the cream rather than banding.
export const PEACH = '#F2D3C2'

// Defaults tuned for a slow, subtle hero background.
export const DEFAULTS = {
  uSpeed: 0.08, // animation speed (ShaderGradient's own examples use ~0.4)
  uStrength: 1.4, // how much the surface bends
  uDensity: 1.1, // how tightly packed the waves are
  uFrequency: 2.5,
  grain: 0.18, // opacity of the CSS grain overlay, from 0 to 1
  brightness: 1.3,
}

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Tileable SVG noise, used as a light film grain over the gradient.
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.17 0 0 0 0 0.13 0 0 0 0 0.11 0 0 0 1.4 -0.2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

export function HeroGradient({ settings = DEFAULTS }) {
  const s = { ...DEFAULTS, ...settings }
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
    <ShaderGradientCanvas
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      pixelDensity={1}
      fov={45}
    >
      <ShaderGradient
        control="props"
        type="plane"
        animate={prefersReducedMotion ? 'off' : 'on'}
        uSpeed={s.uSpeed}
        uStrength={s.uStrength}
        uDensity={s.uDensity}
        uFrequency={s.uFrequency}
        uAmplitude={1}
        color1={CREAM}
        color2={PEACH}
        color3={WARM_ORANGE}
        lightType="3d"
        brightness={s.brightness}
        reflection={0}
        // ShaderGradient's built-in grain shifts the exposure of the whole image,
        // so it stays off and the grain comes from the CSS overlay below.
        grain="off"
        cDistance={3.6}
        cPolarAngle={90}
        cAzimuthAngle={180}
        positionX={-1.4}
        positionY={0}
        positionZ={0}
        rotationX={0}
        rotationY={10}
        rotationZ={50}
      />
    </ShaderGradientCanvas>
    <div style={{ position: 'absolute', inset: 0, backgroundImage: NOISE, opacity: s.grain }} />
    </div>
  )
}
