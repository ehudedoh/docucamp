const COLORS = {
  PENDING: 'bg-amber-100 text-amber-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  SOLD: 'bg-slate-200 text-slate-700',
  RENTED: 'bg-blue-100 text-blue-800',
  CLOSED: 'bg-slate-200 text-slate-700',
  OPEN: 'bg-amber-100 text-amber-800',
  IN_REVIEW: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
  default: 'bg-slate-100 text-slate-700'
}

export default function Badge({ status, children, className = '' }) {
  const color = COLORS[status] || COLORS.default
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color} ${className}`}>
      {children || status}
    </span>
  )
}