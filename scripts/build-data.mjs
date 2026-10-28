import fs from 'node:fs'
import path from 'node:path'
import { classifyItem, classifyKind, normalizeList } from './lib/categories.mjs'
import {
  BIOMES,
  DEFAULT_BIOME,
  STATION_BIOMES,
  biomeFromTraderUnlock,
  biomeOfMaterial,
  maxBiome,
} from './lib/biomes.mjs'
import { fallbackName, prettifyId, slugify } from './lib/text.mjs'
import { validateData, validateOverrides } from '../src/lib/schema.ts'

const root = path.resolve(import.meta.dirname, '..')
const rawDir = path.join(root, 'data', 'raw')
const outDir = path.join(root, 'src', 'data')
const overridesPath = path.join(outDir, 'overrides.json')

const readJson = (file) =>
  JSON.parse(fs.readFileSync(path.join(rawDir, file), 'utf8'))
const writeJson = (file, value) => {
  fs.writeFileSync(
    path.join(outDir, file),
    `${JSON.stringify(value, null, 2)}\n`,
  )
}

const recipesRaw = readJson('recipes.json')
const buildingsRaw = readJson('building.json')
const itemsRaw = readJson('items.json')
const foodsRaw = readJson('food.json')
const tradersRaw = readJson('traders.json')
const detailSettings = fs.existsSync(path.join(rawDir, 'detail-settings.json'))
  ? readJson('detail-settings.json')
  : {}
const wikiStats = fs.existsSync(path.join(rawDir, 'wiki-stats.json'))
  ? readJson('wiki-stats.json')
  : {}

function itemStats(id, food, rawItem) {
  const stats = {}
  const foodData = food?.food
  if (foodData) {
    for (const key of ['health', 'eitr', 'duration', 'regen']) {
      if (typeof foodData[key] === 'number') stats[key] = foodData[key]
    }
    if (typeof foodData.stamina === 'number')
      stats.foodStamina = foodData.stamina
    if (typeof food.weight === 'number') stats.weight = food.weight
    if (typeof food.maxStackSize === 'number') stats.stack = food.maxStackSize
  }

  const detail = detailSettings[id]
  if (detail) {
    if (typeof detail.m_armor === 'number') stats.armor = detail.m_armor
    if (typeof detail.m_blockPower === 'number')
      stats.blockArmor = detail.m_blockPower
    if (typeof detail.m_weight === 'number') stats.weight = detail.m_weight
    if (typeof detail.m_maxDurability === 'number')
      stats.durability = detail.m_maxDurability
    if (typeof detail.m_movementModifier === 'number')
      stats.movement = detail.m_movementModifier
    if (typeof detail.m_attackForce === 'number')
      stats.attackForce = detail.m_attackForce
    if (typeof detail.m_backstabBonus === 'number')
      stats.backstabBonus = detail.m_backstabBonus
  }

  const wiki = wikiStats[id]
  if (wiki?.damage) stats.damage = wiki.damage
  if (wiki) {
    const categories = Array.isArray(rawItem?.category)
      ? rawItem.category
      : [rawItem?.category]
    const isMead = categories.includes('Mead')
    for (const key of ['stamina', 'knockback']) {
      if (!isMead && typeof wiki[key] === 'number' && stats[key] === undefined)
        stats[key] = wiki[key]
    }
    if (isMead) {
      for (const key of ['weight', 'stack', 'duration', 'cooldown', 'regen']) {
        if (typeof wiki[key] === 'number') stats[key] = wiki[key]
      }
      if (wiki.effect && !/[{}]/.test(wiki.effect) && wiki.effect.length > 2)
        stats.effect = wiki.effect
    }
  }

  for (const [key, value] of Object.entries(stats)) {
    if (typeof value === 'number')
      stats[key] = Math.round(value * 1000) / 1000
  }

  return Object.keys(stats).length > 0 ? stats : undefined
}

const itemIcon = (slug) => `/icons/item/${slug}.webp`
const stationIcon = (icon, id) =>
  `/icons/building-piece/${(icon || `${id}.webp`).toLowerCase()}`
