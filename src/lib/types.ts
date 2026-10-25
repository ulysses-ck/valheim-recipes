export const BIOME_IDS = [
  'meadows',
  'blackforest',
  'swamp',
  'mountain',
  'plains',
  'mistlands',
  'ashlands',
  'deepnorth',
] as const

export const CATEGORY_IDS = [
  'food',
  'armor',
  'weapon',
  'tool',
  'construction',
  'material',
  'other',
] as const

export const ITEM_KIND_IDS = [
  'craftable',
  'material',
  'food',
  'building',
  'station',
  'other',
] as const

export type BiomeId = (typeof BIOME_IDS)[number]
export type CategoryId = (typeof CATEGORY_IDS)[number]
export type ItemKind = (typeof ITEM_KIND_IDS)[number]

export interface Ingredient {
  itemId: string
  name: string
  amount: number
  amountPerLevel: number
}

export interface Recipe {
  id: string
  itemId: string
  name: string
  slug: string
  icon: string
  category: CategoryId
  subcategory?: string
  biome: BiomeId
  stationId: string
  stationName: string
  stationLevel: number
  amount: number
  upgradeOnly: boolean
  canUpgrade: boolean
  maxLevel: number
  ingredients: Ingredient[]
}

export interface Item {
  id: string
  name: string
  slug: string
  icon: string
  category: CategoryId
  subcategory?: string
  biome: BiomeId
  kind: ItemKind
  description?: string
}

export interface StationExtension {
  id: string
  name: string
  buildCost: Ingredient[]
  biome: BiomeId
}

export interface Station {
  id: string
  name: string
  icon: string
  biome: BiomeId
  buildCost: Ingredient[]
  extensions: StationExtension[]
}

export interface TraderListing {
  id: string
  trader: string
  traderId: string
  itemId: string | null
  itemName: string
  icon: string
  amount: number
  price: string
  unlock: string
  unlockKey?: string
  biome: BiomeId
}

export interface Biome {
  id: BiomeId
  name: string
  rank: number
}

export interface MetaCounts {
  recipes: number
  items: number
  stations: number
  traders: number
  biomes: number
}

export interface Meta {
  generatedAt: string
  counts: MetaCounts
  unmappedIngredients: string[]
  unmatchedExtensions: string[]
  unknownBiome: string[]
}

export interface Dataset {
  recipes: Recipe[]
  items: Item[]
  stations: Station[]
  traders: TraderListing[]
  biomes: Biome[]
  meta: Meta
}

export interface DataOverrides {
  recipes: Record<string, Partial<Recipe>>
  items: Record<string, Partial<Item>>
  stations: Record<string, Partial<Station>>
  traders: Record<string, Partial<TraderListing>>
}

// Upgrade arithmetic encoded by this dataset:
// - Cost of an ingredient at quality L: amount + amountPerLevel * (L - 1)
// - Delta from current quality C to target T: amountPerLevel * (T - C)
// - Required station level for quality L: max(stationLevel, L)
