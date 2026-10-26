import { useMemo } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { Indexes } from '../lib/dataset'
import { itemIconFor } from '../lib/dataset'
import { useDataset, useBiomeVisibility } from '../lib/dataset-context'
import { formatBiome, pluralize } from '../lib/format'
import type { Recipe } from '../lib/types'
import { Badge, BiomeBadge } from '../components/ui/Badge'
import { ItemIcon } from '../components/ui/ItemIcon'
import { IngredientList } from '../components/recipe/IngredientList'
import { CatalogCard } from '../components/catalog/CatalogCard'

export const Route = createFileRoute('/station/$id')({ component: StationPage })

function StationPage() {
  const { t } = useTranslation()
  const { id } = Route.useParams()
  const { indexes } = useDataset()
  const { selection, isVisible } = useBiomeVisibility()
  const station = indexes.stationsById.get(id)

  const recipes = useMemo(() => {
    const all = indexes.recipesByStationId.get(id) ?? []
    const seen = new Set<string>()
    return all.filter((recipe) => {
      if (!isVisible(recipe.biome)) return false
      if (seen.has(recipe.itemId)) return false
      seen.add(recipe.itemId)
      return true
    })
  }, [id, indexes.recipesByStationId, isVisible])

  if (!station) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="card p-8 text-center">
          <p className="font-display text-2xl">{t('station.notFound')}</p>
          <Link to="/" className="btn mt-5">
            {t('station.backCatalog')}
          </Link>
        </div>
      </div>
    )
  }

  if (!isVisible(station.biome)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="card p-8 text-center">
          <p className="font-display text-3xl text-[var(--gold-soft)]">ᛟ</p>
          <p className="mt-2 font-display text-xl">
            {t('station.hiddenTitle')}
          </p>
          <p className="mt-2 text-xs text-[var(--faint)]">
            {t('station.hiddenBody', {
              scope:
                selection === 'all' ? t('station.gate') : formatBiome(selection),
            })}
          </p>
          <Link to="/" className="btn mt-5">
            {t('station.backCatalog')}
          </Link>
        </div>
      </div>
    )
  }

  const stationRecipes = indexes.recipesByStationId.get(station.id) ?? []
  const extensions = station.extensions.filter((extension) =>
    isVisible(extension.biome),
  )
  const hiddenExtensions = station.extensions.length - extensions.length

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="flex flex-wrap items-center gap-1.5 text-[0.7rem] text-[var(--faint)]">
        <Link to="/" className="hover:text-[var(--text)]">
          {t('home.catalogTitle')}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-[var(--muted)]">{station.name}</span>
      </nav>

      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
        <ItemIcon icon={station.icon} size="xl" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl md:text-4xl">{station.name}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <BiomeBadge biome={station.biome} />
            <Badge>{pluralize(recipes.length, 'visible recipe')}</Badge>
            {extensions.length > 0 ? (
              <Badge>{pluralize(extensions.length, 'extension')}</Badge>
            ) : null}
          </div>
        </div>
        <Link to="/calculator" className="btn">
          {t('station.openCalculator')}
        </Link>
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-2xl">
                {t('station.recipesTitle')}
              </h2>
              <p className="mt-1 text-xs text-[var(--faint)]">
                {t('station.recipesSubtitle', { station: station.name })}
              </p>
            </div>
            <Badge>{recipes.length}</Badge>
          </div>

          {recipes.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {recipes.map((recipe) => {
                const entry = indexes.entriesById.get(recipe.itemId)
                if (!entry) return null
                return (
                  <CatalogCard
                    key={recipe.itemId}
                    entry={entry}
                    indexes={indexes}
                  />
                )
              })}
            </div>
          ) : (
            <div className="card mt-4 p-8 text-center">
              <p className="font-display text-lg">
                {t('station.noRecipesTitle')}
              </p>
              <p className="mt-1 text-xs text-[var(--faint)]">
                {t('station.noRecipesBody')}
              </p>
            </div>
          )}

          {stationRecipes.length > recipes.length ? (
            <p className="mt-3 text-[0.68rem] text-[var(--faint)]">
              {t('station.hiddenRecipes', {
                count: stationRecipes.length - recipes.length,
              })}
            </p>
          ) : null}
        </section>

        <aside className="space-y-5">
          <section className="card p-4">
            <h2 className="font-display text-lg">{t('station.buildCost')}</h2>
            <p className="text-xs text-[var(--faint)]">
              {t('station.buildCostSubtitle')}
            </p>
            <div className="mt-3">
              <IngredientList
                lines={station.buildCost}
                indexes={indexes}
                emptyText={t('station.noBuildMaterials')}
              />
            </div>
          </section>

          <section className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg">
                {t('station.extensionsTitle')}
              </h2>
              <Badge>{extensions.length}</Badge>
            </div>
            <p className="mt-1 text-xs text-[var(--faint)]">
              {t('station.extensionsSubtitle')}
            </p>

            {extensions.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {extensions.map((extension) => (
                  <li
                    key={extension.id}
                    className="rounded border border-[var(--border)] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">
                        {extension.name}
                      </span>
                      <BiomeBadge biome={extension.biome} />
                    </div>
                    <div className="mt-2">
                      <IngredientList
                        lines={extension.buildCost}
                        indexes={indexes}
                        compact
                        emptyText={t('station.noBuildMaterials')}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-[var(--faint)]">
                {hiddenExtensions > 0
                  ? t('station.noExtensionsHidden')
                  : t('station.noExtensions')}
              </p>
            )}
            {hiddenExtensions > 0 && extensions.length > 0 ? (
              <p className="mt-2 text-[0.68rem] text-[var(--faint)]">
                {t('station.hiddenExtensions', { count: hiddenExtensions })}
              </p>
            ) : null}
          </section>

          <section className="card p-4">
            <h2 className="font-display text-lg">{t('station.notesTitle')}</h2>
            <p className="mt-2 text-[0.68rem] leading-relaxed text-[var(--faint)]">
              {t('station.notesBody')}
            </p>
            <Link
              to="/"
              hash="stations"
              className="mt-3 inline-block text-xs text-[var(--gold-soft)] hover:underline"
            >
              {t('station.compareStations')}
            </Link>
          </section>
        </aside>
      </div>

      <StationRecipeDetails recipes={recipes} indexes={indexes} />
    </div>
  )
}

function StationRecipeDetails({
  recipes,
  indexes,
}: {
  recipes: Recipe[]
  indexes: Indexes
}) {
  const { t } = useTranslation()

  if (recipes.length === 0) return null

  return (
    <details className="card mt-5 p-4">
      <summary className="cursor-pointer font-display text-lg">
        {t('station.overviewTitle')}
      </summary>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <div key={recipe.id}>
            <Link
              to="/item/$id"
              params={{ id: recipe.itemId }}
              className="flex items-center gap-2 text-xs font-semibold hover:text-[var(--gold-soft)]"
            >
              <ItemIcon icon={itemIconFor(indexes, recipe.itemId)} size="xs" />
              {recipe.name}
            </Link>
            <div className="mt-1">
              <IngredientList
                lines={recipe.ingredients}
                indexes={indexes}
                compact
              />
            </div>
          </div>
        ))}
      </div>
    </details>
  )
}
