import { useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { CatalogEntry, Indexes } from '../lib/dataset'
import { maxVisibleLevel, visibleEntries } from '../lib/dataset'
import type { Recipe } from '../lib/types'
import { useDataset, useBiomeVisibility } from '../lib/dataset-context'
import { formatBiome } from '../lib/format'
import type { PlanEntry } from '../lib/calculator'
import { usePlanStore } from '../stores/plan'
import presetsJson from '../data/presets.json'
import { ItemPicker } from '../components/calculator/ItemPicker'
import { PlanPanel } from '../components/calculator/PlanPanel'
import { ItemIcon } from '../components/ui/ItemIcon'

interface Preset {
  id: string
  group: 'armor' | 'loadout'
  itemIds: string[]
  defaultTarget?: number
}

const presets = presetsJson as Preset[]

export const Route = createFileRoute('/calculator')({
  validateSearch: (search: Record<string, unknown>): { item?: string } => ({
    item: typeof search.item === 'string' ? search.item : undefined,
  }),
  component: CalculatorPage,
})

function planEntryFor(
  itemId: string,
  indexes: Indexes,
  maxLevel: (recipe: Recipe) => number,
): PlanEntry | undefined {
  const recipe = indexes.primaryRecipeByItemId.get(itemId)
  if (!recipe) return undefined
  const maximum = Math.max(1, maxLevel(recipe))
  return {
    itemId,
    current: recipe.upgradeOnly ? 1 : 0,
    target: maximum,
    quantity: 1,
  }
}

function CalculatorPage() {
  const { t } = useTranslation()
  const { item: itemId } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { indexes } = useDataset()
  const { selection } = useBiomeVisibility()
  const entries = usePlanStore((state) => state.entries)
  const addItem = usePlanStore((state) => state.addItem)
  const addMany = usePlanStore((state) => state.addMany)
  const update = usePlanStore((state) => state.update)
  const remove = usePlanStore((state) => state.remove)
  const clear = usePlanStore((state) => state.clear)

  const maxLevel = useMemo(
    () => (recipe: Recipe) =>
      maxVisibleLevel(recipe, indexes, selection),
    [indexes, selection],
  )

  const visible = useMemo(
    () => visibleEntries(indexes.catalogEntries, selection, indexes.biomeRank),
    [indexes, selection],
  )
  const craftable = useMemo(
    () => visible.filter((entry) => entry.recipe),
    [visible],
  )

  useEffect(() => {
    if (!itemId) return
    const entry = planEntryFor(itemId, indexes, maxLevel)
    if (entry) addItem(entry)
    void navigate({ search: {}, replace: true })
  }, [addItem, indexes, itemId, maxLevel, navigate])

  const quickPicks = useMemo(
    () =>
      craftable
        .filter((item) => item.recipe?.canUpgrade)
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 6),
    [craftable],
  )

  const availablePresets = useMemo(() => {
    const visibleIds = new Set(craftable.map((entry) => entry.itemId))
    return presets.filter((preset) =>
      preset.itemIds.every((id) => visibleIds.has(id)),
    )
  }, [craftable])

  function select(entry: CatalogEntry) {
    const next = planEntryFor(entry.itemId, indexes, maxLevel)
    if (next) addItem(next)
  }

  function addPreset(preset: Preset) {
    const next = preset.itemIds
      .map((id) => planEntryFor(id, indexes, maxLevel))
      .filter((entry): entry is PlanEntry => Boolean(entry))
      .map((entry) => ({
        ...entry,
        target: Math.min(entry.target, preset.defaultTarget ?? entry.target),
      }))
    addMany(next)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
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
            onSelect={(id) => {
              const entry = craftable.find((item) => item.itemId === id)
              if (entry) select(entry)
            }}
            placeholder={t('calculator.searchPlaceholder')}
            keepOpen
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

      {availablePresets.length > 0 ? (
        <section className="mt-4">
          <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-[var(--faint)] uppercase">
            {t('calculator.plan.presets')}
          </p>
          <p className="mt-1 text-[0.68rem] text-[var(--faint)]">
            {t('calculator.plan.presetsHint')}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {availablePresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="chip"
                onClick={() => addPreset(preset)}
              >
                {t(`calculator.plan.presetNames.${preset.id}`)}
              </button>
            ))}
          </div>
        </section>
      ) : null}

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
                onClick={() => select(quick)}
              >
                <ItemIcon icon={quick.icon} size="xs" />
                {quick.name}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6">
        <PlanPanel
          entries={entries}
          indexes={indexes}
          onUpdate={update}
          onRemove={remove}
          onClear={clear}
        />
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
