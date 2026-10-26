import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { BiomeSelector } from './BiomeSelector'
import { LanguageSelector } from './LanguageSelector'

const navLinkClass =
  'rounded px-2 py-1 text-[var(--muted)] transition-colors hover:text-[var(--text)]'

export function SiteHeader() {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(9,13,11,0.86)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(217,164,65,0.5)] bg-[rgba(217,164,65,0.12)] font-display text-lg text-[var(--gold-soft)]"
              aria-hidden="true"
            >
              ᚱ
            </span>
            <span className="font-display text-lg tracking-tight text-[var(--text)]">
              Valheim Recipes
            </span>
          </Link>
          <div className="flex items-center gap-1.5 sm:hidden">
            <LanguageSelector />
            <BiomeSelector />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <nav
            aria-label={t('nav.main')}
            className="flex flex-wrap items-center gap-0.5 text-sm"
          >
            <Link
              to="/"
              activeOptions={{ exact: true }}
              className={navLinkClass}
              activeProps={{ className: 'text-[var(--gold-soft)]' }}
            >
              {t('nav.recipes')}
            </Link>
            <Link
              to="/calculator"
              className={navLinkClass}
              activeProps={{ className: 'text-[var(--gold-soft)]' }}
            >
              {t('nav.calculator')}
            </Link>
            <Link
              to="/"
              hash="stations"
              className={navLinkClass}
              activeProps={{ className: 'text-[var(--gold-soft)]' }}
            >
              {t('nav.stations')}
            </Link>
            {import.meta.env.DEV ? (
              <Link
                to="/admin"
                className={navLinkClass}
                activeProps={{ className: 'text-[var(--gold-soft)]' }}
              >
                {t('nav.admin')}
              </Link>
            ) : null}
          </nav>
          <div className="hidden items-center gap-2 sm:flex">
            <LanguageSelector />
            <BiomeSelector />
          </div>
        </div>
      </div>
    </header>
  )
}