const isUpgrader = (itemId) => /^Upgrader\d/i.test(itemId)

const itemsById = new Map(itemsRaw.map((item) => [item.id, item]))
const foodsById = new Map(foodsRaw.map((food) => [food.id, food]))
const fermenterOutputIds = new Set(
  itemsRaw
    .filter((item) => /^Mead(?!Base)/.test(item.id) || item.id === 'BarleyWine')
    .map((item) => item.id),
)
const meadBaseByOutputId = new Map()
for (const id of fermenterOutputIds) {
  const baseId =
    id === 'BarleyWine' ? 'BarleyWineBase' : id.replace(/^Mead/, 'MeadBase')
  const match = itemsRaw.find(
    (item) => item.id.toLowerCase() === baseId.toLowerCase(),
  )
  if (match) meadBaseByOutputId.set(id, match.id)
}
const buildingsById = new Map(
  buildingsRaw.map((building) => [building.id, building]),
)

const defaultOverrides = { recipes: {}, items: {}, stations: {}, traders: {} }
const overrides = fs.existsSync(overridesPath)
  ? validateOverrides(JSON.parse(fs.readFileSync(overridesPath, 'utf8')))
  : defaultOverrides

function itemName(itemId) {
  return (
    itemsById.get(itemId)?.name ??
    foodsById.get(itemId)?.name ??
    buildingsById.get(itemId)?.name ??
    fallbackName(itemId)
  )
}

function itemSlug(itemId) {
  return itemsById.get(itemId)?.slug ?? slugify(itemId)
}

function resources(resources = []) {
  return resources
    .filter((resource) => resource?.item && !isUpgrader(resource.item))
    .map((resource) => ({
      itemId: resource.item,
      name: itemName(resource.item),
      amount: Number(resource.amount ?? 0),
      amountPerLevel: Number(resource.amountPerLevel ?? 0),
    }))
}

const enabledRecipes = recipesRaw.filter((recipe) => recipe.enabled !== false)
const recipesByItem = new Map()
for (const recipe of enabledRecipes) {
  const list = recipesByItem.get(recipe.item) ?? []
  list.push(recipe)
  recipesByItem.set(recipe.item, list)
}

const stationsRaw = buildingsRaw.filter(
  (building) => building.isCraftingStation,
)
const extensionPieces = buildingsRaw.filter((building) =>
  /_ext/i.test(building.id),
)
const extensionAliases = {
  piece_artisanstation: ['artisan'],
  piece_cauldron: ['cauldron'],
  piece_magetable: ['magetable'],
  piece_MeadCauldron: ['meadcauldron'],
}

function extensionPrefixes(station) {
  const bare = station.id.replace(/^piece_/i, '')
  const aliases = extensionAliases[station.id] ?? []
  return [...new Set([station.id, bare, ...aliases])].map((prefix) =>
    prefix.toLowerCase(),
  )
}

function stationForExtension(extensionId) {
  const id = extensionId.toLowerCase()
  let match = null
  let matchLength = -1
  for (const station of stationsRaw) {
    for (const prefix of extensionPrefixes(station)) {
      const stem = `${prefix}_ext`
      if ((id === stem || id.startsWith(stem)) && prefix.length > matchLength) {
        match = station
        matchLength = prefix.length
      }
    }
  }
  return match
}

const extensionsByStation = new Map(
  stationsRaw.map((station) => [station.id, []]),
)
const unmatchedExtensions = []
for (const extension of extensionPieces) {
  const station = stationForExtension(extension.id)
  if (station) extensionsByStation.get(station.id).push(extension)
  else unmatchedExtensions.push(extension.id)
}

function costBiome(buildCost) {
  return maxBiome(buildCost.map((entry) => biomeOfMaterial(entry.itemId)))
}

