export type ImageCompressionOptions = {
  // Longest side in pixels; larger images are scaled down proportionally.
  maxDimension?: number
  quality?: number
}

const compressibleTypes = new Set(['image/png', 'image/jpeg', 'image/webp'])

function encode(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })
}

function renamed(name: string, extension: string) {
  const base = name.replace(/\.[^.]+$/, '') || 'image'
  return `${base}.${extension}`
}

// Shrinks and re-encodes images in the browser so uploads stay small without
// server-side processing. GIFs keep their animation, and anything that would
// not get smaller is uploaded unchanged.
export async function compressImage(
  file: File,
  { maxDimension = 1920, quality = 0.82 }: ImageCompressionOptions = {},
): Promise<File> {
  if (!compressibleTypes.has(file.type) || typeof document === 'undefined') {
    return file
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return file
  }

  const scale = Math.min(
    1,
    maxDimension / Math.max(bitmap.width, bitmap.height),
  )
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    return file
  }
  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  // Safari before 17 cannot encode WebP and silently returns PNG instead;
  // JPEG keeps photos small there, while PNG sources stay lossless.
  let blob = await encode(canvas, 'image/webp', quality)
  let extension = 'webp'
  if (blob?.type !== 'image/webp') {
    if (file.type !== 'image/jpeg')
      return scale < 1 && blob ? asFile(blob, file, 'png') : file
    blob = await encode(canvas, 'image/jpeg', quality)
    extension = 'jpg'
  }
  if (!blob) return file
  if (scale === 1 && blob.size >= file.size) return file
  return asFile(blob, file, extension)
}

function asFile(blob: Blob, source: File, extension: string) {
  return new File([blob], renamed(source.name, extension), {
    type: blob.type,
    lastModified: source.lastModified,
  })
}
