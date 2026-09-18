/**
 * Construit un lien WhatsApp avec message prérempli.
 * Le numéro doit être au format international sans "+" ni espaces (ex: 221770000000).
 */
export function buildWhatsAppLink(phone, materialTitle) {
  const clean = String(phone || '').replace(/[^\d]/g, '')
  const message = `Bonjour, je suis intéressé(e) par votre annonce « ${materialTitle} » sur DocuCamp. Est-elle toujours disponible ?`
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}