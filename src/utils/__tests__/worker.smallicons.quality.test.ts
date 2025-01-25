import { describe, it, expect } from 'vitest'
import { generateIcoFromImage } from '@/utils/icoGenerator'

const svgThin = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" rx="72" fill="#0b1222"/><g fill="none" stroke="#20e59f" stroke-width="12"><circle cx="256" cy="256" r="140"/></g></svg>`

const coverageOf = (pngBlob: Blob, size: number) => new Promise<number>(async (resolve) => {
  const url = URL.createObjectURL(pngBlob)
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = size; canvas.height = size
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    const d = ctx.getImageData(0, 0, size, size).data
    let solid = 0
    for (let i=0;i<d.length;i+=4) if (d[i+3] > 190) solid++
    URL.revokeObjectURL(url)
    resolve(solid / (size * size))
  }
  img.src = url
})

describe('Small icons quality', () => {
  it.skip('16/32 coverage should not be too baixo (auto-fallback ajuda)', async () => {
    const OriginalImage = (globalThis as any).Image
    class MockImage {
      onload: (() => void) | null = null
      width = 512
      height = 512
      set src(_v: string) {
        // Simula carregamento assíncrono em jsdom
        setTimeout(() => this.onload && this.onload(), 0)
      }
    }
    ;(globalThis as any).Image = MockImage as any
    const file = new File([new Blob([svgThin], { type: 'image/svg+xml' })], 'thin.svg', { type: 'image/svg+xml' })
    const res = await generateIcoFromImage(file as File, [16,32,48], () => {}, {
      preserveAspectRatio: true,
      backgroundTransparent: true,
      backgroundColor: '#000000',
      crispSmallIcons: true,
    })
    const p16 = res.resolutions.find(r => r.size === 16)!
    const p32 = res.resolutions.find(r => r.size === 32)!
    // Render canvas to blob for coverage
    const b16 = await new Promise<Blob>(r => p16.canvas.toBlob(b => r(b!), 'image/png'))
    const b32 = await new Promise<Blob>(r => p32.canvas.toBlob(b => r(b!), 'image/png'))
    const c16 = await coverageOf(b16, 16)
    const c32 = await coverageOf(b32, 32)
    expect(c16).toBeGreaterThanOrEqual(0.12)
    expect(c32).toBeGreaterThanOrEqual(0.18)
    ;(globalThis as any).Image = OriginalImage
  }, 45000)
})


