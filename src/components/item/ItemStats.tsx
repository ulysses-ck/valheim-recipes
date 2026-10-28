import { useTranslation } from 'react-i18next'
import type { DamageType, ItemStats as Stats } from '../../lib/types'
import { formatNumber } from '../../lib/format'

const DAMAGE_ORDER: DamageType[] = [
  'slash',
  'pierce',
  'blunt',
  'fire',
  'frost',
  'lightning',
  'poison',
  'spirit',
  'chop',
  'pickaxe',
]

type Row = { key: string; label: string; value: string }

const STAT_TONE: Record<string, string> = {
  health: 'stat-health',
  stamina: 'stat-stamina',
  foodStamina: 'stat-stamina',
  eitr: 'stat-eitr',
}

function useStatRows(stats: Stats): Row[] {
  const { t } = useTranslation()
  const rows: Row[] = []
  const add = (key: keyof Stats, value?: string) => {
    if (value === undefined) return
    rows.push({ key, label: t(`stats.${key}`), value })
  }
  const num = (value: number) => formatNumber(value)
  const seconds = (value: number) =>
    t('stats.seconds', { value: formatNumber(value) })

  if (stats.damage) {
    const parts = DAMAGE_ORDER.filter((type) => stats.damage?.[type]).map(
      (type) =>
        `${t(`stats.damageTypes.${type}`)} ${formatNumber(stats.damage?.[type] ?? 0)}`,
    )
    if (parts.length > 0) add('damage', parts.join(' · '))
  }
  if (stats.armor !== undefined) add('armor', num(stats.armor))
  if (stats.blockArmor !== undefined) add('blockArmor', num(stats.blockArmor))
  if (stats.durability !== undefined) add('durability', num(stats.durability))
  if (stats.health !== undefined) add('health', num(stats.health))
  if (stats.foodStamina !== undefined)
    add('foodStamina', num(stats.foodStamina))
  if (stats.eitr !== undefined) add('eitr', num(stats.eitr))
  if (stats.regen !== undefined)
    add(
      'regen',
      stats.regen < 0
        ? t('stats.percent', { value: formatNumber(stats.regen) })
        : num(stats.regen),
    )
  if (stats.duration !== undefined) add('duration', seconds(stats.duration))
  if (stats.cooldown !== undefined) add('cooldown', seconds(stats.cooldown))
  if (stats.stamina !== undefined) add('stamina', num(stats.stamina))
  if (stats.knockback !== undefined) add('knockback', num(stats.knockback))
  if (stats.attackForce !== undefined)
    add('attackForce', num(stats.attackForce))
  if (stats.backstabBonus !== undefined)
    add('backstabBonus', num(stats.backstabBonus))
  if (stats.weight !== undefined) add('weight', num(stats.weight))
  if (stats.movement !== undefined)
    add(
      'movement',
      t('stats.percent', {
        value: formatNumber(Math.round(stats.movement * 100)),
      }),
    )
  if (stats.stack !== undefined) add('stack', num(stats.stack))
  if (stats.effect) add('effect', stats.effect)
  return rows
}

export function ItemStats({ stats }: { stats: Stats }) {
  const { t } = useTranslation()
  const rows = useStatRows(stats)
  if (rows.length === 0) return null

  return (
    <section className="card p-4">
      <h2 className="font-display text-lg">{t('item.statsTitle')}</h2>
      <dl className="mt-3 space-y-2 text-xs">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex items-baseline justify-between gap-3"
          >
            <dt className="text-[var(--faint)]">{row.label}</dt>
            <dd
              className={`text-right ${STAT_TONE[row.key] ?? 'text-[var(--muted)]'}`}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function StatSummary({ stats }: { stats: Stats }) {
  const rows = useStatRows(stats)
  const summary = rows.slice(0, 3)
  if (summary.length === 0) return null

  return (
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.68rem] text-[var(--faint)]">
      {summary.map((row) => (
        <span key={row.key}>
          <span>{row.label}</span>{' '}
          <span
            className={`font-mono ${STAT_TONE[row.key] ?? 'text-[var(--muted)]'}`}
          >
            {row.value}
          </span>
        </span>
      ))}
    </div>
  )
}
