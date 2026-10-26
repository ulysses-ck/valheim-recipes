import { useTranslation } from 'react-i18next'
import { useLocaleStore } from '../../stores/locale'
import type { Locale } from '../../stores/locale'

export function LanguageSelector() {
  const { t } = useTranslation()
  const locale = useLocaleStore((state) => state.locale)
  const setLocale = useLocaleStore((state) => state.setLocale)

  return (
    <label className="flex items-center gap-1.5">
      <span className="sr-only">{t('language.label')}</span>
      <select
        className="input w-auto cursor-pointer border-[var(--border-strong)] bg-[var(--surface-2)] py-1.5 pr-7 pl-2 text-xs font-semibold"
        value={locale}
        title={t('language.label')}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        <option value="es">ES</option>
        <option value="en">EN</option>
      </select>
    </label>
  )
}
