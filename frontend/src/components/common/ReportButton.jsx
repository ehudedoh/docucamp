import { useState } from 'react'
import { Flag, AlertCircle, CheckCircle } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import { REPORT_REASONS } from '../../utils/constants.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { reportDocument } from '../../services/documents.js'
import { reportMaterial } from '../../services/materials.js'

export default function ReportButton({ targetType, targetId }) {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  // Le bouton n'apparaît que pour les utilisateurs connectés
  if (!isAuthenticated) return null

  const reset = () => {
    setReason('')
    setDescription('')
    setError(null)
    setSuccess(false)
  }

  const handleClose = () => {
    setOpen(false)
    // Réinitialise après fermeture (léger délai pour éviter un flash visuel)
    setTimeout(reset, 200)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!reason) {
      setError('Veuillez choisir une raison.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const fn = targetType === 'RESOURCE' ? reportDocument : reportMaterial
      await fn(targetId, { reason, description: description.trim() || null })
      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        reset()
      }, 1500)
    } catch (err) {
      setError(err.message || 'Impossible d\'envoyer le signalement.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-slate-500 hover:text-red-600 inline-flex items-center gap-1 transition-colors"
        aria-label="Signaler ce contenu"
      >
        <Flag size={12} /> Signaler
      </button>

      <Modal open={open} onClose={handleClose} title="Signaler un contenu">
        {success ? (
          <div className="flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
            <CheckCircle size={18} className="mt-0.5 shrink-0" />
            <span>Signalement envoyé. Merci de contribuer à la qualité de DocuCamp.</span>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="report-reason" className="label">
                Raison <span className="text-red-500">*</span>
              </label>
              <select
                id="report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input"
                required
                disabled={submitting}
              >
                <option value="">— Sélectionner —</option>
                {REPORT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="report-description" className="label">
                Description <span className="text-slate-400 font-normal">(optionnel)</span>
              </label>
              <textarea
                id="report-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                maxLength={2000}
                placeholder="Décrivez brièvement le problème..."
                disabled={submitting}
              />
              <p className="text-xs text-slate-400 mt-1 text-right">
                {description.length}/2000
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary"
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-danger"
                disabled={submitting || !reason}
              >
                {submitting ? 'Envoi...' : 'Envoyer le signalement'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}