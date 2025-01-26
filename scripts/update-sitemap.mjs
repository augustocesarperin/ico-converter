import fs from 'node:fs'
import path from 'node:path'

const sitemapPath = path.resolve('public', 'sitemap.xml')
const iso = new Date().toISOString().slice(0, 10)

let xml = fs.readFileSync(sitemapPath, 'utf8')
xml = xml.replace(/<lastmod>.*?<\/lastmod>/g, `<lastmod>${iso}</lastmod>`) // update all lastmod
fs.writeFileSync(sitemapPath, xml, 'utf8')
console.log(`[sitemap] lastmod updated to ${iso}`)












