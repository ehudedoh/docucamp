/**
 * Compresse une image côté client avant upload.
 * - Ne JAMAIS agrandir (pas d'upscale)
 * - Réduit la qualité jusqu'à atteindre la taille cible
 * - Conserve le ratio
 * - En cas de problème (format non décodable, canvas indisponible…),
 *   renvoie le fichier ORIGINAL : la compression ne doit jamais bloquer l'envoi.
 */
export async function compressImage(file, maxSizeMB = 2, maxWidth = 1600) {
  if (!file?.type?.startsWith('image/')) return file

  // Les GIF animés ne doivent pas passer par canvas (perte d'animation)
  if (file.type === 'image/gif') return file

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  try {
    const { width, height } = bitmap

    // ⚠️ Ne jamais agrandir : on réduit seulement si l'image est plus grande
    const ratio = Math.min(1, maxWidth / width)
    const targetW = Math.round(width * ratio)
    const targetH = Math.round(height * ratio)

    // Si l'image est déjà petite et légère, on ne touche à rien
    const targetBytes = maxSizeMB * 1024 * 1024
    if (file.size <= targetBytes && ratio === 1) return file

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return file

    // Fond blanc pour éviter les artefacts sur JPEG (pas de transparence)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, targetW, targetH)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, targetW, targetH)

    let quality = 0.85
    let blob = await canvasToBlob(canvas, 'image/jpeg', quality)
    if (!blob) return file

    // Réduire la qualité tant qu'on dépasse la taille cible (min 0.5 pour rester lisible)
    while (blob && blob.size > targetBytes && quality > 0.5) {
      quality = Math.round((quality - 0.1) * 100) / 100
      blob = await canvasToBlob(canvas, 'image/jpeg', quality)
    }

    // Si malgré tout le blob est plus gros que l'original, on garde l'original
    if (!blob || blob.size >= file.size) return file

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], newName, { type: 'image/jpeg' })
  } catch {
    return file
  } finally {
    bitmap.close?.()
  }
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}
