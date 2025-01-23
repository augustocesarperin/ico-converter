import fs from 'node:fs'
import path from 'node:path'

try {
	const gaId = process.env.VITE_GA_MEASUREMENT_ID || ''
	const adsProvider = process.env.VITE_ADS_PROVIDER || ''

	const distHeaders = path.resolve(process.cwd(), 'dist', '_headers')
	if (!fs.existsSync(distHeaders)) {
		console.log('[headers] dist/_headers not found; skipping.')
		process.exit(0)
	}

	const raw = fs.readFileSync(distHeaders, 'utf8')
	const lines = raw.split(/\r?\n/)

	const has = (s, host) => new RegExp(host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(s)

	let changed = false
	const out = lines.map((line) => {
		if (/^\s*Content-Security-Policy:/.test(line)) {
			let next = line

			// GA enablement
			if (gaId) {
				next = next.replace(
					/(script-src[^;]*)(;|$)/,
					(m, p1, p2) => {
						let v = p1
						if (!has(v, 'www.googletagmanager.com')) v += ' https://www.googletagmanager.com'
						if (!has(v, 'www.google-analytics.com')) v += ' https://www.google-analytics.com'
						return v + (p2 || '')
					},
				)
				next = next.replace(
					/(connect-src[^;]*)(;|$)/,
					(m, p1, p2) => {
						let v = p1
						if (!has(v, 'www.google-analytics.com')) v += ' https://www.google-analytics.com'
						return v + (p2 || '')
					},
				)
			}

			// AdSense enablement
			if (adsProvider === 'adsense') {
				next = next.replace(
					/(script-src[^;]*)(;|$)/,
					(m, p1, p2) => {
						let v = p1
						if (!has(v, 'pagead2.googlesyndication.com')) v += ' https://pagead2.googlesyndication.com'
						return v + (p2 || '')
					},
				)
				next = next.replace(
					/(frame-src[^;]*)(;|$)/,
					(m, p1, p2) => {
						let v = p1
						if (!has(v, 'googleads.g.doubleclick.net')) v += ' https://googleads.g.doubleclick.net'
						if (!has(v, 'tpc.googlesyndication.com')) v += ' https://tpc.googlesyndication.com'
						if (!has(v, 'pagead2.googlesyndication.com')) v += ' https://pagead2.googlesyndication.com'
						return v + (p2 || '')
					},
				)
				next = next.replace(
					/(img-src[^;]*)(;|$)/,
					(m, p1, p2) => {
						let v = p1
						if (!has(v, 'googleads.g.doubleclick.net')) v += ' https://googleads.g.doubleclick.net'
						if (!has(v, 'tpc.googlesyndication.com')) v += ' https://tpc.googlesyndication.com'
						if (!has(v, 'pagead2.googlesyndication.com')) v += ' https://pagead2.googlesyndication.com'
						return v + (p2 || '')
					},
				)
			}

			if (next !== line) {
				changed = true
				return next
			}
		}
		return line
	})

	if (changed) {
		fs.writeFileSync(distHeaders, out.join('\n'), 'utf8')
		console.log('[headers] Updated CSP for GA/Ads provider.')
	} else {
		console.log('[headers] No CSP changes needed.')
	}
} catch (err) {
	console.error('[headers] Failed to update _headers:', err)
	process.exit(0)
}






