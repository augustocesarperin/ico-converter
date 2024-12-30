import { describe, it, expect } from 'vitest'
import { trackEvent } from '../analytics'

describe('analytics trackEvent (no providers)', () => {
  it('does not throw when no analytics providers are present', () => {
    // Simulate clean window
    const w = window as unknown as Record<string, unknown>
    delete w['plausible']
    delete w['zaraz']
    delete w['gtag']
    expect(() => trackEvent('start_conversion', { filename: 'foo.png' })).not.toThrow()
    expect(() => trackEvent('finish_conversion', { resolutions: 6 })).not.toThrow()
  })
})


