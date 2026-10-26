import { useEffect } from 'react'
import i18n from '../lib/i18n'
import { useAdminStore } from '../stores/admin'
import { useBiomeStore } from '../stores/biome'
import { useLocaleStore } from '../stores/locale'

export function StoreHydration() {
  const locale = useLocaleStore((state) => state.locale)

  useEffect(() => {
    void (async () => {
      await Promise.all([
        useBiomeStore.persist.rehydrate(),
        useAdminStore.persist.rehydrate(),
        useLocaleStore.persist.rehydrate(),
      ])

      if (!window.localStorage.getItem('valheim-recipes:locale')) {
        const detected = navigator.language.toLowerCase().startsWith('es')
          ? 'es'
          : 'en'
        useLocaleStore.getState().setLocale(detected)
      }
    })()
  }, [])

  useEffect(() => {
    if (i18n.resolvedLanguage !== locale) {
      void i18n.changeLanguage(locale)
    }
  }, [locale])

  return null
}
