import { useState } from 'react'
import { HeroGradient, DEFAULTS } from './HeroGradient.jsx'

const SLIDERS = [
  { key: 'uSpeed', label: 'Speed', min: 0, max: 0.6, step: 0.01 },
  { key: 'grain', label: 'Grain', min: 0, max: 0.6, step: 0.02 },
  { key: 'uStrength', label: 'Wave strength', min: 0, max: 5, step: 0.1 },
  { key: 'uDensity', label: 'Wave density', min: 0.2, max: 3, step: 0.1 },
  { key: 'brightness', label: 'Brightness', min: 0.6, max: 1.6, step: 0.05 },
]

export default function App() {
  const [settings, setSettings] = useState(DEFAULTS)
  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }))

  return (
    <>
      <section className="hero">
        <HeroGradient settings={settings} />
        <div className="hero-content">
          <p className="eyebrow">Your product</p>
          <h1>A calm, warm welcome.</h1>
          <p className="lede">
            The gradient lives only behind this hero section. The rest of the page is plain cream.
          </p>
          <a className="cta" href="#below">Get started</a>
        </div>
      </section>

      <main id="below" className="below">
        <h2>Below the hero</h2>
        <p>No gradient here, so you can see where it stops.</p>
      </main>

      <aside className="tuner" aria-label="Gradient tuning">
        <strong>Tune</strong>
        {SLIDERS.map(({ key, label, min, max, step }) => (
          <label key={key}>
            <span>{label} <code>{settings[key]}</code></span>
            <input
              type="range" min={min} max={max} step={step}
              value={settings[key]}
              onChange={(e) => set(key, Number(e.target.value))}
            />
          </label>
        ))}
        <button onClick={() => setSettings(DEFAULTS)}>Reset</button>
      </aside>
    </>
  )
}
