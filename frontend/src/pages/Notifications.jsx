import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { listNotifications, markAllRead } from '../services/notifications.js'
import Spinner from '../components/ui/Spinner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { formatDate } from '../utils/formatters.js'

export default function Notifications() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    listNotifications()
      .then((r) => setItems(r.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const onMarkAll = async () => {
    await markAllRead()
    load()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        {items.some((n) => !n.read) && (
          <button onClick={onMarkAll} className="text-sm text-brand-600 hover:underline">
            Tout marquer lu
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="Aucune notification" />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id} className={`card p-4 ${n.read ? '' : 'border-brand-200 bg-brand-50/30'}`}>
              <Link to={n.link || '#'} className="block">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-medium text-slate-900">{n.title}</span>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{formatDate(n.created_at)}</span>
                </div>
                {n.message && <p className="text-sm text-slate-600">{n.message}</p>}
                {n.reason && <p className="text-sm text-red-600 mt-1">Motif : {n.reason}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}