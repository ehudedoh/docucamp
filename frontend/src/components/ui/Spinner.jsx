export default function Spinner({ size = 24 }) {
  return (
    <div
      role="status"
      aria-label="Chargement"
      className="inline-block animate-spin rounded-full border-2 border-slate-300 border-t-brand-600"
      style={{ width: size, height: size }}
    />
  )
}