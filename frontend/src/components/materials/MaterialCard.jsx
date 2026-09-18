import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import { formatPrice, formatDate } from '../../utils/formatters.js'
import Badge from '../ui/Badge.jsx'

export default function MaterialCard({ material }) {
  const img = material.images?.[0]?.image_url
  return (
    <Link to={`/materials/${material.id}`} className="card hover:shadow-md transition-shadow block">
      <div className="aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
        {img ? (
          <img src={img} alt={material.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <Package size={32} className="text-slate-300" />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-slate-900 line-clamp-2 mb-1">{material.title}</h3>
        <p className="text-lg font-bold text-brand-600 mb-2">
          {formatPrice(material.price, material.transaction_type)}
        </p>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{material.category}</span>
          <span>{formatDate(material.created_at)}</span>
        </div>
        {material.status !== 'PUBLISHED' && (
          <div className="mt-2"><Badge status={material.status} /></div>
        )}
      </div>
    </Link>
  )
}