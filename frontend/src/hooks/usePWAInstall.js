import { useCallback, useEffect, useState } from 'react'

/**
 * Gestion de l'installation PWA.
 *
 * - Chrome / Edge / Android / Samsung : l'événement `beforeinstallprompt` est capturé
 *   AU CHARGEMENT DU MODULE (il peut se déclencher avant le premier rendu React),
 *   puis rejoué via `install()`.
 * - iOS / iPadOS (Safari) : pas d'API → on expose `isIOS` pour afficher les instructions
 *   « Partager → Sur l'écran d'accueil ».
 */
let deferredPrompt = null
let installedFlag = false
const listeners = new Set()
const notify = () => listeners.forEach((fn) => fn())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()            // on affiche notre propre UI
    deferredPrompt = e
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    installedFlag = true
    notify()
  })
}

const detectStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true)

const detectIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

export default function usePWAInstall() {
  const [, force] = useState(0)

  useEffect(() => {
    const fn = () => force((n) => n + 1)
    listeners.add(fn)
    return () => listeners.delete(fn)
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return 'unavailable'
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice   // 'accepted' | 'dismissed'
    deferredPrompt = null                                   // l'événement n'est utilisable qu'une fois
    notify()
    return outcome
  }, [])

  const isStandalone = detectStandalone() || installedFlag
  return {
    canInstall: !!deferredPrompt && !isStandalone,
    isIOS: detectIOS(),
    isStandalone,
    install,
  }
}
