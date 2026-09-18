import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title = 'Aucun résultat', message, action }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-3">
        <Icon size={24} />
      </div>
      <h3 className="font-medium text-slate-900 mb-1">{title}</h3>
      {message && <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">{message}</p>}
      {action}
    </div>
  )
}