import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rawDir = path.join(root, 'data', 'raw')
const outPath = path.join(rawDir, 'wiki-stats.json')

const API = 'https://valheim.fandom.com/api.php'
const CATEGORIES = ['Weapons', 'Armor', 'Food', 'Tools', 'Mead']
const BATCH = 50

const DAMAGE_KEYS = [
  'slash',
  'pierce',
  'blunt',
  'fire',
  'frost',
  'lightning',
  'poison',
  'spirit',
  'chop',
  'pickaxe',
]

const readJson = (name) =>
  JSON.parse(fs.readFileSync(path.join(rawDir, name), 'utf8'))

function normalize(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '')
}

function number(value) {
  if (value == null) return undefined
  const match = String(value)
    .replace(/,/g, '')
    .match(/-?\d+(?:\.\d+)?/)
  if (!match) return undefined
  const parsed = Number(match[0])
  return Number.isFinite(parsed) ? parsed : undefined
}

function firstInfobox(wikitext) {
  const start = wikitext.search(/\{\{\s*infobox/i)
  if (start === -1) return ''
  let depth = 0
  for (let i = start; i < wikitext.length - 1; i += 1) {
    if (wikitext[i] === '{' && wikitext[i + 1] === '{') {
      depth += 1
      i += 1
    } else if (wikitext[i] === '}' && wikitext[i + 1] === '}') {
      depth -= 1
      i += 1
      if (depth === 0) return wikitext.slice(start, i + 1)
    }
  }
  return wikitext.slice(start)
}

function parseFields(infobox) {
  const fields = new Map()
  const pattern = /\|\s*([a-zA-Z][a-zA-Z0-9 _-]*?)\s*=\s*([^\n|]*)/g
  let match
  while ((match = pattern.exec(infobox))) {
    const key = match[1].trim().toLowerCase().replace(/\s+/g, ' ')
    if (!fields.has(key)) fields.set(key, match[2].trim())
  }
  return fields
}

function parseStats(fields, kind) {
  const stats = {}
  const damage = {}
  for (const type of DAMAGE_KEYS) {
    const value = number(fields.get(type))
    if (value !== undefined) damage[type] = value
  }
  if (Object.keys(damage).length > 0) stats.damage = damage

  const armor = number(fields.get('armor'))
  if (armor !== undefined) stats.armor = armor
  const block = number(fields.get('block armor') ?? fields.get('block'))
  if (block !== undefined) stats.blockArmor = block
  const durability = number(fields.get('durability'))
  if (durability !== undefined) stats.durability = durability
  const weight = number(fields.get('weight'))
  if (weight !== undefined) stats.weight = weight
  const knockback = number(fields.get('knockback'))
  if (knockback !== undefined) stats.knockback = knockback
  const stack = number(fields.get('stack'))
  if (stack !== undefined) stats.stack = stack

  const stamina = number(fields.get('stamina'))
  if (stamina !== undefined) {
    if (kind === 'food' || kind === 'mead') stats.foodStamina = stamina
    else stats.stamina = stamina
  }

  const health = number(fields.get('health'))
  if (health !== undefined) stats.health = health
  const eitr = number(fields.get('eitr'))
  if (eitr !== undefined) stats.eitr = eitr
  const duration = number(fields.get('duration'))
  if (duration !== undefined) stats.duration = duration
  const cooldown = number(fields.get('cooldown'))
  if (cooldown !== undefined) stats.cooldown = cooldown

  const regen =
    number(fields.get('health regen')) ??
    number(fields.get('stamina regen')) ??
    number(fields.get('eitr regen'))
  if (regen !== undefined) stats.regen = regen

  const movement = fields.get('movement speed')
  if (movement) {
    const parsed = number(movement)
    if (parsed !== undefined) stats.movement = parsed / 100
  }

  const effect = fields.get('effect') || fields.get('other effect')
  if (effect)
    stats.effect = effect.replace(/\[\[([^|\]]*\|)?([^\]]+)\]\]/g, '$2').trim()

  return stats
}

