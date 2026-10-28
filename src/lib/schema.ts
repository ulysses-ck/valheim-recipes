import { z } from 'zod'
import { BIOME_IDS, CATEGORY_IDS, ITEM_KIND_IDS } from './types.ts'
import type {
  Biome,
  DataOverrides,
  Dataset,
  Ingredient,
  Item,
  ItemStats,
  Meta,
  Recipe,
  Station,
  StationExtension,
  TraderListing,
} from './types.ts'

export const BiomeIdSchema = z.enum(BIOME_IDS)
export const CategoryIdSchema = z.enum(CATEGORY_IDS)
export const ItemKindSchema = z.enum(ITEM_KIND_IDS)

export const IngredientSchema: z.ZodType<Ingredient> = z.object({
  itemId: z.string().min(1),
  name: z.string().min(1),
  amount: z.number().int().nonnegative(),
  amountPerLevel: z.number().int().nonnegative(),
})

const RecipeObject = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  icon: z.string().min(1),
  category: CategoryIdSchema,
  subcategory: z.string().optional(),
  biome: BiomeIdSchema,
  stationId: z.string().min(1),
  stationName: z.string().min(1),
  stationLevel: z.number().int().nonnegative(),
  amount: z.number().int().nonnegative(),
  upgradeOnly: z.boolean(),
  canUpgrade: z.boolean(),
  maxLevel: z.number().int().nonnegative(),
  ingredients: z.array(IngredientSchema),
})
export const RecipeSchema: z.ZodType<Recipe> = RecipeObject

const DamageTypeSchema = z.enum([
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
])

const ItemStatsSchema: z.ZodType<ItemStats> = z.object({
  damage: z
    .partialRecord(DamageTypeSchema, z.number().nonnegative())
    .optional(),
  armor: z.number().nonnegative().optional(),
  blockArmor: z.number().nonnegative().optional(),
  durability: z.number().nonnegative().optional(),
  weight: z.number().nonnegative().optional(),
  stamina: z.number().nonnegative().optional(),
  knockback: z.number().nonnegative().optional(),
  attackForce: z.number().nonnegative().optional(),
  backstabBonus: z.number().nonnegative().optional(),
  health: z.number().nonnegative().optional(),
  foodStamina: z.number().nonnegative().optional(),
  eitr: z.number().nonnegative().optional(),
  duration: z.number().nonnegative().optional(),
  regen: z.number().optional(),
  cooldown: z.number().nonnegative().optional(),
  movement: z.number().optional(),
  effect: z.string().optional(),
  stack: z.number().int().nonnegative().optional(),
})

const ItemObject = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  icon: z.string().min(1),
  category: CategoryIdSchema,
  subcategory: z.string().optional(),
  biome: BiomeIdSchema,
  kind: ItemKindSchema,
  description: z.string().optional(),
  stats: ItemStatsSchema.optional(),
})
export const ItemSchema: z.ZodType<Item> = ItemObject

export const StationExtensionSchema: z.ZodType<StationExtension> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  buildCost: z.array(IngredientSchema),
  biome: BiomeIdSchema,
})

const StationObject = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().min(1),
  biome: BiomeIdSchema,
  buildCost: z.array(IngredientSchema),
  extensions: z.array(StationExtensionSchema),
})
export const StationSchema: z.ZodType<Station> = StationObject

const TraderListingObject = z.object({
  id: z.string().min(1),
  trader: z.string().min(1),
  traderId: z.string().min(1),
  itemId: z.string().nullable(),
  itemName: z.string(),
  icon: z.string(),
  amount: z.number().int().nonnegative(),
  price: z.string(),
  unlock: z.string(),
  unlockKey: z.string().optional(),
  biome: BiomeIdSchema,
})
export const TraderListingSchema: z.ZodType<TraderListing> = TraderListingObject

export const BiomeSchema: z.ZodType<Biome> = z.object({
  id: BiomeIdSchema,
  name: z.string().min(1),
  rank: z.number().int().nonnegative(),
})

export const MetaSchema: z.ZodType<Meta> = z.object({
  generatedAt: z.string().min(1),
  counts: z.object({
    recipes: z.number().int().nonnegative(),
    items: z.number().int().nonnegative(),
    stations: z.number().int().nonnegative(),
    traders: z.number().int().nonnegative(),
    biomes: z.number().int().nonnegative(),
  }),
  unmappedIngredients: z.array(z.string()),
  unmatchedExtensions: z.array(z.string()),
  unknownBiome: z.array(z.string()),
})

export const DatasetSchema: z.ZodType<Dataset> = z.object({
  recipes: z.array(RecipeSchema),
  items: z.array(ItemSchema),
  stations: z.array(StationSchema),
  traders: z.array(TraderListingSchema),
  biomes: z.array(BiomeSchema),
  meta: MetaSchema,
})

export const OverridesSchema: z.ZodType<DataOverrides> = z.object({
  recipes: z.record(z.string(), RecipeObject.partial()),
  items: z.record(z.string(), ItemObject.partial()),
  stations: z.record(z.string(), StationObject.partial()),
  traders: z.record(z.string(), TraderListingObject.partial()),
})

export function validateData(input: unknown): Dataset {
  return DatasetSchema.parse(input)
}

export function validateOverrides(input: unknown): DataOverrides {
  return OverridesSchema.parse(input)
}
