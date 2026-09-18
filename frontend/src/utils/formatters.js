export function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  } catch { return '' }
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 o'
  const units = ['o', 'Ko', 'Mo', 'Go']
  let i = 0, n = bytes
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}

export function formatPrice(price, transactionType) {
  if (transactionType === 'DONATION') return 'Don'
  if (price == null) return '—'
  return `${Number(price).toLocaleString('fr-FR')} FCFA`
}