async function getJson(params, attempt = 0) {
  const url = new URL(API)
  for (const [key, value] of Object.entries(params))
    url.searchParams.set(key, value)
  const response = await fetch(url, {
    headers: {
      'user-agent': 'valheim-recipes/1.0 (fan project data snapshot)',
    },
  })
  if (!response.ok) {
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
      return getJson(params, attempt + 1)
    }
    throw new Error(`${response.status} ${response.statusText} for ${url}`)
  }
  return response.json()
}

async function categoryMembers(category) {
  const titles = []
  let cont
  do {
    const data = await getJson({
      action: 'query',
      list: 'categorymembers',
      cmtitle: `Category:${category}`,
      cmlimit: '500',
      format: 'json',
      formatversion: '2',
      ...(cont ? { cmcontinue: cont } : {}),
    })
    for (const member of data.query?.categorymembers ?? [])
      titles.push(member.title)
    cont = data.continue?.cmcontinue
  } while (cont)
  return titles
}

function wikiKind(category) {
  if (category === 'Food') return 'food'
  if (category === 'Mead') return 'mead'
  return 'equipment'
}

async function wikitextBatch(titles) {
  const data = await getJson({
    action: 'query',
    prop: 'revisions',
    rvprop: 'content',
    rvslots: 'main',
    redirects: '1',
    format: 'json',
    formatversion: '2',
    titles: titles.join('|'),
  })
  const pages = new Map()
  for (const page of data.query?.pages ?? []) {
    if (page.missing) continue
    const content = page.revisions?.[0]?.slots?.main?.content
    if (content) pages.set(normalize(page.title), content)
  }
  return pages
}

async function main() {
  const items = readJson('items.json')
  const foods = readJson('food.json')
  const foodIds = new Set(foods.map((food) => food.id))

  const targets = []
  for (const item of items) {
    const categories = Array.isArray(item.category)
      ? item.category
      : [item.category]
    const subcategories = Array.isArray(item.subcategory)
      ? item.subcategory
      : [item.subcategory]
    const isEquipment =
      !categories.includes('Armor') &&
      (categories.includes('Equipment') ||
        subcategories.includes('Weapon') ||
        subcategories.includes('Tool'))
    const isMead =
      categories.includes('Mead') &&
      !/^MeadBase/i.test(item.id) &&
      !/base/i.test(item.name)
    if (isEquipment || isMead)
      targets.push({
        id: item.id,
        name: item.name,
        kind: isMead ? 'mead' : 'equipment',
      })
  }
  for (const food of foods) {
    if (!targets.some((target) => target.id === food.id)) {
      targets.push({ id: food.id, name: food.name, kind: 'food' })
    }
  }

  const titleByNormalized = new Map()
  for (const category of CATEGORIES) {
    const members = await categoryMembers(category)
    for (const title of members) {
      if (/^category:/i.test(title)) continue
      const key = normalize(title)
      if (!key) continue
      const existing = titleByNormalized.get(key)
      if (!existing)
        titleByNormalized.set(key, { title, kind: wikiKind(category) })
    }
  }

  const matched = []
  const unmatched = []
  for (const target of targets) {
    const entry = titleByNormalized.get(normalize(target.name))
    if (entry)
      matched.push({ ...target, title: entry.title, wikiKind: entry.kind })
    else unmatched.push(target)
  }

  const stats = {}
  const failed = []
  for (let index = 0; index < matched.length; index += BATCH) {
    const batch = matched.slice(index, index + BATCH)
    const pages = await wikitextBatch(batch.map((target) => target.title))
    for (const target of batch) {
      const content = pages.get(normalize(target.title))
      if (!content) {
        failed.push(target)
        continue
      }
      const parsed = parseStats(parseFields(firstInfobox(content)), target.kind)
      if (Object.keys(parsed).length > 0) stats[target.id] = parsed
    }
  }

  fs.writeFileSync(outPath, `${JSON.stringify(stats, null, 2)}\n`)
  console.log(
    JSON.stringify(
      {
        targets: targets.length,
        matched: matched.length,
        unmatched: unmatched.length,
        failed: failed.length,
        withStats: Object.keys(stats).length,
        unmatchedSample: unmatched.slice(0, 20),
        failedSample: failed.slice(0, 10),
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
