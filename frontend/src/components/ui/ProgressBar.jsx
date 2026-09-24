/**
 * Barre de progression accessible.
 * - `value` (0-100) → barre déterminée
 * - `value` null/undefined → barre indéterminée (animation)
 */
export default function ProgressBar({ value, label, className = '' }) {
  const determinate = typeof value === 'number' && !Number.isNaN(value)
  const pct = determinate ? Math.max(0, Math.min(100, Math.round(value))) : null

  return (
    <div className={className}>
      {(label || determinate) && (
        <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
          <span>{label}</span>
          {determinate && <span className="font-medium tabular-nums">{pct}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label || 'Progression'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={determinate ? pct : undefined}
        className="h-2 w-full rounded-full bg-slate-200 overflow-hidden"
      >
        {determinate ? (
          <div
            className="h-full rounded-full bg-brand-600 transition-[width] duration-200 ease-out"
            style={{ width: `${pct}%` }}
          />
        ) : (
          <div className="h-full w-1/3 rounded-full bg-brand-600 animate-pulse" />
        )}
      </div>
    </div>
  )
}
