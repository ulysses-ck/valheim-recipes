import { Link, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const { id } = Route.useParams()
  const { indexes } = useDataset()
  const { selection, isVisible } = useBiomeVisibility()
  const entry = indexes.entriesById.get(id)

  if (!entry) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="card p-8 text-center">
          <p className="font-display text-2xl">{t('item.notFound')}</p>
          <p className="mt-2 text-xs text-[var(--faint)]">
            {t('item.notFoundBody')}
          </p>
          <Link to="/" className="btn mt-5">
            {t('item.backCatalog')}
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
            {t('item.hiddenTitle')}
          </p>
          <p className="mt-2 text-xs text-[var(--faint)]">
            {t('item.hiddenBody', {
              scope:
                selection === 'all'
                  ? t('item.gate')
                  : formatBiome(selection),
            })}
          </p>
          <Link to="/" className="btn mt-5">
            {t('item.backCatalog')}
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
          {t('home.catalogTitle')}
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
              <Badge className="badge-gold">{t('item.upgradeOnly')}</Badge>
            ) : null}
            {visibleRecipes.length > 1 ? (
              <Badge>{pluralize(visibleRecipes.length, 'recipe')}</Badge>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge>{formatCategory(entry.category)}</Badge>
            {entry.subcategory ? (
              <Badge>{formatSubcategory(entry.subcategory)}</Badge>
            ) : null}
            <BiomeBadge biome={entry.biome} />
            {entry.stationName ? (
              <Badge title={t('item.stationTitle')}>
                {t('item.station', { station: entry.stationName })}
              </Badge>
            ) : (
              <Badge>{t('item.material')}</Badge>
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
              {t('item.calculateMaterials')}
            </a>
          ) : null}
          <Link
            to="/calculator"
            search={{ item: entry.itemId }}
            className="btn"
          >
            {t('item.calculator')}
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
                    <h2 className="font-display text-lg">
                      {t('item.recipeTitle')}
                    </h2>
                    <p className="text-xs text-[var(--faint)]">
                      {t('item.recipeSubtitle')}
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
                        {t('item.stationLevel', {
                          station: recipe.stationName,
                          level: recipe.stationLevel,
                        })}
                      </Link>
                    ) : (
                      <span className="badge">
                        {t('item.stationLevel', {
                          station: recipe.stationName,
                          level: recipe.stationLevel,
                        })}
                      </span>
                    )}
                    <Badge>
                      {t('item.perCraft', { count: recipe.amount })}
                    </Badge>
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
                    <h2 className="font-display text-lg">
                      {t('item.graphTitle')}
                    </h2>
                    <p className="text-xs text-[var(--faint)]">
                      {t('item.graphSubtitle')}
                    </p>
                  </div>
                  <Badge>{t('item.clickNodes')}</Badge>
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
              <h2 className="font-display text-lg">
                {t('item.materialTitle')}
              </h2>
              <p className="mt-1 text-xs text-[var(--faint)]">
                {t('item.materialBody')}
              </p>
              <div className="mt-3">
                <UsedInList recipes={usedIn} indexes={indexes} />
              </div>
            </section>
          )}

          {recipe ? (
            <section className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg">
                  {t('item.usedToCraft')}
                </h2>
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
            <h2 className="font-display text-lg">{t('item.details')}</h2>
            <dl className="mt-3 space-y-2 text-xs">
              <Detail label={t('item.biome')} value={formatBiome(entry.biome)} />
              <Detail
                label={t('item.category')}
                value={formatCategory(entry.category)}
              />
              {entry.subcategory ? (
                <Detail
                  label={t('item.type')}
                  value={formatSubcategory(entry.subcategory)}
                />
              ) : null}
              <Detail
                label={t('item.kind')}
                value={
                  entry.kind === 'building'
                    ? t('item.kindBuilding')
                    : entry.kind === 'food'
                      ? t('item.kindFood')
                      : entry.kind === 'craftable'
                        ? t('item.kindCraftable')
                        : entry.kind === 'material'
                          ? t('item.kindMaterial')
                          : t('item.kindItem')
                }
              />
              {recipe ? (
                <>
                  <Detail
                    label={t('item.stationLabel')}
                    value={recipe.stationName}
                  />
                  <Detail
                    label={t('item.stationLevelLabel')}
                    value={t('item.toCraft', { level: recipe.stationLevel })}
                  />
                  <Detail
                    label={t('item.maxQuality')}
                    value={
                      recipe.canUpgrade
                        ? t('item.levels', { count: maxLevelFor(recipe) })
                        : t('item.noUpgrades')
                    }
                  />
                </>
              ) : null}
            </dl>
          </section>

          {offers.length > 0 || recipe ? (
            <section className="card p-4">
              <h2 className="font-display text-lg">{t('item.soldBy')}</h2>
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
                          ? ` · ${t('item.perPurchase', {
                              count: offer.amount,
                            })}`
                          : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-[var(--faint)]">
                  {t('item.noOffers')}
                </p>
              )}
            </section>
          ) : null}

          <section className="card p-4">
            <h2 className="font-display text-lg">{t('item.sourceTitle')}</h2>
            <p className="mt-2 text-[0.68rem] leading-relaxed text-[var(--faint)]">
              {t('item.sourceBody')}
            </p>
            <a
              className="mt-3 inline-block text-xs text-[var(--gold-soft)] hover:underline"
              href="https://valheimcheats.com"
              target="_blank"
              rel="noreferrer"
            >
              {t('item.viewSource')}
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
  const { t } = useTranslation()
  if (recipes.length === 0) {
    return (
      <p className="text-xs text-[var(--faint)]">{t('item.usedInNone')}</p>
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
          {t('item.more', { count: recipes.length - 16 })}
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
  const { t } = useTranslation()
  if (recipes.length === 0) return null

  return (
    <section className="card p-4">
      <h2 className="font-display text-lg">{t('item.altRecipesTitle')}</h2>
      <p className="text-xs text-[var(--faint)]">
        {t('item.altRecipesBody')}
      </p>
      <div className="mt-3 space-y-4">
        {recipes.map((recipe) => (
          <div key={recipe.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold text-[var(--muted)]">
                {recipe.stationName}
              </h3>
              <Badge>{t('item.perCraft', { count: recipe.amount })}</Badge>
            </div>
            <IngredientList lines={recipe.ingredients} indexes={indexes} />
          </div>
        ))}
      </div>
    </section>
  )
}
