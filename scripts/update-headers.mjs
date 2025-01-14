import fs from 'node:fs'
import path from 'node:path'

try {
  const gaId = process.env.VITE_GA_MEASUREMENT_ID || ''
  if (!gaId) {
    console.log('[headers] GA ID not set; keeping strict CSP (Cloudflare only).')
    process.exit(0)
  }

  const distHeaders = path.resolve(process.cwd(), 'dist', '_headers')
  if (!fs.existsSync(distHeaders)) {
    console.log('[headers] dist/_headers not found; skipping.')
    process.exit(0)
  }

  const raw = fs.readFileSync(distHeaders, 'utf8')
  const lines = raw.split(/\r?\n/)

  const hasGtm = (s) => /www\.googletagmanager\.com/.test(s)
  const hasGa = (s) => /www\.google-analytics\.com/.test(s)

  let changed = false
  const out = lines.map((line) => {
    if (/^\s*Content-Security-Policy:/.test(line)) {
      // Add GA origins to script-src and connect-src when GA is enabled
      let next = line
      // script-src
      next = next.replace(
        /(script-src[^;]*)(;|$)/,
        (m, p1, p2) => {
          let v = p1
          if (!hasGtm(v)) v += ' https://www.googletagmanager.com'
          if (!hasGa(v)) v += ' https://www.google-analytics.com'
          return v + (p2 || '')
        },
      )
      // connect-src
      next = next.replace(
        /(connect-src[^;]*)(;|$)/,
        (m, p1, p2) => {
          let v = p1
          if (!hasGa(v)) v += ' https://www.google-analytics.com'
          return v + (p2 || '')
        },
      )
      if (next !== line) {
        changed = true
        return next
      }
    }
    return line
  })

  if (changed) {
    fs.writeFileSync(distHeaders, out.join('\n'), 'utf8')
    console.log('[headers] Updated CSP for GA (env present).')
  } else {
    console.log('[headers] No CSP changes needed.')
  }
} catch (err) {
  console.error('[headers] Failed to update _headers:', err)
  process.exit(0)
}


