import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { listNotifications, markRead, markAllRead, unreadCount } from '../../services/notifications.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatDate } from '../../utils/formatters.js'

export default function NotificationBell() {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)
  const [items, setItems] = useState([])
  const ref = useRef(null)

  useEffect(() => {
    if (!isAuthenticated) return
    const fetchCount = () => {
      unreadCount().then((r) => setCount(r.data.count)).catch(() => {})
    }
    fetchCount()
    const id = setInterval(fetchCount, 60_000)
    return () => clearInterval(id)
  }, [isAuthenticated])

  useEffect(() => {
    if (!open) return
    listNotifications().then((r) => setItems(r.data || [])).catch(() => {})
  }, [open])

  // Fermeture au clic extérieur
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  if (!isAuthenticated) return null

  const handleOpen = () => setOpen(!open)

  const handleMarkOne = async (id) => {
    await markRead(id)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setCount((c) => Math.max(0, c - 1))
  }

  const handleMarkAll = async () => {
    await markAllRead()
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    setCount(0)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
            <span className="font-medium text-slate-900 text-sm">Notifications</span>
            {items.some((n) => !n.read) && (
              <button onClick={handleMarkAll} className="text-xs text-brand-600 hover:underline">
                Tout marquer lu
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500 text-center">Aucune notification.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {items.map((n) => (
                <li key={n.id} className={n.read ? '' : 'bg-brand-50/40'}>
                  <Link
                    to={n.link || '#'}
                    onClick={() => { handleMarkOne(n.id); setOpen(false) }}
                    className="block px-4 py-3 hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-sm text-slate-900">{n.title}</span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatDate(n.created_at)}</span>
                    </div>
                    {n.message && <p className="text-xs text-slate-600 mt-1">{n.message}</p>}
                    {n.reason && (
                      <p className="text-xs text-red-600 mt-1">Motif : {n.reason}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}