const stations = stationsRaw
  .map((station) => {
    const buildCost = resources(station.resources)
    const extensions = (extensionsByStation.get(station.id) ?? [])
      .map((extension) => {
        const extensionCost = resources(extension.resources)
        return {
          id: extension.id,
          name: extension.name,
          buildCost: extensionCost,
          biome: costBiome(extensionCost),
        }
      })
      .sort((a, b) => a.id.localeCompare(b.id))
    const base = {
      id: station.id,
      name: station.name,
      icon: stationIcon(station.icon, station.id),
      biome: maxBiome([costBiome(buildCost), STATION_BIOMES[station.id]]),
      buildCost,
      extensions,
    }
    return { ...base, ...overrides.stations[station.id] }
  })
  .sort((a, b) => a.id.localeCompare(b.id))

stations.push({
  id: 'hammer',
  name: 'Hammer',
  icon: '/icons/item/hammer.webp',
  biome: 'meadows',
  buildCost: [],
  extensions: [],
})
stations.sort((a, b) => a.id.localeCompare(b.id))

const stationsById = new Map(stations.map((station) => [station.id, station]))

const traderItemsByName = new Map()
for (const item of itemsRaw) {
  const key = item.name?.trim().toLowerCase()
  if (!key) continue
  const current = traderItemsByName.get(key)
  if (!current || (item.has_image === 'TRUE' && current.has_image !== 'TRUE')) {
    traderItemsByName.set(key, item)
  }
}

const traderBiomeByItem = new Map()
const unknownBiome = new Set()
const traders = tradersRaw.map((row) => {
  const matched = row.itemName
    ? traderItemsByName.get(row.itemName.trim().toLowerCase())
    : undefined
  const unlock = biomeFromTraderUnlock(row.unlock, row.unlockHref)
  if (!unlock.known) unknownBiome.add(row.unlock || '(empty unlock)')

  const base = {
    id: row.id,
    trader: row.trader,
    traderId: slugify(row.trader) || row.trader.toLowerCase(),
    itemId: matched?.id ?? null,
    itemName: row.itemName || matched?.name || '',
    icon: matched ? itemIcon(matched.slug) : row.itemImage || '',
    amount: Number(row.amount ?? 0),
    price: String(row.price ?? ''),
    unlock: String(row.unlock ?? ''),
    unlockKey: unlock.key ?? undefined,
    biome: unlock.biome,
  }
  const trader = { ...base, ...overrides.traders[row.id] }
  if (trader.itemId) {
    traderBiomeByItem.set(
      trader.itemId,
      maxBiome([traderBiomeByItem.get(trader.itemId), trader.biome]),
    )
  }
  return trader
})

const biomeMemo = new Map()
const resolving = new Set()

function resolveBiome(itemId) {
  const override = overrides.items[itemId]?.biome
  if (override) return { biome: override, known: true }

  const cached = biomeMemo.get(itemId)
  if (cached) return cached

  const materialBiome = biomeOfMaterial(itemId)
  if (resolving.has(itemId)) {
    return {
      biome: materialBiome ?? DEFAULT_BIOME,
      known: Boolean(materialBiome),
    }
  }
  resolving.add(itemId)

  const values = []
  let known = false

  if (materialBiome) {
    values.push(materialBiome)
    known = true
  }

  const baseMeadId = meadBaseByOutputId.get(itemId)
  if (baseMeadId) {
    const baseMead = resolveBiome(baseMeadId)
    values.push(baseMead.biome)
    if (baseMead.known) known = true
  }

  const station = stationsById.get(itemId)
  if (station) {
    values.push(station.biome)
    known = true
  }

  const building = buildingsById.get(itemId)
  if (building) {
    values.push(
      ...resources(building.resources).map((entry) =>
        biomeOfMaterial(entry.itemId),
      ),
    )
  }

  for (const recipe of recipesByItem.get(itemId) ?? []) {
    for (const ingredient of resources(recipe.resources)) {
      if (ingredient.amount === 0) continue
      const ingredientBiome = resolveBiome(ingredient.itemId)
      values.push(ingredientBiome.biome)
      if (ingredientBiome.known) known = true
    }

    const recipeStation = stationsById.get(recipe.craftingStation ?? 'hand')
    if (recipeStation) {
      values.push(recipeStation.biome)
      known = true
    }
  }

  const traderBiome = traderBiomeByItem.get(itemId)
  if (traderBiome) {
    values.push(traderBiome)
    known = true
  }

  resolving.delete(itemId)
  const result = { biome: maxBiome(values, DEFAULT_BIOME), known }
  biomeMemo.set(itemId, result)
  return result
}

