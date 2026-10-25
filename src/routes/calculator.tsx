import { useMemo } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import type { CatalogEntry, Indexes } from '../lib/dataset'
import { itemIconFor, visibleEntries } from '../lib/dataset'
import { useDataset, useBiomeVisibility } from '../lib/dataset-context'
import { formatBiome, formatCategory, formatSubcategory } from '../lib/format'
import { maxLevelFor } from '../lib/calculator'
import { ItemPicker } from '../components/calculator/ItemPicker'
import { CalculatorPanel } from '../components/calculator/CalculatorPanel'
import { ItemIcon } from '../components/ui/ItemIcon'
import { Badge, BiomeBadge } from '../components/ui/Badge'

export const Route = createFileRoute('/calculator')({
  validateSearch: (search: Record<string, unknown>): { item?: string } => ({
    item: typeof search.item === 'string' ? search.item : undefined,
  }),
  component: CalculatorPage,
})

function CalculatorPage() {
  const { item: itemId } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { indexes } = useDataset()
  const { selection, isVisible } = useBiomeVisibility()

  const visible = useMemo(
    () => visibleEntries(indexes.catalogEntries, selection, indexes.biomeRank),
    [indexes, selection],
  )
  const craftable = useMemo(
    () => visible.filter((entry) => entry.recipe),
    [visible],
  )
  const entry = itemId ? indexes.entriesById.get(itemId) : undefined
  const isHidden = Boolean(entry && !isVisible(entry.biome))
  const recipe = entry && !isHidden && entry.recipe ? entry.recipe : undefined

  const quickPicks = useMemo(
    () =>
      craftable
        .filter((item) => item.recipe?.canUpgrade)
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 6),
    [craftable],
  )

  function select(id: string) {
    void navigate({ search: { item: id } })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="max-w-2xl">
        <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-[var(--gold)] uppercase">
          Material calculator
        </p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">
          From your current quality to the target.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Pick a craftable item. Starting from “Not crafted” counts the base
          recipe and then every upgrade delta; starting above level 1 counts
          only what is still missing. Toggle raw materials to roll intermediate
          crafts into their base ingredients.
        </p>
      </div>

      <section className="card mt-6 p-4">
        <label className="text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
          Choose an item
        </label>
        <div className="mt-2">
          <ItemPicker
            entries={craftable}
            onSelect={select}
            placeholder="Search a craftable item…"
          />
        </div>
        <p className="mt-2 text-[0.68rem] text-[var(--faint)]">
          Only visible, craftable entries are listed. Biome gate:{' '}
          {selection === 'all' ? 'all biomes' : formatBiome(selection)}.
        </p>
      </section>

      {quickPicks.length > 0 ? (
        <section className="mt-4">
          <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-[var(--faint)] uppercase">
            Quick picks
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {quickPicks.map((quick) => (
              <button
                key={quick.itemId}
                type="button"
                className="chip"
                onClick={() => select(quick.itemId)}
              >
                <ItemIcon icon={quick.icon} size="xs" />
                {quick.name}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6">
        {recipe && entry ? (
          <>
            <SelectedItem
              entry={entry}
              indexes={indexes}
              onClear={() => void navigate({ search: {} })}
            />
            <div className="mt-4">
              <CalculatorPanel
                key={recipe.id}
                recipe={recipe}
                indexes={indexes}
                initialCurrent={recipe.upgradeOnly ? 1 : 0}
                initialTarget={maxLevelFor(recipe)}
              />
            </div>
          </>
        ) : isHidden && entry ? (
          <div className="card p-8 text-center">
            <p className="font-display text-3xl text-[var(--gold-soft)]">ᛟ</p>
            <p className="mt-2 font-display text-xl">
              This item is hidden by your spoiler gate.
            </p>
            <p className="mt-2 text-xs text-[var(--faint)]">
              Raise your progress in the header selector to use it in the
              calculator.
            </p>
          </div>
        ) : itemId ? (
          <div className="card p-8 text-center">
            <p className="font-display text-xl">
              {entry ? 'This item is not craftable.' : 'Item not found.'}
            </p>
            <p className="mt-2 text-xs text-[var(--faint)]">
              {entry
                ? 'It is a raw material or a station-only item. Pick a craftable item above.'
                : 'That id is not part of the loaded dataset.'}
            </p>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="font-display text-xl">Pick a target above.</p>
            <p className="mt-2 text-xs text-[var(--faint)]">
              The calculator will show base craft materials, each upgrade delta,
              and the raw-material rollup.
            </p>
          </div>
        )}
      </div>

      <section className="card mt-6 p-4">
        <h2 className="font-display text-lg">How the numbers work</h2>
        <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[var(--muted)]">
          <li>
            <span className="text-[var(--text)]">Base craft:</span> quality 1
            costs. Multiple items round up to full crafting batches.
          </li>
          <li>
            <span className="text-[var(--text)]">Upgrade delta:</span> each
            level above the current quality adds only the per-level materials,
            not the base recipe again.
          </li>
          <li>
            <span className="text-[var(--text)]">Raw rollup:</span> intermediate
            crafts are recursively converted into raw materials. Cycles are
            guarded.
          </li>
          <li>
            <span className="text-[var(--text)]">Station level:</span> the
            highest target quality sets the required station upgrade level.
          </li>
        </ul>
      </section>
    </div>
  )
}

function SelectedItem({
  entry,
  indexes,
  onClear,
}: {
  entry: CatalogEntry
  indexes: Indexes
  onClear: () => void
}) {
  return (
    <div className="card flex flex-wrap items-center gap-3 p-4">
      <ItemIcon icon={itemIconFor(indexes, entry.itemId)} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/item/$id"
            params={{ id: entry.itemId }}
            className="font-display text-xl hover:text-[var(--gold-soft)]"
          >
            {entry.name}
          </Link>
          <BiomeBadge biome={entry.biome} />
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Badge>{formatCategory(entry.category)}</Badge>
          {entry.subcategory ? (
            <Badge>{formatSubcategory(entry.subcategory)}</Badge>
          ) : null}
          {entry.stationName ? (
            <Badge>Station: {entry.stationName}</Badge>
          ) : null}
          {entry.recipe?.canUpgrade ? (
            <Badge>Up to level {maxLevelFor(entry.recipe)}</Badge>
          ) : null}
        </div>
      </div>
      <button type="button" className="btn btn-ghost text-xs" onClick={onClear}>
        Clear
      </button>
    </div>
  )
}
