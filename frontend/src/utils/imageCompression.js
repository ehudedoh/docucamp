/**
 * Compresse une image côté client avant upload.
 * Retourne un Blob (JPEG) sous la taille cible.
 */
export async function compressImage(file, maxSizeMB = 2, maxWidth = 1600) {
  if (!file.type.startsWith('image/')) return file

  const bitmap = await createImageBitmap(file)

  let { width, height } = bitmap
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width)
    width = maxWidth
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, width, height)

  let quality = 0.85
  let blob = await canvasToBlob(canvas, 'image/jpeg', quality)

  // Réduire la qualité tant qu'on dépasse la taille cible
  while (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.4) {
    quality -= 0.1
    blob = await canvasToBlob(canvas, 'image/jpeg', quality)
  }

  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}