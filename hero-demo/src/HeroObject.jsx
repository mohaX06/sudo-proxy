import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'

export const BRAND_ORANGE = '#D97757'

// Defaults tuned for a calm, slow object.
export const OBJECT_DEFAULTS = {
  spin: 0.15, // radians per second around the vertical axis
  float: 0.08, // how far it bobs up and down
  tilt: 0.25, // how far it leans toward the mouse, in radians
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Mouse position across the whole window, from -1 to 1. Tracked with one passive
// listener instead of R3F's raycasting events, which this scene doesn't need.
function useWindowPointer() {
  const pointer = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const onMove = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])
  return pointer
}

// 'always' while the tab is visible and the canvas is on screen; 'never' otherwise.
function useFrameloop(ref) {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  const [onScreen, setOnScreen] = useState(true)

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting))
    io.observe(ref.current)
    return () => io.disconnect()
  }, [ref])

  return visible && onScreen ? 'always' : 'never'
}

function SoftShape({ spin, float, tilt, pointer, still }) {
  const group = useRef()
  const mesh = useRef()
  const t = useRef(0) // our own clock, so a pause doesn't cause a jump on resume

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30) // clamp: first frame after a pause can be huge
    if (!still) {
      t.current += delta
      mesh.current.rotation.y += spin * delta
      mesh.current.rotation.x = 0.35 + Math.sin(t.current * 0.4) * 0.08
      group.current.position.y = Math.sin(t.current * 0.8) * float
    }
    // Ease toward the mouse rather than snapping to it.
    const ease = 1 - Math.exp(-delta * 2.5)
    group.current.rotation.y += (pointer.current.x * tilt - group.current.rotation.y) * ease
    group.current.rotation.x += (-pointer.current.y * tilt * 0.6 - group.current.rotation.x) * ease
  })

  return (
    <group ref={group}>
      <RoundedBox ref={mesh} args={[1.25, 1.25, 1.25]} radius={0.36} smoothness={6} rotation={[0.35, 0.6, 0]}>
        <meshPhysicalMaterial color={BRAND_ORANGE} roughness={0.42} clearcoat={0.35} clearcoatRoughness={0.4} />
      </RoundedBox>
    </group>
  )
}

export function HeroObject({ settings = OBJECT_DEFAULTS, className }) {
  const wrapper = useRef()
  const pointer = useWindowPointer()
  const frameloop = useFrameloop(wrapper)
  const still = prefersReducedMotion()
  const s = { ...OBJECT_DEFAULTS, ...settings }

  return (
    <div ref={wrapper} className={className} aria-hidden="true">
      <Canvas
        frameloop={still ? 'demand' : frameloop}
        dpr={[1, 1.5]} // cap pixel ratio: a soft object doesn't need retina-sharp edges
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        camera={{ position: [0, 0, 4.2], fov: 35 }}
        flat // no tone mapping, so the orange stays close to #D97757
        onCreated={(state) => { if (import.meta.env.DEV) window.__heroR3F = state }}
      >
        <hemisphereLight args={['#FFF6EC', '#E8B9A3', 2.2]} />
        <directionalLight position={[3, 4, 5]} intensity={1.8} color="#FFF3E6" />
        <directionalLight position={[-4, -1, 3]} intensity={0.9} color="#FBE3D6" />
        <SoftShape {...s} pointer={pointer} still={still} />
      </Canvas>
    </div>
  )
}
