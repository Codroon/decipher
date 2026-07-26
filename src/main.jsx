// Must be the first import — Faro needs to be initialized before any
// component mounts or any fetch call fires, so it can capture everything.
import './faro.js'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/design-tokens.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
