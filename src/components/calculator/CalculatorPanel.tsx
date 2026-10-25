import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { Indexes } from '../../lib/dataset'
import type { Recipe } from '../../lib/types'
import {
  aggregateRaw,
  buildCostTree,
  computeTotal,
  maxLevelFor,
  requiredStationLevel,
} from '../../lib/calculator'
import { pluralize } from '../../lib/format'
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
  const maximum = maxLevelFor(recipe)
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
  const canChooseLevels = recipe.canUpgrade

  function changeCurrent(next: number) {
    setCurrent(next)
    if (target <= next) setTarget(Math.min(maximum, next + 1))
  }

  return (
    <div className="card space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg">Material calculator</h2>
          <p className="text-xs text-[var(--faint)]">
            Base craft plus upgrade deltas. Upgrade costs apply per item.
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
          Reset
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {canChooseLevels ? (
          <>
            <label className="block text-xs text-[var(--muted)]">
              Current quality
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
                    {level === 0 ? 'Not crafted' : `Level ${level}`}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs text-[var(--muted)]">
              Target quality
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
                    Level {level}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        <label className="block text-xs text-[var(--muted)]">
          Quantity
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
          This is an upgrade-only recipe. The base item is obtained elsewhere,
          so only upgrade materials are counted.
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
          Break down to raw materials
        </label>
        {station ? (
          <Link
            to="/station/$id"
            params={{ id: station.id }}
            className="text-[var(--gold-soft)] hover:underline"
          >
            {station.name} · level {stationLevel}
          </Link>
        ) : (
          <span className="text-[var(--faint)]">
            {recipe.stationName} · level {stationLevel}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {total.steps.length === 0 ? (
          <p className="text-xs text-[var(--faint)]">
            No materials needed for this selection.
          </p>
        ) : (
          total.steps.map((step) => (
            <section key={step.key}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
                  {step.label}
                </h3>
                <Badge>
                  {step.label === 'Base craft'
                    ? `${total.baseCrafts} craft${total.baseCrafts === 1 ? '' : 's'}`
                    : `station level ${step.stationLevel}`}
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
            {recursive ? 'Raw materials' : 'Total ingredients'}
          </h3>
          <span className="text-[0.68rem] text-[var(--faint)]">
            For {pluralize(total.quantity, 'item')}
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
            Show crafting tree
          </summary>
          <div className="mt-2">
            <CostTree nodes={tree} indexes={indexes} />
          </div>
        </details>
      ) : null}

      <p className="text-[0.66rem] leading-relaxed text-[var(--faint)]">
        Batches round up: if an ingredient is crafted in batches, the tree
        counts the full batch. Upgrade ingredients are the per-level delta from
        the current quality to the target.
      </p>
    </div>
  )
}
