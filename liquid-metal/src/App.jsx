import { useEffect, useState } from 'react'
import { LiquidMetal } from '@paper-design/shaders-react'
import saved from '../settings.json'
import { liftFilter } from './lift.js'

const PRESETS = {
  'Warm chrome': saved,
  'Copper (brand orange)': { ...saved, colorTint: '#D97757', softness: 0.4, shiftRed: 0.1, lift: 0.6 },
  'Cool chrome (library default)': {
    colorTint: '#FFFFFF', background: '#FAF7F2', repetition: 2, softness: 0.1, shiftRed: 0.3,
    shiftBlue: 0.3, distortion: 0.07, contour: 0.4, angle: 70, scale: 0.6, lift: 0, speed: 1,
  },
}

const SLIDERS = [
  { key: 'speed', label: 'Speed', min: 0, max: 2, step: 0.05 },
  { key: 'repetition', label: 'Stripe density', min: 1, max: 10, step: 0.1 },
  { key: 'softness', label: 'Softness', min: 0, max: 1, step: 0.01 },
  { key: 'contour', label: 'Edge refraction', min: 0, max: 1, step: 0.01 },
  { key: 'distortion', label: 'Liquid distortion', min: 0, max: 1, step: 0.01 },
  { key: 'shiftRed', label: 'Red dispersion', min: -1, max: 1, step: 0.01 },
  { key: 'shiftBlue', label: 'Blue dispersion', min: -1, max: 1, step: 0.01 },
  { key: 'angle', label: 'Flow angle', min: 0, max: 360, step: 1 },
  { key: 'lift', label: 'Lift shadows', min: 0, max: 1, step: 0.05 },
  { key: 'scale', label: 'Logo size', min: 0.2, max: 1.2, step: 0.01 },
]

export default function App() {
  const [s, setS] = useState(saved)
  const [logo, setLogo] = useState('/placeholder-logo.png')
  const [logoName, setLogoName] = useState('placeholder (send me your logo)')
  const [copied, setCopied] = useState(false)
  const set = (k, v) => setS((p) => ({ ...p, [k]: v }))

  // The logo stays in this browser tab: it is never uploaded anywhere.
  const loadFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setLogo(URL.createObjectURL(file))
    setLogoName(file.name)
  }
  useEffect(() => {
    const prevent = (e) => e.preventDefault()
    const drop = (e) => { e.preventDefault(); loadFile(e.dataTransfer.files[0]) }
    window.addEventListener('dragover', prevent)
    window.addEventListener('drop', drop)
    return () => { window.removeEventListener('dragover', prevent); window.removeEventListener('drop', drop) }
  }, [])

  const { background, lift, ...shader } = s
  const json = JSON.stringify(s, null, 2)

  return (
    <div className="layout" style={{ background }}>
      <main className="stage">
        <LiquidMetal {...shader} image={logo} colorBack="#00000000" style={{ width: '100%', height: '100%', filter: liftFilter(lift) }} />
      </main>

      <aside className="panel">
        <h1>Liquid metal</h1>

        <section>
          <h2>Logo</h2>
          <label className="file">
            <input type="file" accept="image/png,image/svg+xml,image/webp" onChange={(e) => loadFile(e.target.files[0])} />
            Choose a file, or drop one anywhere
          </label>
          <p className="hint">Now showing: {logoName}. A transparent PNG or SVG works best; bold shapes beat thin text.</p>
        </section>

        <section>
          <h2>Colour</h2>
          <div className="presets">
            {Object.entries(PRESETS).map(([name, p]) => (
              <button key={name} onClick={() => setS(p)}>{name}</button>
            ))}
          </div>
          <label className="color">
            <span>Metal tint</span>
            <input type="color" value={s.colorTint} onChange={(e) => set('colorTint', e.target.value.toUpperCase())} />
            <code>{s.colorTint}</code>
          </label>
          <label className="color">
            <span>Background</span>
            <input type="color" value={s.background} onChange={(e) => set('background', e.target.value.toUpperCase())} />
            <code>{s.background}</code>
          </label>
        </section>

        <section>
          <h2>Motion and refraction</h2>
          {SLIDERS.map(({ key, label, min, max, step }) => (
            <label key={key} className="slider">
              <span>{label} <code>{s[key] ?? 0}</code></span>
              <input type="range" min={min} max={max} step={step} value={s[key] ?? 0} onChange={(e) => set(key, Number(e.target.value))} />
            </label>
          ))}
        </section>

        <section>
          <h2>Settings</h2>
          <p className="hint">Paste these into <code>settings.json</code>, then run <code>npm run export -- your-logo.png</code>.</p>
          <pre>{json}</pre>
          <button onClick={() => navigator.clipboard.writeText(json).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })}>
            {copied ? 'Copied' : 'Copy settings'}
          </button>
        </section>
      </aside>
    </div>
  )
}
