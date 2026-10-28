import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rawDir = path.join(root, 'data', 'raw')
const outPath = path.join(rawDir, 'detail-settings.json')
const BASE = 'https://valheimcheats.com/data/detail-settings/item'

const readJson = (name) =>
  JSON.parse(fs.readFileSync(path.join(rawDir, name), 'utf8'))

const ARMOR_KEYS = [
  'm_armor',
  'm_armorPerLevel',
  'm_movementModifier',
  'm_weight',
  'm_maxDurability',
  'm_durabilityPerLevel',
  'm_blockPower',
  'm_timedBlockBonus',
  'm_maxQuality',
]

const EQUIPMENT_KEYS = [
  'm_blockPower',
  'm_timedBlockBonus',
  'm_attackForce',
  'm_backstabBonus',
  'm_weight',
  'm_maxDurability',
  'm_durabilityPerLevel',
  'm_toolTier',
  'm_skillType',
  'm_maxQuality',
]

function categories(item) {
  const category = Array.isArray(item.category)
    ? item.category
    : [item.category]
  const subcategory = Array.isArray(item.subcategory)
    ? item.subcategory
    : [item.subcategory]
  return { category, subcategory }
}

async function fetchJson(url, attempt = 0) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'valheim-recipes/1.0 (fan project data snapshot)',
    },
  })
  if (!response.ok) {
    if (response.status === 404) return null
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
      return fetchJson(url, attempt + 1)
    }
    throw new Error(`${response.status} ${response.statusText} for ${url}`)
  }
  return response.json()
}

function pick(data, keys) {
  const result = {}
  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'number' && Number.isFinite(value)) result[key] = value
  }
  return result
}

async function main() {
  const items = readJson('items.json')
  const targets = []
  for (const item of items) {
    const { category, subcategory } = categories(item)
    const isArmor = category.includes('Armor')
    const isEquipment =
      category.includes('Equipment') ||
      subcategory.includes('Weapon') ||
      subcategory.includes('Tool')
    const isMead = category.includes('Mead') && !/^MeadBase/i.test(item.id)
    if (!isArmor && !isEquipment && !isMead) continue
    targets.push({
      id: item.id,
      slug: item.slug,
      kind: isArmor ? 'armor' : isEquipment ? 'equipment' : 'mead',
    })
  }

  const settings = {}
  const missing = []
  let done = 0
  for (const target of targets) {
    const payload = await fetchJson(`${BASE}/${target.slug}.json`)
    done += 1
    if (!payload) {
      missing.push(target)
      continue
    }
    const data = payload.settings?.find(
      (section) => section.title === 'Item settings',
    )?.data
    if (!data) {
      missing.push(target)
      continue
    }
    if (target.kind === 'mead') continue
    const picked = pick(
      data,
      target.kind === 'armor' ? ARMOR_KEYS : EQUIPMENT_KEYS,
    )
    if (Object.keys(picked).length > 0) settings[target.id] = picked
    if (done % 50 === 0) process.stderr.write(`${done}/${targets.length}\n`)
  }

  fs.writeFileSync(outPath, `${JSON.stringify(settings, null, 2)}\n`)
  console.log(
    JSON.stringify(
      {
        targets: targets.length,
        withSettings: Object.keys(settings).length,
        missing: missing.length,
        missingSample: missing.slice(0, 10),
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
