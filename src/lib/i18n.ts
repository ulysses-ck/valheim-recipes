import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      nav: {
        recipes: 'Recipes',
        calculator: 'Calculator',
        stations: 'Stations',
        admin: 'Admin',
      },
      common: {
        search: 'Search',
        clear: 'Clear',
        all: 'All',
        loading: 'Loading…',
        back: 'Back',
      },
      biome: {
        label: 'Biome',
        all: 'All biomes (spoilers)',
        hint: 'Hides items from later biomes.',
      },
      footer: {
        disclaimer:
          'Unofficial fan project. Valheim is a trademark of Coffee Stain Studios. Not affiliated with Iron Gate Studio.',
        attribution: 'Data and icons from valheimcheats.com.',
      },
    },
  },
  es: {
    translation: {
      nav: {
        recipes: 'Recetas',
        calculator: 'Calculadora',
        stations: 'Estaciones',
        admin: 'Admin',
      },
      common: {
        search: 'Buscar',
        clear: 'Limpiar',
        all: 'Todo',
        loading: 'Cargando…',
        back: 'Volver',
      },
      biome: {
        label: 'Bioma',
        all: 'Todos los biomas (spoilers)',
        hint: 'Oculta objetos de biomas posteriores.',
      },
      footer: {
        disclaimer:
          'Proyecto de fans no oficial. Valheim es una marca de Coffee Stain Studios. Sin afiliación con Iron Gate Studio.',
        attribution: 'Datos e iconos de valheimcheats.com.',
      },
    },
  },
} as const

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    initAsync: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })
}

export default i18n
