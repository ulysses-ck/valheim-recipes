import type {
  Biome,
  BiomeId,
  CategoryId,
  DataOverrides,
  Dataset,
  Ingredient,
  Item,
  ItemKind,
  Recipe,
  Station,
  TraderListing,
} from './types'
import recipesJson from '../data/recipes.json'
import itemsJson from '../data/items.json'
import stationsJson from '../data/stations.json'
import tradersJson from '../data/traders.json'
import biomesJson from '../data/biomes.json'
import metaJson from '../data/meta.json'

export const baseDataset: Dataset = {
  recipes: recipesJson as unknown as Recipe[],
  items: itemsJson as unknown as Item[],
  stations: stationsJson as unknown as Station[],
  traders: tradersJson as unknown as TraderListing[],
  biomes: biomesJson as unknown as Biome[],
  meta: metaJson,
}

export const SITE_NAME = 'Valheim Recipes'

export function emptyOverrides(): DataOverrides {
  return { recipes: {}, items: {}, stations: {}, traders: {} }
}

function applyPatches<T extends { id: string }>(
  rows: T[],
  patches: Record<string, Partial<T>>,
): T[] {
  if (Object.keys(patches).length === 0) return rows
  return rows.map((row) => {
    if (!(row.id in patches)) return row
    return { ...row, ...patches[row.id] }
  })
}

export function applyOverrides(
  base: Dataset,
  overrides: DataOverrides,
): Dataset {
  return {
    ...base,
    recipes: applyPatches(base.recipes, overrides.recipes),
    items: applyPatches(base.items, overrides.items),
    stations: applyPatches(base.stations, overrides.stations),
    traders: applyPatches(base.traders, overrides.traders),
  }
}

export interface CatalogEntry {
  itemId: string
  name: string
  slug: string
  icon: string
  category: CategoryId
  subcategory?: string
  biome: BiomeId
  kind: ItemKind
  recipes: Recipe[]
  recipe?: Recipe
  item?: Item
  ingredients: Ingredient[]
  stationId?: string
  stationName?: string
  usedIn: number
  searchText: string
}

export interface Indexes {
  dataset: Dataset
  itemsById: Map<string, Item>
  recipesById: Map<string, Recipe>
  recipesByItemId: Map<string, Recipe[]>
  primaryRecipeByItemId: Map<string, Recipe>
  recipesByStationId: Map<string, Recipe[]>
  stationsById: Map<string, Station>
  tradersByItemId: Map<string, TraderListing[]>
  usedInByItemId: Map<string, Recipe[]>
  catalogEntries: CatalogEntry[]
  entriesById: Map<string, CatalogEntry>
  biomeRank: Map<BiomeId, number>
  biomeById: Map<BiomeId, Biome>
}

function pickPrimary(recipes: Recipe[]): Recipe {
  return [...recipes].sort((a, b) => {
    if (a.upgradeOnly !== b.upgradeOnly) return a.upgradeOnly ? 1 : -1
    if (a.stationId === 'hammer' && b.stationId !== 'hammer') return 1
    if (b.stationId === 'hammer' && a.stationId !== 'hammer') return -1
    return a.id.localeCompare(b.id)
  })[0]
}

