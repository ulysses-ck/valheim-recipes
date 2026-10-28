import { Link, useLocation } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Badge } from '../ui/Badge'

export function NotFoundPage() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
      <div className="card relative overflow-hidden p-8 text-center sm:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(420px_220px_at_50%_0%,rgba(143,191,98,0.14),transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -bottom-14 font-display text-[11rem] leading-none text-[var(--gold)] opacity-[0.06] sm:text-[15rem]"
        >
          ᛟ
        </div>

        <div className="relative">
          <Badge className="badge-gold">{t('notFound.badge')}</Badge>
          <p className="mt-5 font-display text-6xl leading-none text-[var(--gold-soft)] sm:text-7xl">
            404
          </p>
          <h1 className="mt-4 font-display text-3xl text-balance sm:text-4xl">
            {t('notFound.title')}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
            {t('notFound.body')}
          </p>

          <p className="mx-auto mt-4 max-w-full truncate font-mono text-xs text-[var(--faint)]">
            <span className="sr-only">{t('notFound.pathLabel')}: </span>
            <code>{pathname}</code>
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <Link to="/" className="btn btn-primary">
              {t('notFound.backCatalog')}
            </Link>
            <Link to="/calculator" className="btn">
              {t('notFound.openCalculator')}
            </Link>
          </div>

          <p className="mt-6 text-[0.68rem] text-[var(--faint)]">
            {t('notFound.hint')}
          </p>
        </div>
      </div>
    </div>
  )
}
