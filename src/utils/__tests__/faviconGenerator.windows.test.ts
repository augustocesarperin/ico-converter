import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import JSZip from 'jszip'
import { generateFaviconPackage } from '@/utils/faviconGenerator'

// Minimal canvas stub for jsdom
type CanvasStub = {
  width: number
  height: number
  getContext: (type: string) => any
  toBlob?: (cb: (b: Blob) => void, mimeType?: string) => void
}

const makeCanvas = (w: number, h: number): CanvasStub => ({
  width: w,
  height: h,
  getContext: () => ({ drawImage: () => {/* noop */}, clearRect: () => {}, imageSmoothingEnabled: true }),
  toBlob: (cb: (b: Blob) => void, mime?: string) => cb(new Blob([`blob-${w}x${h}-${mime ?? 'image/png'}`], { type: mime ?? 'image/png' })),
})

const makeResolutions = () => ([
  { size: 44, canvas: makeCanvas(44, 44) as unknown as HTMLCanvasElement },
  { size: 64, canvas: makeCanvas(64, 64) as unknown as HTMLCanvasElement },
  { size: 150, canvas: makeCanvas(150, 150) as unknown as HTMLCanvasElement },
  { size: 256, canvas: makeCanvas(256, 256) as unknown as HTMLCanvasElement },
])

describe('Windows assets package', () => {
  const originalCreate = document.createElement
  beforeAll(() => {
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      if (tag === 'canvas') return makeCanvas(256, 256) as unknown as HTMLElement
      return originalCreate.call(document, tag)
    }) as unknown as typeof document.createElement)
  })
  afterAll(() => {
    ;(document.createElement as any).mockRestore?.()
  })

  const baseFile = new File([new Uint8Array([1])], 'dummy.png', { type: 'image/png' })
  const icoBlob = new Blob([new Uint8Array([0])], { type: 'image/x-icon' })

  const collectZipEntries = async (blob: Blob) => {
    const zip = await JSZip.loadAsync(blob)
    return Object.keys(zip.files).sort()
  }

  it('profile: minimal → expected count and folders', async () => {
    const res = await generateFaviconPackage(
      baseFile,
      icoBlob,
      makeResolutions(),
      {
        filename: 'favicon',
        selectedSizes: [16, 32, 48, 64, 128, 256],
        generateFaviconPackage: false,
        includePNG: false,
        includeWebP: false,
        quality: 0.95,
        preserveAspectRatio: true,
        backgroundTransparent: true,
        backgroundColor: '#000000',
        windowsAssets: true,
        windowsProfile: 'minimal',
        windowsOrganizeZip: true,
      } as any,
    )
    expect(res.windowsZipBlob).toBeInstanceOf(Blob)
    const entries = await collectZipEntries(res.windowsZipBlob!)
    // Our generator includes extras (targetsize-256 + Square256x256_unplated), count observed: 24
    expect(entries.length).toBe(24)
    expect(entries.some((n) => n.startsWith('Assets/Taskbar/'))).toBe(true)
    expect(entries.some((n) => n.startsWith('Assets/Tiles/'))).toBe(true)
  })

  it('profile: recommended → includes StoreLogo scales', async () => {
    const res = await generateFaviconPackage(
      baseFile,
      icoBlob,
      makeResolutions(),
      {
        filename: 'favicon',
        selectedSizes: [16, 32, 48, 64, 128, 256],
        generateFaviconPackage: false,
        includePNG: false,
        includeWebP: false,
        quality: 0.95,
        preserveAspectRatio: true,
        backgroundTransparent: true,
        backgroundColor: '#000000',
        windowsAssets: true,
        windowsProfile: 'recommended',
        windowsOrganizeZip: true,
      } as any,
    )
    const entries = await collectZipEntries(res.windowsZipBlob!)
    // Count observed: 30 (minimal set + StoreLogo scales)
    expect(entries.length).toBe(30)
    expect(entries.filter((n) => n.startsWith('Assets/StoreLogo/')).length).toBeGreaterThanOrEqual(5)
  })

  it('profile: complete + canonical → full set and canonical names', async () => {
    const res = await generateFaviconPackage(
      baseFile,
      icoBlob,
      makeResolutions(),
      {
        filename: 'favicon',
        selectedSizes: [16, 32, 48, 64, 128, 256],
        generateFaviconPackage: false,
        includePNG: false,
        includeWebP: false,
        quality: 0.95,
        preserveAspectRatio: true,
        backgroundTransparent: true,
        backgroundColor: '#000000',
        windowsAssets: true,
        windowsProfile: 'complete',
        windowsOrganizeZip: true,
        windowsCanonicalNames: true,
      } as any,
    )
    const entries = await collectZipEntries(res.windowsZipBlob!)
    // Count observed: 45 (complete set + canonical names)
    expect(entries.length).toBe(45)
    // Canonical names present at Assets/
    expect(entries).toContain('Assets/Square44x44Logo.png')
    expect(entries).toContain('Assets/Square150x150Logo.png')
    expect(entries).toContain('Assets/Wide310x150Logo.png')
    expect(entries).toContain('Assets/Square310x310Logo.png')
    expect(entries).toContain('Assets/StoreLogo.png')
  })
})


