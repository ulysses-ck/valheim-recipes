import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { Indexes } from '../../lib/dataset'
import { itemIconFor, maxVisibleLevel } from '../../lib/dataset'
import { useBiomeVisibility } from '../../lib/dataset-context'
import type { PlanEntry, PlanEntryTotal } from '../../lib/calculator'
import { computePlan, maxLevelFor } from '../../lib/calculator'
import { formatBiome } from '../../lib/format'
import { Badge, BiomeBadge } from '../ui/Badge'
import { ItemIcon } from '../ui/ItemIcon'
import { CostTree } from '../recipe/CostBreakdown'
import { IngredientList } from '../recipe/IngredientList'

interface PlanPanelProps {
  entries: PlanEntry[]
  indexes: Indexes
  onUpdate: (itemId: string, patch: Partial<Omit<PlanEntry, 'itemId'>>) => void
  onRemove: (itemId: string) => void
  onClear: () => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(value)))
}

export function PlanPanel({
  entries,
  indexes,
  onUpdate,
  onRemove,
  onClear,
}: PlanPanelProps) {
  const { t } = useTranslation()
  const { selection, isVisible } = useBiomeVisibility()
  const [recursive, setRecursive] = useState(true)

  const visible = useMemo(
    () =>
      entries.filter((entry) => {
        const catalog = indexes.entriesById.get(entry.itemId)
        return Boolean(catalog && isVisible(catalog.biome))
      }),
    [entries, indexes.entriesById, isVisible],
  )
  const hiddenCount = entries.length - visible.length
  const plan = useMemo(
    () =>
      computePlan(visible, indexes, {
        recursive,
        maxLevel: (recipe) => maxVisibleLevel(recipe, indexes, selection),
      }),
    [indexes, recursive, selection, visible],
  )

  if (visible.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="font-display text-xl">{t('calculator.plan.emptyTitle')}</p>
        <p className="mt-2 text-xs text-[var(--faint)]">
          {t('calculator.plan.emptyBody')}
        </p>
        {hiddenCount > 0 ? (
          <p className="mt-3 text-[0.68rem] text-[var(--gold-soft)]">
            {t('calculator.plan.hiddenCount', { count: hiddenCount })}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg">
              {t('calculator.plan.title')}
            </h2>
            <p className="text-xs text-[var(--faint)]">
              {t('calculator.plan.subtitle')}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost px-2 py-1 text-[0.7rem]"
            onClick={onClear}
          >
            {t('calculator.plan.clear')}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-y border-[var(--border)] py-2 text-xs">
          <label className="flex cursor-pointer items-center gap-2 text-[var(--muted)]">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--gold)]"
              checked={recursive}
              onChange={(event) => setRecursive(event.target.checked)}
            />
            {t('calculator.panel.breakDown')}
          </label>
          <span className="text-[0.68rem] text-[var(--faint)]">
            {t('calculator.plan.itemCount', { count: plan.entries.length })}
            {hiddenCount > 0
              ? ` · ${t('calculator.plan.hiddenCount', { count: hiddenCount })}`
              : ''}
          </span>
        </div>

        <div className="space-y-3">
          {plan.entries.map((row) => (
            <PlanEntryCard
              key={row.entry.itemId}
              row={row}
              indexes={indexes}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          ))}
        </div>
      </div>

      <div className="card space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg">
            {recursive
              ? t('calculator.plan.rawMaterials')
              : t('calculator.plan.totalIngredients')}
          </h2>
          <span className="text-[0.68rem] text-[var(--faint)]">
            {t('calculator.plan.forItems', { count: plan.quantity })}
          </span>
        </div>
        <IngredientList
          lines={recursive ? plan.raw : plan.immediate}
          indexes={indexes}
        />
      </div>

      {plan.stations.filter((station) => station.stationId !== 'hand').length >
      0 ? (
        <div className="card p-4">
          <h2 className="font-display text-lg">
            {t('calculator.plan.stationsTitle')}
          </h2>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {plan.stations
              .filter((station) => station.stationId !== 'hand')
              .map((station) => (
                <li key={station.stationId}>
                  {indexes.stationsById.has(station.stationId) ? (
                    <Link
                      to="/station/$id"
                      params={{ id: station.stationId }}
                      className="badge hover:border-[var(--gold)] hover:text-[var(--gold-soft)]"
                    >
                      {t('calculator.panel.stationLevel', {
                        station: station.stationName,
                        level: station.level,
                      })}
                    </Link>
                  ) : (
                    <span className="badge">
                      {t('calculator.panel.stationLevel', {
                        station: station.stationName,
                        level: station.level,
                      })}
                    </span>
                  )}
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      {recursive ? (
        <details className="card group p-4">
          <summary className="cursor-pointer text-xs text-[var(--gold-soft)] hover:underline">
            {t('calculator.plan.showTree')}
          </summary>
          <div className="mt-3">
            <CostTree nodes={plan.tree} indexes={indexes} />
          </div>
        </details>
      ) : null}
    </div>
  )
}

function PlanEntryCard({
  row,
  indexes,
  onUpdate,
  onRemove,
}: {
  row: PlanEntryTotal
  indexes: Indexes
  onUpdate: PlanPanelProps['onUpdate']
  onRemove: PlanPanelProps['onRemove']
}) {
  const { t } = useTranslation()
  const { entry, recipe, total, maximum } = row
  const catalog = indexes.entriesById.get(entry.itemId)
  const minimum = recipe.upgradeOnly ? 1 : 0
  const canChooseLevels = recipe.canUpgrade && maximum > minimum
  const fullMaximum = maxLevelFor(recipe)
  const capped = maximum < fullMaximum

  function changeCurrent(next: number) {
    onUpdate(entry.itemId, {
      current: next,
      ...(entry.target <= next
        ? { target: Math.min(maximum, next + 1) }
        : {}),
    })
  }

  return (
    <section className="rounded-lg border border-[var(--border)] p-3">
      <div className="flex flex-wrap items-start gap-3">
        <ItemIcon icon={itemIconFor(indexes, entry.itemId)} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/item/$id"
              params={{ id: entry.itemId }}
              className="font-display text-base hover:text-[var(--gold-soft)]"
            >
              {recipe.name}
            </Link>
            <BiomeBadge biome={recipe.biome} />
            {capped ? (
              <Badge className="badge-gold">
                {t('calculator.plan.capped', { level: maximum })}
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 text-[0.66rem] text-[var(--faint)]">
            {t('calculator.selected.station', { station: recipe.stationName })}
            {catalog ? ` · ${formatBiome(catalog.biome)}` : ''}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost px-2 py-1 text-[0.68rem]"
          onClick={() => onRemove(entry.itemId)}
        >
          {t('calculator.plan.remove')}
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {canChooseLevels ? (
          <>
            <label className="block text-xs text-[var(--muted)]">
              {t('calculator.panel.currentQuality')}
              <select
                className="input mt-1"
                value={entry.current}
                onChange={(event) => changeCurrent(Number(event.target.value))}
              >
                {Array.from(
                  { length: Math.max(1, maximum - minimum) },
                  (_, index) => minimum + index,
                ).map((level) => (
                  <option key={level} value={level}>
                    {level === 0
                      ? t('calculator.panel.notCrafted')
                      : t('calculator.panel.level', { level })}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-[var(--muted)]">
              {t('calculator.panel.targetQuality')}
              <select
                className="input mt-1"
                value={entry.target}
                onChange={(event) =>
                  onUpdate(entry.itemId, {
                    target: clamp(
                      Number(event.target.value),
                      Math.max(1, entry.current),
                      maximum,
                    ),
                  })
                }
              >
                {Array.from(
                  { length: maximum - entry.current },
                  (_, index) => entry.current + 1 + index,
                ).map((level) => (
                  <option key={level} value={level}>
                    {t('calculator.panel.level', { level })}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
        <label className="block text-xs text-[var(--muted)]">
          {t('calculator.panel.quantity')}
          <input
            className="input mt-1"
            type="number"
            min={1}
            max={999}
            value={entry.quantity}
            onChange={(event) =>
              onUpdate(entry.itemId, {
                quantity: clamp(Number(event.target.value), 1, 999),
              })
            }
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {total.steps.map((step) => (
          <span key={step.key} className="badge">
            {step.key === 'base'
              ? t('calculator.panel.baseCrafts', { count: total.baseCrafts })
              : t('calculator.panel.upgradeTo', { level: step.level ?? '' })}
          </span>
        ))}
        <span className="badge badge-gold">
          {t('calculator.plan.entryItems', { count: entry.quantity })}
        </span>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-[0.7rem] text-[var(--gold-soft)] hover:underline">
          {t('calculator.plan.showBreakdown')}
        </summary>
        <div className="mt-2 space-y-2">
          {total.steps.length === 0 ? (
            <p className="text-xs text-[var(--faint)]">
              {t('calculator.panel.noMaterials')}
            </p>
          ) : (
            total.steps.map((step) => (
              <div key={step.key}>
                <p className="text-[0.65rem] font-semibold tracking-wide text-[var(--muted)] uppercase">
                  {step.key === 'base'
                    ? t('calculator.panel.baseCraft')
                    : t('calculator.panel.upgradeTo', {
                        level: step.level ?? '',
                      })}
                </p>
                <IngredientList
                  lines={step.lines.filter((line) => line.amount > 0)}
                  indexes={indexes}
                  compact
                />
              </div>
            ))
          )}
        </div>
      </details>
    </section>
  )
}
