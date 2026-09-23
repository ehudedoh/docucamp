import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Package, Trash2 } from 'lucide-react'
import { getMaterial, deleteMaterial, updateMaterial } from '../../services/materials.js'
import { formatDate, formatPrice } from '../../utils/formatters.js'
import { buildWhatsAppLink } from '../../utils/whatsapp.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import Badge from '../../components/ui/Badge.jsx'
import FavoriteButton from '../../components/common/FavoriteButton.jsx'
import ReportButton from '../../components/common/ReportButton.jsx'

const CONDITION_LABELS = {
  NEW: 'Neuf',
  VERY_GOOD: 'Très bon état',
  GOOD: 'Bon état',
  ACCEPTABLE: 'État acceptable',
  TO_REPAIR: 'À réparer',
}

const CATEGORY_LABELS = {
  CALCULATOR: 'Calculatrice',
  BOOK: 'Livre',
  ELECTRONICS: 'Électronique',
  TP_KIT: 'Kit de TP',
  STATIONERY: 'Fournitures',
  COMPUTER_ACCESSORY: 'Accessoire informatique',
  OTHER: 'Autre',
}

const TX_LABELS = {
  SALE: 'Vente',
  RENT: 'Location',
  DONATION: 'Don',
}

export default function MaterialDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [material, setMaterial] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeImage, setActiveImage] = useState(0)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getMaterial(id)
      .then((r) => setMaterial(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const reload = () => {
    getMaterial(id)
      .then((r) => setMaterial(r.data))
      .catch((e) => setError(e.message))
  }

  const onDelete = async () => {
    if (!confirm('Supprimer cette annonce ?')) return
    setUpdating(true)
    try {
      await deleteMaterial(id)
      navigate('/materials')
    } catch (e) {
      setError(e.message)
      setUpdating(false)
    }
  }

  const onMarkStatus = async (status, label) => {
    if (!confirm(`Marquer cette annonce comme « ${label} » ?`)) return
    setUpdating(true)
    try {
      await updateMaterial(id, { status })
      reload()
    } catch (e) {
      setError(e.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-24"><Spinner size={32} /></div>
  }
  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="card p-6 text-red-600">{error}</div>
      </div>
    )
  }
  if (!material) return null

  const isOwner = profile?.id === material.seller_id
  const waLink = buildWhatsAppLink(material.seller_phone, material.title)
  const canContact = material.status === 'PUBLISHED' && !isOwner
  const images = material.images || []
  const isPublished = material.status === 'PUBLISHED'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/materials" className="text-sm text-brand-600 hover:underline mb-4 inline-flex items-center gap-1">
        <ArrowLeft size={14} /> Retour au matériel
      </Link>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Galerie */}
        {/* Galerie */}
        <div>
          <div className="card aspect-square bg-slate-50 flex items-center justify-center overflow-hidden mb-2">
            {images[activeImage]?.image_url ? (
              <img
                src={images[activeImage].image_url}
                alt={material.title}
                className="max-w-full max-h-full object-contain"
                decoding="async"
              />
            ) : (
              <Package size={48} className="text-slate-300" />
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 bg-slate-50 flex items-center justify-center ${idx === activeImage ? 'border-brand-600' : 'border-transparent'
                    }`}
                  aria-label={`Voir la photo ${idx + 1}`}
                >
                  <img
                    src={img.image_url}
                    alt={`Vue ${idx + 1}`}
                    className="max-w-full max-h-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Infos */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">{material.title}</h1>
            <div className="flex items-center gap-2 shrink-0">
              <FavoriteButton targetType="MATERIAL" targetId={material.id} />
              <Badge status={material.status} />
            </div>
          </div>

          <p className="text-2xl font-bold text-brand-600 mb-1">
            {formatPrice(material.price, material.transaction_type)}
          </p>
          <p className="text-xs text-slate-500 mb-4">
            {TX_LABELS[material.transaction_type] || material.transaction_type}
          </p>

          {material.description && (
            <p className="text-slate-600 mb-6 whitespace-pre-line">{material.description}</p>
          )}

          <dl className="text-sm space-y-2 mb-6">
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <dt className="text-slate-500">Catégorie</dt>
              <dd>{CATEGORY_LABELS[material.category] || material.category}</dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <dt className="text-slate-500">État</dt>
              <dd>{CONDITION_LABELS[material.condition] || material.condition}</dd>
            </div>
            {material.rental_period && (
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <dt className="text-slate-500">Période de location</dt>
                <dd>{material.rental_period}</dd>
              </div>
            )}
            {material.institution_name && (
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <dt className="text-slate-500">Établissement</dt>
                <dd>{material.institution_name}</dd>
              </div>
            )}
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <dt className="text-slate-500">Vendeur</dt>
              <dd>{material.seller_name || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Publié le</dt>
              <dd>{formatDate(material.created_at)}</dd>
            </div>
          </dl>

          {/* Actions visiteurs */}
          {canContact && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full"
            >
              <MessageCircle size={18} /> Contacter via WhatsApp
            </a>
          )}

          {/* Actions propriétaire */}
          {isOwner && (
            <div className="mt-4 space-y-2">
              {isPublished && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onMarkStatus('SOLD', 'vendu')}
                    disabled={updating}
                    className="btn-secondary text-sm"
                  >
                    Marquer comme vendu
                  </button>
                  <button
                    onClick={() => onMarkStatus('RENTED', 'loué')}
                    disabled={updating}
                    className="btn-secondary text-sm"
                  >
                    Marquer comme loué
                  </button>
                  <button
                    onClick={() => onMarkStatus('CLOSED', 'clôturée')}
                    disabled={updating}
                    className="btn-secondary text-sm"
                  >
                    Clôturer l'annonce
                  </button>
                </div>
              )}

              <button
                onClick={onDelete}
                disabled={updating}
                className="btn-danger text-sm"
              >
                <Trash2 size={14} /> Supprimer l'annonce
              </button>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100">
            <ReportButton targetType="MATERIAL" targetId={material.id} />
          </div>
        </div>
      </div>
    </div>
  )
}