export function createIndexes(dataset: Dataset): Indexes {
  const itemsById = new Map(dataset.items.map((item) => [item.id, item]))
  const recipesById = new Map(
    dataset.recipes.map((recipe) => [recipe.id, recipe]),
  )
  const stationsById = new Map(
    dataset.stations.map((station) => [station.id, station]),
  )
  const biomeRank = new Map(
    dataset.biomes.map((biome) => [biome.id, biome.rank]),
  )
  const biomeById = new Map(dataset.biomes.map((biome) => [biome.id, biome]))

  const recipesByItemId = new Map<string, Recipe[]>()
  const recipesByStationId = new Map<string, Recipe[]>()
  const usedInByItemId = new Map<string, Recipe[]>()

  for (const recipe of dataset.recipes) {
    const forItem = recipesByItemId.get(recipe.itemId) ?? []
    forItem.push(recipe)
    recipesByItemId.set(recipe.itemId, forItem)

    const forStation = recipesByStationId.get(recipe.stationId) ?? []
    forStation.push(recipe)
    recipesByStationId.set(recipe.stationId, forStation)

    for (const ingredient of recipe.ingredients) {
      const usedIn = usedInByItemId.get(ingredient.itemId) ?? []
      if (!usedIn.some((entry) => entry.id === recipe.id)) {
        usedIn.push(recipe)
        usedInByItemId.set(ingredient.itemId, usedIn)
      }
    }
  }

  const primaryRecipeByItemId = new Map<string, Recipe>()
  for (const [itemId, recipes] of recipesByItemId) {
    primaryRecipeByItemId.set(itemId, pickPrimary(recipes))
  }

  const tradersByItemId = new Map<string, TraderListing[]>()
  for (const trader of dataset.traders) {
    if (!trader.itemId) continue
    const list = tradersByItemId.get(trader.itemId) ?? []
    list.push(trader)
    tradersByItemId.set(trader.itemId, list)
  }

  const catalogEntries: CatalogEntry[] = []
  for (const item of dataset.items) {
    if (item.kind === 'station') continue
    const recipes = recipesByItemId.get(item.id) ?? []
    if (item.kind === 'building' && recipes.length === 0) continue

    const recipe = recipes.length
      ? primaryRecipeByItemId.get(item.id)
      : undefined
    const ingredients = recipe?.ingredients ?? []
    const usedIn = usedInByItemId.get(item.id)?.length ?? 0
    const category = recipe?.category ?? item.category
    const subcategory = recipe?.subcategory ?? item.subcategory
    const name = recipe?.name ?? item.name

    catalogEntries.push({
      itemId: item.id,
      name,
      slug: recipe?.slug ?? item.slug,
      icon: recipe?.icon ?? item.icon,
      category,
      subcategory,
      biome: recipe?.biome ?? item.biome,
      kind: item.kind,
      recipes,
      recipe,
      item,
      ingredients,
      stationId: recipe?.stationId,
      stationName: recipe?.stationName,
      usedIn,
      searchText: [
        name,
        item.name,
        category,
        subcategory,
        recipe?.stationName,
        ...ingredients.map((ingredient) => ingredient.name),
        ...recipes.map((entry) => entry.name),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
    })
  }

  catalogEntries.sort((a, b) => a.name.localeCompare(b.name))
  const entriesById = new Map(
    catalogEntries.map((entry) => [entry.itemId, entry]),
  )

  return {
    dataset,
    itemsById,
    recipesById,
    recipesByItemId,
    primaryRecipeByItemId,
    recipesByStationId,
    stationsById,
    tradersByItemId,
    usedInByItemId,
    catalogEntries,
    entriesById,
    biomeRank,
    biomeById,
  }
}

export function isBiomeVisible(
  biome: BiomeId,
  selected: BiomeId | 'all',
  biomeRank: Map<BiomeId, number>,
): boolean {
  if (selected === 'all') return true
  return (biomeRank.get(biome) ?? 0) <= (biomeRank.get(selected) ?? 0)
}

export function visibleEntries(
  entries: CatalogEntry[],
  selected: BiomeId | 'all',
  biomeRank: Map<BiomeId, number>,
): CatalogEntry[] {
  if (selected === 'all') return entries
  return entries.filter((entry) =>
    isBiomeVisible(entry.biome, selected, biomeRank),
  )
}

export function ingredientBiome(indexes: Indexes, itemId: string): BiomeId {
  return indexes.itemsById.get(itemId)?.biome ?? 'meadows'
}

export function visibleIngredients(
  ingredients: Ingredient[],
  indexes: Indexes,
  selected: BiomeId | 'all',
): Ingredient[] {
  if (selected === 'all') return ingredients
  return ingredients.filter((ingredient) =>
    isBiomeVisible(
      ingredientBiome(indexes, ingredient.itemId),
      selected,
      indexes.biomeRank,
    ),
  )
}

export function maxVisibleLevel(
  recipe: Recipe,
  indexes: Indexes,
  selected: BiomeId | 'all',
): number {
  const maximum = Math.max(1, recipe.maxLevel || (recipe.canUpgrade ? 4 : 1))
  if (selected === 'all' || !recipe.canUpgrade || maximum <= 1) {
    return maximum
  }

  const hasHiddenUpgrade = recipe.ingredients.some(
    (ingredient) =>
      ingredient.amountPerLevel > 0 &&
      !isBiomeVisible(
        ingredientBiome(indexes, ingredient.itemId),
        selected,
        indexes.biomeRank,
      ),
  )
  return hasHiddenUpgrade ? 1 : maximum
}

export function itemIconFor(indexes: Indexes, itemId: string): string {
  return (
    indexes.itemsById.get(itemId)?.icon ??
    `/icons/item/${itemId.toLowerCase()}.webp`
  )
}

export function itemNameFor(indexes: Indexes, itemId: string): string {
  return indexes.itemsById.get(itemId)?.name ?? itemId
}
