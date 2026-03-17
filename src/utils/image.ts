export type CompressOptions = {
  maxEdge?: number
  maxBytes?: number
  quality?: number
  minQuality?: number
}

export async function compressImage(file: File, options: CompressOptions = {}) {
  const { maxEdge = 1280, maxBytes = 250_000, quality = 0.7, minQuality = 0.4 } = options

  const dataUrl = await readAsDataURL(file)
  const img = await loadImage(dataUrl)

  const { width, height } = scaleDimensions(img.width, img.height, maxEdge)
  let currentQuality = quality
  let output = ''

  while (currentQuality >= minQuality) {
    output = drawToDataUrl(img, width, height, currentQuality)
    if (approxBytes(output) <= maxBytes) {
      return output
    }
    currentQuality -= 0.05
  }

  // Last attempt, even if still large
  return output || dataUrl
}

function readAsDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = src
  })
}

function scaleDimensions(width: number, height: number, maxEdge: number) {
  if (width <= maxEdge && height <= maxEdge) {
    return { width, height }
  }
  const ratio = Math.min(maxEdge / width, maxEdge / height)
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) }
}

function drawToDataUrl(img: HTMLImageElement, width: number, height: number, quality: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', quality)
}

function approxBytes(base64: string) {
  // base64 size in bytes ≈ 3/4 * length
  return Math.ceil((base64.length * 3) / 4)
}
