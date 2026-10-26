import { useMemo } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
          {t('calculator.eyebrow')}
        </p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">
          {t('calculator.title')}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          {t('calculator.description')}
        </p>
      </div>

      <section className="card mt-6 p-4">
        <label className="text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
          {t('calculator.chooseItem')}
        </label>
        <div className="mt-2">
          <ItemPicker
            entries={craftable}
            onSelect={select}
            placeholder={t('calculator.searchPlaceholder')}
          />
        </div>
        <p className="mt-2 text-[0.68rem] text-[var(--faint)]">
          {t('calculator.onlyVisible', {
            biome:
              selection === 'all'
                ? t('home.allBiomes')
                : formatBiome(selection),
          })}
        </p>
      </section>

      {quickPicks.length > 0 ? (
        <section className="mt-4">
          <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-[var(--faint)] uppercase">
            {t('calculator.quickPicks')}
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
              {t('calculator.hiddenTitle')}
            </p>
            <p className="mt-2 text-xs text-[var(--faint)]">
              {t('calculator.hiddenBody')}
            </p>
          </div>
        ) : itemId ? (
          <div className="card p-8 text-center">
            <p className="font-display text-xl">
              {entry
                ? t('calculator.notCraftable')
                : t('calculator.notFound')}
            </p>
            <p className="mt-2 text-xs text-[var(--faint)]">
              {entry
                ? t('calculator.notCraftableBody')
                : t('calculator.notFoundBody')}
            </p>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="font-display text-xl">{t('calculator.pickTitle')}</p>
            <p className="mt-2 text-xs text-[var(--faint)]">
              {t('calculator.pickBody')}
            </p>
          </div>
        )}
      </div>

      <section className="card mt-6 p-4">
        <h2 className="font-display text-lg">{t('calculator.howTitle')}</h2>
        <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[var(--muted)]">
          <li>
            <span className="text-[var(--text)]">
              {t('calculator.baseCraftLabel')}
            </span>{' '}
            {t('calculator.baseCraftBody')}
          </li>
          <li>
            <span className="text-[var(--text)]">
              {t('calculator.upgradeDeltaLabel')}
            </span>{' '}
            {t('calculator.upgradeDeltaBody')}
          </li>
          <li>
            <span className="text-[var(--text)]">
              {t('calculator.rawRollupLabel')}
            </span>{' '}
            {t('calculator.rawRollupBody')}
          </li>
          <li>
            <span className="text-[var(--text)]">
              {t('calculator.stationLevelLabel')}
            </span>{' '}
            {t('calculator.stationLevelBody')}
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
  const { t } = useTranslation()
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
            <Badge>
              {t('calculator.selected.station', { station: entry.stationName })}
            </Badge>
          ) : null}
          {entry.recipe?.canUpgrade ? (
            <Badge>
              {t('calculator.selected.upToLevel', {
                level: maxLevelFor(entry.recipe),
              })}
            </Badge>
          ) : null}
        </div>
      </div>
      <button type="button" className="btn btn-ghost text-xs" onClick={onClear}>
        {t('common.clear')}
      </button>
    </div>
  )
}
