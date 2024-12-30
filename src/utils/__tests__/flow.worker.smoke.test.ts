import { describe, it, expect } from 'vitest'
import { processWithWorker } from '@/utils/icoWorkerClient'

// In jsdom, Worker is not available by default. Provide a stub fallback.
if (typeof (globalThis as any).Worker === 'undefined') {
  ;(globalThis as any).Worker = class {
    constructor() { throw new Error('Worker not available in test env') }
  } as unknown as typeof Worker
}

const makeSvg = (thin: boolean) => new Blob([
  thin
    ? `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" rx="72" fill="#0b1222"/><g fill="none" stroke="#20e59f" stroke-width="12"><circle cx="256" cy="256" r="140"/></g></svg>`
    : `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" rx="72" fill="#0b1222"/><circle cx="256" cy="256" r="156" fill="#1be58f"/></svg>`
], { type: 'image/svg+xml' })

describe('User flow smoke: upload → worker → ico', () => {
  it('generates ico and pngs for a thin logo', async () => {
    // Skip when Worker is not available (jsdom)
    if (typeof (globalThis as any).Worker === 'undefined' ||
        (globalThis as any).Worker.toString().includes('not available')) {
      return
    }
    const file = new File([makeSvg(true)], 'thin.svg', { type: 'image/svg+xml' })
    const { icoBlob, pngs } = await processWithWorker({
      file,
      sizes: [16, 32, 48, 64, 128, 256],
      options: {
        preserveAspectRatio: true,
        backgroundTransparent: true,
        backgroundColor: '#000000',
        crispSmallIcons: true,
        smallIconMode: false,
        smallIconStrength16: 1.0,
        outline16px: false,
        autoProfile: true,
      },
    })
    expect(icoBlob.size).toBeGreaterThan(0)
    expect(pngs.length).toBeGreaterThan(0)
  })
})


