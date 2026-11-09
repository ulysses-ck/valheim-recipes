import fs from 'node:fs'
import path from 'node:path'

const BASE =
  'https://valheim-modding.github.io/Jotunn/data/localization/translations'
const root = path.resolve(import.meta.dirname, '..')
const rawDir = path.join(root, 'data', 'raw')
const output = path.join(rawDir, 'localization.json')

const LANGUAGES = { en: 'English.html', es: 'Spanish.html' }

function decode(value) {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .trim()
}

const RELEVANT = /^(item_|piece_|ship_)/

function parse(html) {
  const entries = {}
  const rowPattern =
    /<tr>\s*<td>\s*\$([^<]+?)\s*<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/gi
  for (const match of html.matchAll(rowPattern)) {
    const key = match[1].trim()
    if (!RELEVANT.test(key)) continue
    entries[key] = decode(match[2])
  }
  return entries
}

async function getText(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status}`)
  }
  return response.text()
}

const localization = {}
for (const [language, file] of Object.entries(LANGUAGES)) {
  const html = await getText(`${BASE}/${file}`)
  localization[language] = parse(html)
  console.log(`${language}: ${Object.keys(localization[language]).length} keys`)
}

fs.mkdirSync(rawDir, { recursive: true })
fs.writeFileSync(output, `${JSON.stringify(localization, null, 2)}\n`)
console.log(`wrote ${output}`)
