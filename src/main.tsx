import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e.message && e.message.includes('ResizeObserver')) {
      e.stopImmediatePropagation()
    }
  })
}

function initSafeAreaDetection() {
  if (typeof window === 'undefined') return

  const applyInsets = () => {
    if (!document.body) return

    // Medir lo que el motor web reporta a través de env()
    const testEl = document.createElement('div')
    testEl.style.cssText =
      'position:fixed;top:0;bottom:0;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none;z-index:-9999;'
    document.body.appendChild(testEl)
    const computed = window.getComputedStyle(testEl)
    const envTop = parseFloat(computed.paddingTop) || 0
    const envBottom = parseFloat(computed.paddingBottom) || 0
    document.body.removeChild(testEl)

    let topInset = envTop
    let bottomInset = envBottom

    const isMobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      ('ontouchstart' in window && window.innerWidth < 800)

    // Respaldo inteligente si env() da 0 en ciertos navegadores o PWA en Android
    if (isMobile) {
      if (topInset === 0) {
        const isStandalone =
          window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as unknown as { standalone?: boolean }).standalone
        if (isStandalone) {
          topInset = 24
        }
      }

      if (bottomInset === 0) {
        // En Android, la diferencia entre screen.height e innerHeight revela la barra del sistema
        const diff = Math.round(window.screen.height - window.innerHeight)
        if (diff >= 40 && diff <= 120) {
          // Barra tradicional de 3 botones (Atrás, Inicio, Recientes) ~48px
          bottomInset = 48
        } else if (diff > 10 && diff < 40) {
          // Barra moderna de navegación por gestos ~20px
          bottomInset = 20
        }
      }
    }

    document.documentElement.style.setProperty('--safe-area-inset-top', `${topInset}px`)
    document.documentElement.style.setProperty('--safe-area-inset-bottom', `${bottomInset}px`)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyInsets)
  } else {
    applyInsets()
  }

  window.addEventListener('resize', applyInsets, { passive: true })
  window.addEventListener('orientationchange', applyInsets, { passive: true })
}

initSafeAreaDetection()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

