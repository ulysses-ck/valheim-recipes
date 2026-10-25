import { Link, createFileRoute } from '@tanstack/react-router'
import type { Indexes } from '../lib/dataset'
import { itemIconFor } from '../lib/dataset'
import { useDataset, useBiomeVisibility } from '../lib/dataset-context'
import {
  formatBiome,
  formatCategory,
  formatPrice,
  formatSubcategory,
  formatUnlock,
  pluralize,
} from '../lib/format'
import { maxLevelFor } from '../lib/calculator'
import type { Recipe } from '../lib/types'
import { Badge, BiomeBadge } from '../components/ui/Badge'
import { ItemIcon } from '../components/ui/ItemIcon'
import { IngredientList } from '../components/recipe/IngredientList'
import { RecipeGraph } from '../components/recipe/RecipeGraph'
import { CalculatorPanel } from '../components/calculator/CalculatorPanel'

export const Route = createFileRoute('/item/$id')({ component: ItemPage })

function ItemPage() {
  const { id } = Route.useParams()
  const { indexes } = useDataset()
  const { selection, isVisible } = useBiomeVisibility()
  const entry = indexes.entriesById.get(id)

  if (!entry) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="card p-8 text-center">
          <p className="font-display text-2xl">Item not found</p>
          <p className="mt-2 text-xs text-[var(--faint)]">
            That id is not part of the loaded dataset.
          </p>
          <Link to="/" className="btn mt-5">
            Back to catalog
          </Link>
        </div>
      </div>
    )
  }

  if (!isVisible(entry.biome)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="card p-8 text-center">
          <p className="font-display text-3xl text-[var(--gold-soft)]">ᛟ</p>
          <p className="mt-2 font-display text-xl">
            This entry is hidden by your spoiler gate.
          </p>
          <p className="mt-2 text-xs text-[var(--faint)]">
            Raise your progress in the biome selector to reveal it. Nothing
            about this entry is shown while it is outside{' '}
            {selection === 'all' ? 'the gate' : formatBiome(selection)}.
          </p>
          <Link to="/" className="btn mt-5">
            Back to catalog
          </Link>
        </div>
      </div>
    )
  }

  const recipe = entry.recipe
  const offers = (indexes.tradersByItemId.get(entry.itemId) ?? []).filter(
    (offer) =>
      isVisible(offer.biome) &&
      (!offer.itemId ||
        isVisible(indexes.itemsById.get(offer.itemId)?.biome ?? offer.biome)),
  )
  const usedIn = dedupeRecipes(
    (indexes.usedInByItemId.get(entry.itemId) ?? []).filter((item) =>
      isVisible(item.biome),
    ),
  )
  const visibleRecipes = entry.recipes.filter((item) => isVisible(item.biome))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="flex flex-wrap items-center gap-1.5 text-[0.7rem] text-[var(--faint)]">
        <Link to="/" className="hover:text-[var(--text)]">
          Catalog
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-[var(--muted)]">{entry.name}</span>
      </nav>

      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
        <ItemIcon icon={entry.icon} size="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl md:text-4xl">{entry.name}</h1>
            {recipe?.upgradeOnly ? (
              <Badge className="badge-gold">Upgrade only</Badge>
            ) : null}
            {visibleRecipes.length > 1 ? (
              <Badge>{visibleRecipes.length} recipes</Badge>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge>{formatCategory(entry.category)}</Badge>
            {entry.subcategory ? (
              <Badge>{formatSubcategory(entry.subcategory)}</Badge>
            ) : null}
            <BiomeBadge biome={entry.biome} />
            {entry.stationName ? (
              <Badge title="Crafting station">
                Station: {entry.stationName}
              </Badge>
            ) : (
              <Badge>Material</Badge>
            )}
          </div>
          {entry.item?.description ? (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--muted)]">
              {entry.item.description}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {recipe ? (
            <a href="#calculator" className="btn btn-primary">
              Calculate materials
            </a>
          ) : null}
          <Link
            to="/calculator"
            search={{ item: entry.itemId }}
            className="btn"
          >
            Calculator
          </Link>
        </div>
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          {recipe ? (
            <>
              <section className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-lg">Recipe</h2>
                    <p className="text-xs text-[var(--faint)]">
                      Base craft at quality 1. Upgrade deltas are in the
                      calculator.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.stationId !== 'hand' &&
                    indexes.stationsById.has(recipe.stationId) ? (
                      <Link
                        to="/station/$id"
                        params={{ id: recipe.stationId }}
                        className="badge hover:border-[var(--gold)] hover:text-[var(--gold-soft)]"
                      >
                        {recipe.stationName} · level {recipe.stationLevel}
                      </Link>
                    ) : (
                      <span className="badge">
                        {recipe.stationName} · level {recipe.stationLevel}
                      </span>
                    )}
                    <Badge>{pluralize(recipe.amount, 'item')} per craft</Badge>
                  </div>
                </div>
                <div className="mt-3">
                  <IngredientList
                    lines={recipe.ingredients}
                    indexes={indexes}
                    showPerLevel
                  />
                </div>
              </section>

              <section className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-lg">Ingredient graph</h2>
                    <p className="text-xs text-[var(--faint)]">
                      Expand any craftable ingredient to follow its recipe.
                    </p>
                  </div>
                  <Badge>Click nodes</Badge>
                </div>
                <div className="mt-3">
                  <RecipeGraph rootId={entry.itemId} indexes={indexes} />
                </div>
              </section>

              <div id="calculator" className="scroll-mt-24">
                <CalculatorPanel
                  recipe={recipe}
                  indexes={indexes}
                  initialCurrent={recipe.upgradeOnly ? 1 : 0}
                  initialTarget={recipe.canUpgrade ? maxLevelFor(recipe) : 1}
                />
              </div>

              {visibleRecipes.length > 1 ? (
                <AlternateRecipes
                  recipes={visibleRecipes.filter(
                    (item) => item.id !== recipe.id,
                  )}
                  indexes={indexes}
                />
              ) : null}
            </>
          ) : (
            <section className="card p-4">
              <h2 className="font-display text-lg">Material</h2>
              <p className="mt-1 text-xs text-[var(--faint)]">
                This item is not crafted directly. It is used as an ingredient
                in the recipes below.
              </p>
              <div className="mt-3">
                <UsedInList recipes={usedIn} indexes={indexes} />
              </div>
            </section>
          )}

          {recipe ? (
            <section className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg">Used to craft</h2>
                <Badge>{usedIn.length}</Badge>
              </div>
              <div className="mt-3">
                <UsedInList recipes={usedIn} indexes={indexes} />
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-5">
          <section className="card p-4">
            <h2 className="font-display text-lg">Details</h2>
            <dl className="mt-3 space-y-2 text-xs">
              <Detail label="Biome" value={formatBiome(entry.biome)} />
              <Detail label="Category" value={formatCategory(entry.category)} />
              {entry.subcategory ? (
                <Detail
                  label="Type"
                  value={formatSubcategory(entry.subcategory)}
                />
              ) : null}
              <Detail
                label="Kind"
                value={
                  entry.kind === 'building'
                    ? 'Building piece'
                    : entry.kind === 'food'
                      ? 'Food'
                      : entry.kind === 'craftable'
                        ? 'Craftable'
                        : entry.kind === 'material'
                          ? 'Raw material'
                          : 'Item'
                }
              />
              {recipe ? (
                <>
                  <Detail label="Station" value={recipe.stationName} />
                  <Detail
                    label="Station level"
                    value={`${recipe.stationLevel} to craft`}
                  />
                  <Detail
                    label="Max quality"
                    value={
                      recipe.canUpgrade
                        ? `${maxLevelFor(recipe)} levels`
                        : 'No upgrades'
                    }
                  />
                </>
              ) : null}
            </dl>
          </section>

          {offers.length > 0 || recipe ? (
            <section className="card p-4">
              <h2 className="font-display text-lg">Sold by</h2>
              {offers.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {offers.map((offer) => (
                    <li
                      key={offer.id}
                      className="rounded border border-[var(--border)] px-2.5 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">
                          {offer.trader}
                        </span>
                        <span className="text-xs text-[var(--gold-soft)]">
                          {formatPrice(offer.price)}
                        </span>
                      </div>
                      <p className="mt-1 text-[0.68rem] text-[var(--faint)]">
                        {formatUnlock(offer.unlock)}
                        {offer.amount > 1
                          ? ` · ${pluralize(offer.amount, 'item')} per purchase`
                          : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-[var(--faint)]">
                  No visible trader offers.
                </p>
              )}
            </section>
          ) : null}

          <section className="card p-4">
            <h2 className="font-display text-lg">Source</h2>
            <p className="mt-2 text-[0.68rem] leading-relaxed text-[var(--faint)]">
              Recipe and icon data are derived from valheimcheats.com and
              validated against the community wiki. Biomes are inferred from
              materials, stations, and trader unlocks, then corrected with
              overrides.
            </p>
            <a
              className="mt-3 inline-block text-xs text-[var(--gold-soft)] hover:underline"
              href="https://valheimcheats.com"
              target="_blank"
              rel="noreferrer"
            >
              View the source site
            </a>
          </section>
        </aside>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[var(--faint)]">{label}</dt>
      <dd className="text-right text-[var(--muted)]">{value}</dd>
    </div>
  )
}

function dedupeRecipes(recipes: Recipe[]): Recipe[] {
  const seen = new Set<string>()
  return recipes.filter((recipe) => {
    if (seen.has(recipe.itemId)) return false
    seen.add(recipe.itemId)
    return true
  })
}

function UsedInList({
  recipes,
  indexes,
}: {
  recipes: Recipe[]
  indexes: Indexes
}) {
  if (recipes.length === 0) {
    return (
      <p className="text-xs text-[var(--faint)]">
        Not used by any visible recipe.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-[var(--border)]">
      {recipes.slice(0, 16).map((recipe) => (
        <li key={recipe.id} className="flex items-center gap-2.5 py-2">
          <ItemIcon icon={itemIconFor(indexes, recipe.itemId)} size="sm" />
          <Link
            to="/item/$id"
            params={{ id: recipe.itemId }}
            className="min-w-0 flex-1 truncate text-xs text-[var(--text)] hover:text-[var(--gold-soft)]"
          >
            {recipe.name}
          </Link>
          <span className="shrink-0 text-[0.65rem] text-[var(--faint)]">
            {formatCategory(recipe.category)}
          </span>
        </li>
      ))}
      {recipes.length > 16 ? (
        <li className="py-2 text-[0.68rem] text-[var(--faint)]">
          +{recipes.length - 16} more
        </li>
      ) : null}
    </ul>
  )
}

function AlternateRecipes({
  recipes,
  indexes,
}: {
  recipes: Recipe[]
  indexes: Indexes
}) {
  if (recipes.length === 0) return null

  return (
    <section className="card p-4">
      <h2 className="font-display text-lg">Alternate recipes</h2>
      <p className="text-xs text-[var(--faint)]">
        The graph and calculator use the first recipe.
      </p>
      <div className="mt-3 space-y-4">
        {recipes.map((recipe) => (
          <div key={recipe.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold text-[var(--muted)]">
                {recipe.stationName}
              </h3>
              <Badge>{pluralize(recipe.amount, 'item')} per craft</Badge>
            </div>
            <IngredientList lines={recipe.ingredients} indexes={indexes} />
          </div>
        ))}
      </div>
    </section>
  )
}
