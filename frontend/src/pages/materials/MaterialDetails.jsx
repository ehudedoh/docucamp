import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Package } from 'lucide-react'
import { getMaterial, deleteMaterial } from '../../services/materials.js'
import { formatDate, formatPrice } from '../../utils/formatters.js'
import { buildWhatsAppLink } from '../../utils/whatsapp.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import Badge from '../../components/ui/Badge.jsx'

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

export default function MaterialDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [material, setMaterial] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    setLoading(true)
    getMaterial(id)
      .then((r) => setMaterial(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const onDelete = async () => {
    if (!confirm('Supprimer cette annonce ?')) return
    try {
      await deleteMaterial(id)
      navigate('/materials')
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner size={32} /></div>
  if (error) return <div className="max-w-3xl mx-auto px-4 py-12 text-red-600">{error}</div>
  if (!material) return null

  const isOwner = profile?.id === material.seller_id
  const waLink = buildWhatsAppLink(material.seller_phone, material.title)
  const canContact = material.status === 'PUBLISHED' && !isOwner
  const images = material.images || []

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/materials" className="text-sm text-brand-600 hover:underline mb-4 inline-flex items-center gap-1">
        <ArrowLeft size={14} /> Retour au matériel
      </Link>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Galerie */}
        <div>
          <div className="card aspect-square bg-slate-100 flex items-center justify-center overflow-hidden mb-2">
            {images[activeImage]?.image_url ? (
              <img
                src={images[activeImage].image_url}
                alt={material.title}
                className="w-full h-full object-cover"
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
                  onClick={() => setActiveImage(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 ${
                    idx === activeImage ? 'border-brand-600' : 'border-transparent'
                  }`}
                >
                  <img src={img.image_url} alt={`Vue ${idx + 1}`}
                    className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Infos */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">{material.title}</h1>
            <Badge status={material.status} />
          </div>

          <p className="text-2xl font-bold text-brand-600 mb-4">
            {formatPrice(material.price, material.transaction_type)}
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
                <dt className="text-slate-500">Période</dt>
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

          {canContact && (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="btn-primary w-full">
              <MessageCircle size={18} /> Contacter via WhatsApp
            </a>
          )}

          {isOwner && (
            <div className="mt-4 flex gap-2">
              <button onClick={onDelete} className="btn-danger text-sm">
                Supprimer l'annonce
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}