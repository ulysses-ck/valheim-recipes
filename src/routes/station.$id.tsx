import { useMemo } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
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
          <p className="font-display text-2xl">Station not found</p>
          <Link to="/" className="btn mt-5">
            Back to catalog
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
            This station is hidden by your spoiler gate.
          </p>
          <p className="mt-2 text-xs text-[var(--faint)]">
            Raise your progress in the biome selector to reveal it. Nothing
            about this station is shown while it is outside{' '}
            {selection === 'all' ? 'the gate' : formatBiome(selection)}.
          </p>
          <Link to="/" className="btn mt-5">
            Back to catalog
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
          Catalog
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
          Open calculator
        </Link>
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-2xl">Recipes</h2>
              <p className="mt-1 text-xs text-[var(--faint)]">
                Items crafted at {station.name}. Biome-gated entries are
                omitted.
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
                No visible recipes at this station.
              </p>
              <p className="mt-1 text-xs text-[var(--faint)]">
                Either the station has no recipes or they are above your
                selected biome.
              </p>
            </div>
          )}

          {stationRecipes.length > recipes.length ? (
            <p className="mt-3 text-[0.68rem] text-[var(--faint)]">
              {stationRecipes.length - recipes.length} hidden by the biome gate.
            </p>
          ) : null}
        </section>

        <aside className="space-y-5">
          <section className="card p-4">
            <h2 className="font-display text-lg">Build cost</h2>
            <p className="text-xs text-[var(--faint)]">
              Materials to place the station.
            </p>
            <div className="mt-3">
              <IngredientList
                lines={station.buildCost}
                indexes={indexes}
                emptyText="No build materials recorded."
              />
            </div>
          </section>

          <section className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg">Upgrade extensions</h2>
              <Badge>{extensions.length}</Badge>
            </div>
            <p className="mt-1 text-xs text-[var(--faint)]">
              Extensions raise the station's maximum crafting quality. Each
              extension is built once.
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
                        emptyText="No build materials recorded."
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-[var(--faint)]">
                {hiddenExtensions > 0
                  ? 'Every extension is hidden by your biome gate.'
                  : 'This station has no extensions.'}
              </p>
            )}
            {hiddenExtensions > 0 && extensions.length > 0 ? (
              <p className="mt-2 text-[0.68rem] text-[var(--faint)]">
                {pluralize(hiddenExtensions, 'extension')} hidden by the biome
                gate.
              </p>
            ) : null}
          </section>

          <section className="card p-4">
            <h2 className="font-display text-lg">Station notes</h2>
            <p className="mt-2 text-[0.68rem] leading-relaxed text-[var(--faint)]">
              Crafting quality is limited by the station level. The calculator
              reports the required level for the target quality, so you can
              check whether an extension is still missing.
            </p>
            <Link
              to="/"
              hash="stations"
              className="mt-3 inline-block text-xs text-[var(--gold-soft)] hover:underline"
            >
              Compare all stations
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
  if (recipes.length === 0) return null

  return (
    <details className="card mt-5 p-4">
      <summary className="cursor-pointer font-display text-lg">
        Recipe ingredient overview
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
