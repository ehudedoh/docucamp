export default function WhatsAppButton({ phone, message = '' }) { return <a href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`}>Contacter sur WhatsApp</a>; }
