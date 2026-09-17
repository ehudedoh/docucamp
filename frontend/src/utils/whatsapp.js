export function whatsappUrl(phone, message = '') { return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`; }
