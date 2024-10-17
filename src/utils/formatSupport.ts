const testCanvasSupport = (type: string): boolean => {
  try {
    const c = document.createElement('canvas')
    const data = c.toDataURL(type)
    return data.startsWith(`data:${type}`)
  } catch {
    return false
  }
}

export const detectFormatSupport = async (): Promise<{ webp: boolean; avif: boolean }> => {
  const webp = testCanvasSupport('image/webp')
  const avif = testCanvasSupport('image/avif')
  return { webp, avif }
}

export const buildAcceptString = async (): Promise<string> => {
  const { webp, avif } = await detectFormatSupport()
  const base = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/svg+xml',
    'image/gif',
    'image/apng',
    'image/bmp',
    'image/x-icon',
    'image/vnd.microsoft.icon'
  ]
  if (webp) base.push('image/webp')
  if (avif) base.push('image/avif')
  return base.join(',')
}



