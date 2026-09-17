export default function Modal({ open, children, onClose }) { if (!open) return null; return <div role="dialog" aria-modal="true">{children}<button onClick={onClose}>Fermer</button></div>; }
