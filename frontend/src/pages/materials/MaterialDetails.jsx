import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getMaterial } from '../../services/materials.js'
import { formatDate, formatPrice } from '../../utils/formatters.js'
import { buildWhatsAppLink } from '../../utils/whatsapp.js'
import Spinner from '../../components/ui/Spinner.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { MessageCircle } from 'lucide-react'

export default function MaterialDetails() {
  const { id } = useParams()
  const [material, setMaterial] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getMaterial(id)
      .then((r) => setMaterial(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center py-24"><Spinner size={32} /></div>
  if (error) return <div className="max-w-3xl mx-auto px-4 py-12 text-red-600">{error}</div>
  if (!material) return null

  const waLink = buildWhatsAppLink(material.seller_phone, material.title)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/materials" className="text-sm text-brand-600 hover:underline mb-4 inline-block">
        ← Retour au matériel
      </Link>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card aspect-square bg-slate-100 flex items-center justify-center">
          {material.images?.[0]?.image_url ? (
            <img src={material.images[0].image_url} alt={material.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-slate-400">Pas d'image</span>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-2xl font-bold text-slate-900">{material.title}</h1>
            <Badge status={material.status} />
          </div>
          <p className="text-2xl font-bold text-brand-600 mb-4">
            {formatPrice(material.price, material.transaction_type)}
          </p>
          {material.description && <p className="text-slate-600 mb-4">{material.description}</p>}

          <dl className="text-sm space-y-1 mb-6">
            <div className="flex justify-between"><dt className="text-slate-500">Catégorie</dt><dd>{material.category}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">État</dt><dd>{material.condition}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Type</dt><dd>{material.transaction_type}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Publié le</dt><dd>{formatDate(material.created_at)}</dd></div>
          </dl>

          <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
            <MessageCircle size={18} /> Contacter via WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}