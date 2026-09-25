import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import usePWAInstall from '../../hooks/usePWAInstall.js'
import Logo from './Logo.jsx'

const DISMISS_KEY = 'docucamp_install_dismissed_at'
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000   // ne pas re-proposer pendant 14 jours
const DELAY_MS = 4000                         // laisser l'utilisateur découvrir le site d'abord

function recentlyDismissed() {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY))
    return t && Date.now() - t < SNOOZE_MS
  } catch {
    return false
  }
}

/** Bannière discrète « Installer l'application » (bas de l'écran). */
export default function InstallPrompt() {
  const { canInstall, isIOS, isStandalone, install } = usePWAInstall()
  const [ready, setReady] = useState(false)
  const [hidden, setHidden] = useState(recentlyDismissed)

  useEffect(() => {
    const id = setTimeout(() => setReady(true), DELAY_MS)
    return () => clearTimeout(id)
  }, [])

  const dismiss = () => {
    setHidden(true)
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* stockage indisponible */ }
  }

  const onInstall = async () => {
    const outcome = await install()
    if (outcome === 'dismissed') dismiss()
  }

  const showIOS = isIOS && !isStandalone
  if (!ready || hidden || isStandalone || (!canInstall && !showIOS)) return null

  return (
    <div
      role="dialog"
      aria-label="Installer l'application"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <Logo size={40} withText={false} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900">Installer DocuCamp</p>
            {showIOS ? (
              <p className="mt-0.5 text-sm text-slate-600">
                Touchez <Share size={14} className="inline -mt-0.5" aria-label="Partager" /> puis
                {' '}<strong>« Sur l&apos;écran d&apos;accueil »</strong> pour l&apos;ajouter comme une appli.
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-slate-600">
                Accès rapide depuis votre écran d&apos;accueil, en plein écran.
              </p>
            )}
            {!showIOS && (
              <button type="button" onClick={onInstall} className="btn-primary text-sm mt-3">
                <Download size={16} /> Installer
              </button>
            )}
          </div>
          <button type="button" onClick={dismiss} aria-label="Fermer" className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
