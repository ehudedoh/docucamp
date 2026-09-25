/**
 * Logo DocuCamp. L'image vient de public/icons/logo.png, générée depuis
 * branding/logo.svg (voir branding/README.md pour le remplacer).
 */
export default function Logo({ size = 32, withText = true, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold text-slate-900 ${className}`}>
      <img
        src="/icons/logo.png"
        alt={withText ? '' : 'DocuCamp'}
        width={size}
        height={size}
        className="rounded-lg shrink-0"
        style={{ width: size, height: size }}
        decoding="async"
      />
      {withText && <span>DocuCamp</span>}
    </span>
  )
}