const recipes = enabledRecipes
  .map((recipe) => {
    const rawItem = itemsById.get(recipe.item)
    const name = rawItem?.name ?? itemName(recipe.item)
    const slug = itemSlug(recipe.item)
    const classification = classifyItem(rawItem ?? { id: recipe.item, name }, {
      isFood: foodsById.has(recipe.item),
      isDrink: Boolean(foodsById.get(recipe.item)?.food?.isDrink),
    })
    const stationId = recipe.craftingStation ?? 'hand'
    const station = stationsById.get(stationId)
    const ingredients = resources(recipe.resources)
    const stationName =
      recipe.stationName ??
      station?.name ??
      (stationId === 'hand' ? 'Hand' : prettifyId(stationId))
    const canUpgrade = ['weapon', 'armor', 'tool'].includes(
      classification.category,
    )
    const base = {
      id: recipe.id,
      itemId: recipe.item,
      name,
      slug,
      icon: itemIcon(slug),
      category: classification.category,
      ...(classification.subcategory
        ? { subcategory: classification.subcategory }
        : {}),
      biome: maxBiome([
        ...ingredients
          .filter((ingredient) => ingredient.amount > 0)
          .map((ingredient) => resolveBiome(ingredient.itemId).biome),
        station?.biome ?? DEFAULT_BIOME,
      ]),
      stationId,
      stationName,
      stationLevel: Number(recipe.minStationLevel ?? 1),
      amount: Number(recipe.amount ?? 1),
      upgradeOnly: Boolean(recipe.noCraftOnlyUpgrade),
      canUpgrade,
      maxLevel: canUpgrade ? 4 : 1,
      ingredients,
    }
    return { ...base, ...overrides.recipes[recipe.id] }
  })
  .sort((a, b) => a.id.localeCompare(b.id))

const BUILDING_BIOME_HINTS = [
  [/ashlands/i, 'ashlands'],
  [/ashwood|grausten|flametal|charred|asksvin|bonemaw|morkhalla/i, 'ashlands'],
  [/mistlands/i, 'mistlands'],
  [/blackmarble|yggdrasil|eitr/i, 'mistlands'],
  [/deepnorth/i, 'deepnorth'],
  [/frostwood|barka|bjorn|moose|seal|poteitr/i, 'deepnorth'],
  [/blackforest/i, 'blackforest'],
  [/plains/i, 'plains'],
  [/barley|flax|blackmetal|tar/i, 'plains'],
  [/mountains?/i, 'mountain'],
  [/silver|wolf|frost|obsidian/i, 'mountain'],
  [/swamp/i, 'swamp'],
  [/meadows/i, 'meadows'],
]

function buildingBiomeHint(building) {
  for (const [pattern, biome] of BUILDING_BIOME_HINTS) {
    if (pattern.test(building.id)) return biome
  }
  return null
}

const constructionRecipes = buildingsRaw
  .filter((building) => !/_ext/i.test(building.id))
  .filter((building) => !building.isCraftingStation)
  .filter((building) => !/_(female|male)$/i.test(building.id))
  .filter((building) => resources(building.resources).length > 0)
  .map((building) => {
    const ingredients = resources(building.resources)
    const badName =
      !building.name ||
      building.name === 'null' ||
      /^Ashlands_/i.test(building.id)
    const name = badName ? fallbackName(building.id) : building.name
    const base = {
      id: `Build_${building.id}`,
      itemId: building.id,
      name,
      slug: building.id,
      icon: stationIcon(building.icon, building.id),
      category: 'construction',
      subcategory: building.category ?? 'Building',
      biome: maxBiome([
        buildingBiomeHint(building),
        resolveBiome(building.id).biome,
      ]),
      stationId: 'hammer',
      stationName: 'Hammer',
      stationLevel: 1,
      amount: 1,
      upgradeOnly: false,
      canUpgrade: false,
      maxLevel: 1,
      ingredients,
    }
    return { ...base, ...overrides.recipes[base.id] }
  })

