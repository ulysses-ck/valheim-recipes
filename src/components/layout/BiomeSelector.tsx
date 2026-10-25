import { useTranslation } from 'react-i18next'
import { formatBiome } from '../../lib/format'
import { useBiomeVisibility } from '../../lib/dataset-context'
import type { BiomeSelection } from '../../stores/biome'

export function BiomeSelector() {
  const { t } = useTranslation()
  const { selection, setBiome, biomes } = useBiomeVisibility()

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="biome-select"
        className="hidden text-[0.68rem] font-semibold tracking-[0.16em] text-[var(--faint)] uppercase sm:block"
      >
        {t('biome.label')}
      </label>
      <select
        id="biome-select"
        className="input w-auto cursor-pointer border-[var(--border-strong)] bg-[var(--surface-2)] py-1.5 pr-7 pl-3 text-xs font-semibold"
        value={selection}
        title={t('biome.hint')}
        onChange={(event) => setBiome(event.target.value as BiomeSelection)}
      >
        <option value="all">{t('biome.all')}</option>
        {[...biomes]
          .sort((a, b) => a.rank - b.rank)
          .map((biome) => (
            <option key={biome.id} value={biome.id}>
              {formatBiome(biome.id)}
            </option>
          ))}
      </select>
    </div>
  )
}
