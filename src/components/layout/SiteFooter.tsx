import { useTranslation } from 'react-i18next'
import { useDataset } from '../../lib/dataset-context'
import { formatDate, pluralize } from '../../lib/format'

export function SiteFooter() {
  const { t } = useTranslation()
  const { dataset } = useDataset()

  return (
    <footer className="mt-20 border-t border-[var(--border)] bg-[rgba(0,0,0,0.18)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-base text-[var(--gold-soft)]">
              ᚱ
            </span>
            <span className="font-display text-base">Valheim Recipes</span>
          </div>
          <p className="mt-3 max-w-xl text-xs leading-relaxed text-[var(--faint)]">
            {t('footer.disclaimer')}
          </p>
          <p className="mt-2 text-xs text-[var(--faint)]">
            {t('footer.attribution')}
          </p>
        </div>

        <div className="text-xs text-[var(--muted)]">
          <p>
            {pluralize(dataset.recipes.length, 'recipe')} ·{' '}
            {pluralize(dataset.items.length, 'item')} ·{' '}
            {pluralize(dataset.stations.length, 'station')}
          </p>
          <p className="mt-1 text-[var(--faint)]">
            Dataset updated {formatDate(dataset.meta.generatedAt)}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              className="underline decoration-[var(--border-strong)] underline-offset-2 hover:text-[var(--text)]"
              href="https://valheimcheats.com"
              target="_blank"
              rel="noreferrer"
            >
              valheimcheats.com
            </a>
            <a
              className="underline decoration-[var(--border-strong)] underline-offset-2 hover:text-[var(--text)]"
              href="https://valheim.fandom.com/wiki/Valheim_Wiki"
              target="_blank"
              rel="noreferrer"
            >
              Valheim Wiki
            </a>
            <a
              className="underline decoration-[var(--border-strong)] underline-offset-2 hover:text-[var(--text)]"
              href="https://github.com/ulysses-ck/valheim-recipes"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
