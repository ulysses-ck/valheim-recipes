const ARMOR_TOKENS = ['armor', 'helmet', 'cape', 'shield']
const WEAPON_TOKENS = [
  'sword',
  'mace',
  'axe',
  'spear',
  'atgeir',
  'battleaxe',
  'sledge',
  'knife',
  'club',
  'bow',
  'crossbow',
  'arbalest',
  'staff',
  'fist',
  'arrow',
  'bolt',
  'harpoon',
]
const TOOL_TOKENS = [
  'pickaxe',
  'hoe',
  'cultivator',
  'hammer',
  'fishingrod',
  'butcher',
  'scythe',
  'dverger',
]
const TOOL_ONLY_TOKENS = [
  'pickaxe',
  'hoe',
  'cultivator',
  'hammer',
  'butcher',
  'scythe',
]
const MATERIAL_TOKENS = ['material', 'ore', 'seed', 'valuable']

export function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  return value ? [value] : []
}

function includesAny(text, tokens) {
  return tokens.some((token) => text.includes(token))
}

function itemText(item) {
  return `${item.id ?? ''} ${item.name ?? ''}`.toLowerCase()
}

function isArmor(text) {
  return includesAny(text, ARMOR_TOKENS)
}

function isWeapon(text) {
  if (!includesAny(text, WEAPON_TOKENS)) return false
  return !includesAny(text, TOOL_ONLY_TOKENS)
}

function isTool(text) {
  return includesAny(text, TOOL_TOKENS)
}

function weaponSubcategory(text) {
  if (text.includes('staff')) return 'magic'
  if (includesAny(text, ['bow', 'crossbow', 'arbalest', 'arrow', 'bolt']))
    return 'ranged'
  if (text.includes('harpoon')) return 'harpoon'
  if (text.includes('fishingrod')) return 'grapple'
  return 'melee'
}

/**
 * Classify a raw item or recipe output into the app's browse categories.
 * `isFood` takes priority because the food dataset is authoritative.
 */
const MATERIAL_IDS = new Set([
  'Bell',
  'BombSiege',
  'Bronze',
  'BronzeNails',
  'CeramicPlate',
  'IronNails',
  'KeysGoldUncooked',
  'MechanicalSpring',
  'SharpeningStone',
])

export function classifyItem(item, options = {}) {
  if (options.isFood) {
    return {
      category: 'food',
      subcategory: options.isDrink ? 'drink' : 'food',
    }
  }

  const id = String(item.id ?? '')
  const text = itemText(item)

  if (MATERIAL_IDS.has(id)) return { category: 'material' }
  if (/^(Mead|BarleyWine|Feast)/i.test(id))
    return { category: 'food', subcategory: 'drink' }
  if (/^Trinket/i.test(id)) return { category: 'armor', subcategory: 'trinket' }
  if (/^(Bomb|Snowball|Catapult_Ammo)/i.test(id))
    return { category: 'weapon', subcategory: 'bomb' }
  if (/^(Saddle|DvergrKey|Lantern|Demister|Shovel|Tankard|Wisplight)/i.test(id))
    return { category: 'tool', subcategory: 'utility' }
  if (/^FishingBait/i.test(id))
    return { category: 'other', subcategory: 'bait' }
  if (/^Fireworks/i.test(id))
    return { category: 'other', subcategory: 'fireworks' }
  const subcategories = normalizeList(item.subcategory).map((value) =>
    value.toLowerCase(),
  )
  const categories = normalizeList(item.category).map((value) =>
    value.toLowerCase(),
  )

  if (isArmor(text)) {
    return {
      category: 'armor',
      subcategory: text.includes('shield') ? 'shield' : 'armor',
    }
  }

  if (
    subcategories.includes('weapon') ||
    subcategories.includes('arrow') ||
    subcategories.includes('bolt') ||
    isWeapon(text) ||
    (text.includes('fishingrod') && !options.buildingCategory)
  ) {
    return { category: 'weapon', subcategory: weaponSubcategory(text) }
  }

  if (isTool(text) || subcategories.includes('tool')) {
    return { category: 'tool', subcategory: 'tool' }
  }

  if (options.buildingCategory) {
    return { category: 'construction', subcategory: options.buildingCategory }
  }

  if (
    options.isMaterial ||
    categories.some((value) =>
      ['item drop', 'material', 'resource node', 'flora'].includes(value),
    ) ||
    subcategories.some((value) => MATERIAL_TOKENS.includes(value))
  ) {
    return { category: 'material' }
  }

  return { category: 'other' }
}

export function classifyKind(options = {}) {
  if (options.isFood) return 'food'
  if (options.isStation) return 'station'
  if (options.isBuilding) return 'building'
  if (options.hasRecipe) return 'craftable'
  if (options.isIngredient) return 'material'
  return 'other'
}
