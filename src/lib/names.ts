import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import itemNamesEs from '../data/item-names.es.json'

const spanishNames = itemNamesEs as Record<string, string>

export function localizedName(
  id: string | undefined,
  fallback: string,
  language: string,
): string {
  if (language !== 'es' || !id) return fallback
  return spanishNames[id] ?? fallback
}

export function useLocalizedName() {
  const { i18n } = useTranslation()
  const language = i18n.language
  return useCallback(
    (id: string | undefined, fallback: string) =>
      localizedName(id, fallback, language),
    [language],
  )
}
