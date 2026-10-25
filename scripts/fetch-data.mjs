import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const BASE = 'https://valheimcheats.com'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RAW = path.join(ROOT, 'data/raw')
const CHUNKS = path.join(RAW, 'chunks')
const KB = 1024

const ROLES = [
  {
    role: 'recipe',
    output: 'recipes.json',
    prefix: 'recipe-',
    test: (text) => text.includes('JSON.parse') && Buffer.byteLength(text) > 100 * KB,
  },
  {
    role: 'building-piece',
    output: 'building.json',
    prefix: 'building-piece-',
    test: (text) => text.includes('JSON.parse') && Buffer.byteLength(text) > 100 * KB,
  },
  {
    role: 'items',
    output: 'items.json',
    prefix: 'item-',
    test: (text) =>
      text.includes('JSON.parse') &&
      text.includes('"has_image":') &&
      text.includes('"slug":') &&
      Buffer.byteLength(text) > 100 * KB,
  },
  {
    role: 'food',
    output: 'food.json',
    prefix: 'food-',
    test: (text) => text.includes('JSON.parse') && Buffer.byteLength(text) > 20 * KB,
  },
  {
    role: 'item-images',
    output: 'item-images.json',
    prefix: 'item-images-',
    test: (text) => text.includes('JSON.parse'),
  },
  {
    role: 'building-images',
    output: 'building-images.json',
    prefix: 'building-piece-images-',
    test: (text) => text.startsWith('const e=['),
  },
]

const EXPECTED = {
  'recipes.json': 479,
  'building.json': 497,
  'items.json': 1597,
  'food.json': 119,
  'traders.json': 69,
}

async function getText(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status} ${response.statusText}`)
  }
  return response.text()
}

async function main() {
  const page = await getText(`${BASE}/recipe/maceiron`)
  const mainAsset = page.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/)?.[0]
  if (!mainAsset) throw new Error('Could not find the main index bundle in the recipe page')

  const bundle = await getText(BASE + mainAsset)
  const assets = new Set()
  for (const match of bundle.matchAll(/import\("\.\/([A-Za-z0-9_.-]+\.js)"\)/g)) {
    assets.add(match[1])
  }
  for (const match of bundle.matchAll(/assets\/([A-Za-z0-9_.-]+\.js)/g)) {
    assets.add(match[1])
  }

  const texts = new Map()
  async function loadAsset(name) {
    if (!texts.has(name)) {
      texts.set(name, await getText(`${BASE}/assets/${name}`))
    }
    return texts.get(name)
  }

  fs.mkdirSync(CHUNKS, { recursive: true })
  const chosen = []

  for (const spec of ROLES) {
    const matches = []
    for (const name of assets) {
      if (!name.startsWith(spec.prefix)) continue
      const text = await loadAsset(name)
      if (spec.test(text)) matches.push({ name, text })
    }

    if (matches.length !== 1) {
      const candidates = matches.map((match) => match.name).join(', ') || 'none'
      throw new Error(
        `Could not resolve a unique ${spec.role} chunk (${candidates}); expected exactly one match for prefix ${spec.prefix}`,
      )
    }

    const [match] = matches
    const chunkPath = path.join(CHUNKS, `${spec.role}.mjs`)
    fs.writeFileSync(chunkPath, match.text)

    const chunkUrl = pathToFileURL(chunkPath).href + '?v=' + Date.now()
    const module = await import(chunkUrl)
    const exported = 'default' in module ? [module.default] : Object.values(module)
    if (exported.length !== 1) {
      throw new Error(
        `Chunk ${match.name} must expose one value (found ${exported.length} exports)`,
      )
    }

    fs.writeFileSync(
      path.join(RAW, spec.output),
      JSON.stringify(exported[0], null, 2) + '\n',
    )
    chosen.push({ ...spec, name: match.name })
  }

  execFileSync(process.execPath, ['scripts/parse-traders.mjs'], {
    cwd: ROOT,
    stdio: 'inherit',
  })

  console.log('\nSelected chunks:')
  for (const entry of chosen) {
    console.log(`  ${entry.role.padEnd(15)} ${entry.name} -> data/raw/${entry.output}`)
  }

  const counts = {}
  for (const file of Object.keys(EXPECTED)) {
    const data = JSON.parse(fs.readFileSync(path.join(RAW, file), 'utf8'))
    if (!Array.isArray(data)) throw new Error(`${file} is not a JSON array`)
    counts[file] = data.length
  }

  console.log('\nCounts:')
  for (const [file, expected] of Object.entries(EXPECTED)) {
    const actual = counts[file]
    const status = actual === expected ? 'ok' : `FAIL (expected ${expected})`
    console.log(`  ${file.padEnd(15)} ${String(actual).padStart(5)}  ${status}`)
  }

  const mismatches = Object.entries(EXPECTED).filter(
    ([file, expected]) => counts[file] !== expected,
  )
  if (mismatches.length > 0) {
    const detail = mismatches
      .map(([file, expected]) => `${file}: expected ${expected}, got ${counts[file]}`)
      .join('; ')
    throw new Error(`Count mismatch: ${detail}`)
  }
}

try {
  await main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
