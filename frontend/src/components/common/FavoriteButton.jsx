import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { addFavorite, removeFavorite, listFavorites } from '../../services/favorites.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function FavoriteButton({ targetType, targetId }) {
  const { isAuthenticated } = useAuth()
  const [isFav, setIsFav] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    listFavorites(targetType)
      .then((r) => {
        const found = (r.data || []).some((x) => x.id === targetId)
        setIsFav(found)
      })
      .catch(() => {})
  }, [isAuthenticated, targetType, targetId])

  if (!isAuthenticated) return null

  const toggle = async () => {
    if (busy) return
    setBusy(true)
    try {
      if (isFav) {
        await removeFavorite(targetType, targetId)
        setIsFav(false)
      } else {
        await addFavorite(targetType, targetId)
        setIsFav(true)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={`p-2 rounded-lg border transition-colors ${
        isFav
          ? 'bg-red-50 border-red-200 text-red-600'
          : 'bg-white border-slate-200 text-slate-400 hover:text-red-500'
      }`}
    >
      <Heart size={18} fill={isFav ? 'currentColor' : 'none'} />
    </button>
  )
}