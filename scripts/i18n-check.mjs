import fs from 'node:fs'
import path from 'node:path'

const base = path.resolve(process.cwd(), 'public', 'locales')
const langs = ['pt', 'en', 'es']

const load = (lang) => JSON.parse(fs.readFileSync(path.join(base, lang, 'translation.json'), 'utf-8'))

const flatten = (obj, prefix = '') => {
  return Object.entries(obj).reduce((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(acc, flatten(v, key))
    } else {
      acc[key] = true
    }
    return acc
  }, {})
}

const maps = Object.fromEntries(langs.map(l => [l, flatten(load(l))]))
const ref = maps[langs[0]]
let ok = true

for (const l of langs.slice(1)) {
  const missing = Object.keys(ref).filter(k => !maps[l][k])
  const extras = Object.keys(maps[l]).filter(k => !ref[k])
  if (missing.length || extras.length) {
    ok = false
    if (missing.length) console.error(`[i18n] ${l} missing keys:`, missing.slice(0, 20), missing.length > 20 ? `(+${missing.length-20})` : '')
    if (extras.length) console.error(`[i18n] ${l} extra keys:`, extras.slice(0, 20), extras.length > 20 ? `(+${extras.length-20})` : '')
  }
}

process.exit(ok ? 0 : 1)










