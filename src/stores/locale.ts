import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Locale = 'en' | 'es'

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'es',
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'valheim-recipes:locale',
      version: 1,
      skipHydration: true,
    },
  ),
)
