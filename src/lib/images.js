const MAX_BYTES = 10 * 1024 * 1024
const MAX_DIMENSION = 1280
const JPEG_QUALITY = 0.82

async function compress(file) {
  if (!file) throw new Error('Please choose an image first.')
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPG, PNG or WebP).')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('That image is larger than 10 MB. Please choose a smaller file.')
  }

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('We could not read that image. Please try a JPG or PNG file.')
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
  if (!blob) throw new Error('We could not process that image. Please try another one.')

  return { blob, dataUrl: canvas.toDataURL('image/jpeg', JPEG_QUALITY) }
}

export async function prepareImage(file) {
  return compress(file)
}
