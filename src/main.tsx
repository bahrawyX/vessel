import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// No StrictMode: its dev double-mount creates and destroys an extra WebGL
// context on every load, which pushes the browser toward context eviction.
createRoot(document.getElementById('root')!).render(<App />)
