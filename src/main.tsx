import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Registrar Service Worker para soporte PWA Offline en producción
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('🐾 Gastitos PWA Service Worker activo:', reg.scope)
      })
      .catch((err) => {
        console.warn('Fallo registro de Service Worker PWA:', err)
      })
  })
}

