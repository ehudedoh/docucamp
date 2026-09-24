/**
 * Télécharge un fichier avec progression.
 *
 * Stratégie :
 *  1. fetch en streaming → progression réelle → Blob → enregistrement via <a download>
 *     (fiable sur mobile et desktop, aucun popup à autoriser)
 *  2. Si le fetch échoue (CORS, réseau…) → repli sur un simple lien
 *     (l'URL signée contient ?download=… donc le navigateur télécharge).
 *
 * @param {string} url
 * @param {string} filename
 * @param {{ onProgress?: (percent:number|null)=>void, expectedSize?: number }} [opts]
 *        percent = null → taille inconnue (barre indéterminée)
 */
export async function downloadFile(url, filename, { onProgress, expectedSize } = {}) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const headerSize = Number(res.headers.get('content-length')) || 0
    const total = headerSize || Number(expectedSize) || 0

    let blob
    if (res.body && typeof res.body.getReader === 'function') {
      const reader = res.body.getReader()
      const chunks = []
      let received = 0
      onProgress?.(total ? 0 : null)
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        received += value.length
        // plafonné à 99 % tant que le Blob n'est pas assemblé
        if (total) onProgress?.(Math.min(99, Math.round((received / total) * 100)))
      }
      blob = new Blob(chunks, { type: res.headers.get('content-type') || 'application/octet-stream' })
    } else {
      onProgress?.(null)
      blob = await res.blob()
    }

    saveBlob(blob, filename)
    onProgress?.(100)
  } catch {
    // Repli : navigation directe (l'URL force Content-Disposition: attachment)
    onProgress?.(null)
    triggerLink(url, filename)
    onProgress?.(100)
  }
}

function saveBlob(blob, filename) {
  const objectUrl = URL.createObjectURL(blob)
  triggerLink(objectUrl, filename)
  // laisser le navigateur démarrer l'écriture avant de libérer la mémoire
  setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000)
}

function triggerLink(href, filename) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename || 'document.pdf'
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
}