const allRecipes = [...recipes, ...constructionRecipes].sort((a, b) =>
  a.id.localeCompare(b.id),
)

const ingredientIds = new Set()
for (const recipe of enabledRecipes) {
  for (const ingredient of resources(recipe.resources))
    ingredientIds.add(ingredient.itemId)
}
for (const building of buildingsRaw) {
  for (const ingredient of resources(building.resources))
    ingredientIds.add(ingredient.itemId)
}

const itemIds = new Set()
for (const id of ingredientIds) itemIds.add(id)
for (const recipe of enabledRecipes) itemIds.add(recipe.item)
for (const food of foodsRaw) itemIds.add(food.id)
for (const id of fermenterOutputIds) itemIds.add(id)
for (const building of buildingsRaw) itemIds.add(building.id)
for (const trader of traders) if (trader.itemId) itemIds.add(trader.itemId)

const items = [...itemIds]
  .map((id) => {
    const rawItem = itemsById.get(id)
    const food = foodsById.get(id)
    const building = buildingsById.get(id)
    const recipe = recipesByItem.get(id)?.[0]
    const kind = classifyKind({
      isFood: Boolean(food) || fermenterOutputIds.has(id),
      isStation: Boolean(building?.isCraftingStation),
      isBuilding: Boolean(building),
      hasRecipe: Boolean(recipe),
      isIngredient: ingredientIds.has(id),
    })
    const name =
      building?.name ?? food?.name ?? rawItem?.name ?? fallbackName(id)
    const slug = rawItem?.slug ?? slugify(id)

    let classification
    if (food) {
      classification = { category: 'food' }
    } else if (building) {
      classification = classifyItem({}, { buildingCategory: building.category })
    } else if (recipe) {
      classification = classifyItem(rawItem ?? { id, name })
    } else if (kind === 'material') {
      classification = { category: 'material' }
    } else if (rawItem) {
      classification = classifyItem(rawItem)
    } else {
      classification = { category: 'other' }
    }

    const stats = itemStats(id, food, rawItem)
    const base = {
      id,
      name,
      slug,
      icon: itemIcon(slug),
      category: classification.category,
      ...(classification.subcategory
        ? { subcategory: classification.subcategory }
        : {}),
      biome: resolveBiome(id).biome,
      kind,
      ...(rawItem?.game_description || rawItem?.description
        ? { description: rawItem.game_description || rawItem.description }
        : {}),
      ...(stats ? { stats } : {}),
    }
    return { ...base, ...overrides.items[id] }
  })
  .sort((a, b) => a.id.localeCompare(b.id))

const unmappedIngredients = [...ingredientIds]
  .filter((id) => !resolveBiome(id).known)
  .sort()
const meta = {
  generatedAt: new Date().toISOString(),
  counts: {
    recipes: allRecipes.length,
    items: items.length,
    stations: stations.length,
    traders: traders.length,
    biomes: BIOMES.length,
  },
  unmappedIngredients,
  unmatchedExtensions: unmatchedExtensions.sort(),
  unknownBiome: [...unknownBiome].sort(),
}

const dataset = validateData({
  recipes: allRecipes,
  items,
  stations,
  traders,
  biomes: BIOMES,
  meta,
})

fs.mkdirSync(outDir, { recursive: true })
writeJson('recipes.json', dataset.recipes)
writeJson('items.json', dataset.items)
writeJson('stations.json', dataset.stations)
writeJson('traders.json', dataset.traders)
writeJson('biomes.json', dataset.biomes)
writeJson('meta.json', dataset.meta)
if (!fs.existsSync(overridesPath)) writeJson('overrides.json', defaultOverrides)

console.log(
  JSON.stringify(
    {
      counts: dataset.meta.counts,
      unmappedIngredients: dataset.meta.unmappedIngredients,
      unmatchedExtensions: dataset.meta.unmatchedExtensions,
      unknownBiome: dataset.meta.unknownBiome,
    },
    null,
    2,
  ),
)
