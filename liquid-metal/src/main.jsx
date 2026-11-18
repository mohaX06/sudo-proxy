import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ExportView from './ExportView.jsx'
import './styles.css'

// The export script sets window.__EXPORT__ before the page loads.
const Root = window.__EXPORT__ ? ExportView : App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
