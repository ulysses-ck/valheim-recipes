import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { maxVisibleLevel } from '../../lib/dataset'
import type { Indexes } from '../../lib/dataset'
import { useBiomeVisibility } from '../../lib/dataset-context'
import type { Recipe } from '../../lib/types'
import {
  aggregateRaw,
  buildCostTree,
  computeTotal,
  maxLevelFor,
  requiredStationLevel,
} from '../../lib/calculator'
import { Badge } from '../ui/Badge'
import { CostTree } from '../recipe/CostBreakdown'
import { IngredientList } from '../recipe/IngredientList'

interface CalculatorPanelProps {
  recipe: Recipe
  indexes: Indexes
  initialCurrent?: number
  initialTarget?: number
  initialQuantity?: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(value)))
}

export function CalculatorPanel({
  recipe,
  indexes,
  initialCurrent,
  initialTarget,
  initialQuantity,
}: CalculatorPanelProps) {
  const { t } = useTranslation()
  const { selection } = useBiomeVisibility()
  const maximum = maxVisibleLevel(recipe, indexes, selection)
  const fullMaximum = maxLevelFor(recipe)
  const capped = maximum < fullMaximum
  const minimum = recipe.upgradeOnly ? 1 : 0
  const startCurrent = clamp(
    initialCurrent ?? minimum,
    minimum,
    Math.max(minimum, maximum - 1),
  )
  const startTarget = clamp(
    initialTarget ?? Math.min(maximum, Math.max(1, startCurrent + 1)),
    Math.max(1, startCurrent),
    maximum,
  )

  const [current, setCurrent] = useState(startCurrent)
  const [target, setTarget] = useState(startTarget)
  const [quantity, setQuantity] = useState(initialQuantity ?? 1)
  const [recursive, setRecursive] = useState(true)

  const total = useMemo(
    () => computeTotal(recipe, { current, target, quantity }),
    [current, quantity, recipe, target],
  )
  const tree = useMemo(
    () =>
      buildCostTree(total.immediate, indexes, {
        recursive,
      }),
    [indexes, recursive, total.immediate],
  )
  const raw = useMemo(() => aggregateRaw(tree), [tree])

  const station = indexes.stationsById.get(recipe.stationId)
  const stationLevel = requiredStationLevel(recipe, total.target)
  const canChooseLevels = recipe.canUpgrade && maximum > minimum

  function changeCurrent(next: number) {
    setCurrent(next)
    if (target <= next) setTarget(Math.min(maximum, next + 1))
  }

  return (
    <div className="card space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg">
            {t('calculator.panel.title')}
          </h2>
          <p className="text-xs text-[var(--faint)]">
            {t('calculator.panel.subtitle')}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost px-2 py-1 text-[0.7rem]"
          onClick={() => {
            setCurrent(startCurrent)
            setTarget(startTarget)
            setQuantity(initialQuantity ?? 1)
            setRecursive(true)
          }}
        >
          {t('calculator.panel.reset')}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {canChooseLevels ? (
          <>
            <label className="block text-xs text-[var(--muted)]">
              {t('calculator.panel.currentQuality')}
              <select
                className="input mt-1"
                value={current}
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
                value={target}
                onChange={(event) => setTarget(Number(event.target.value))}
              >
                {Array.from(
                  { length: maximum - current },
                  (_, index) => current + 1 + index,
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
            value={quantity}
            onChange={(event) =>
              setQuantity(clamp(Number(event.target.value), 1, 999))
            }
          />
        </label>
      </div>

      {recipe.upgradeOnly ? (
        <p className="rounded border border-[rgba(217,164,65,0.25)] bg-[rgba(217,164,65,0.06)] px-3 py-2 text-xs text-[var(--gold-soft)]">
          {t('calculator.panel.upgradeOnlyNote')}
        </p>
      ) : null}

      {capped ? (
        <p className="rounded border border-[rgba(217,164,65,0.25)] bg-[rgba(217,164,65,0.06)] px-3 py-2 text-xs text-[var(--gold-soft)]">
          {t('calculator.panel.cappedNote', { level: maximum })}
        </p>
      ) : null}

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
        {station ? (
          <Link
            to="/station/$id"
            params={{ id: station.id }}
            className="text-[var(--gold-soft)] hover:underline"
          >
            {t('calculator.panel.stationLevel', {
              station: station.name,
              level: stationLevel,
            })}
          </Link>
        ) : (
          <span className="text-[var(--faint)]">
            {t('calculator.panel.stationLevel', {
              station: recipe.stationName,
              level: stationLevel,
            })}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {total.steps.length === 0 ? (
          <p className="text-xs text-[var(--faint)]">
            {t('calculator.panel.noMaterials')}
          </p>
        ) : (
          total.steps.map((step) => (
            <section key={step.key}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
                  {step.key === 'base'
                    ? t('calculator.panel.baseCraft')
                    : t('calculator.panel.upgradeTo', {
                        level: step.level ?? '',
                      })}
                </h3>
                <Badge>
                  {step.key === 'base'
                    ? t('calculator.panel.baseCrafts', {
                        count: total.baseCrafts,
                      })
                    : t('calculator.panel.stationLevelBadge', {
                        level: step.stationLevel,
                      })}
                </Badge>
              </div>
              <IngredientList
                lines={step.lines.filter((line) => line.amount > 0)}
                indexes={indexes}
              />
            </section>
          ))
        )}
      </div>

      <section className="border-t border-[var(--border)] pt-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-base">
            {recursive
              ? t('calculator.panel.rawMaterials')
              : t('calculator.panel.totalIngredients')}
          </h3>
          <span className="text-[0.68rem] text-[var(--faint)]">
            {t('calculator.panel.forItems', { count: total.quantity })}
          </span>
        </div>
        <IngredientList
          lines={recursive ? raw : total.immediate}
          indexes={indexes}
        />
      </section>

      {recursive ? (
        <details className="group">
          <summary className="cursor-pointer text-xs text-[var(--gold-soft)] hover:underline">
            {t('calculator.panel.showTree')}
          </summary>
          <div className="mt-2">
            <CostTree nodes={tree} indexes={indexes} />
          </div>
        </details>
      ) : null}

      <p className="text-[0.66rem] leading-relaxed text-[var(--faint)]">
        {t('calculator.panel.batchesNote')}
      </p>
    </div>
  )
}
