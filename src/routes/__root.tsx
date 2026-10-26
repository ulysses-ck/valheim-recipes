import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useTranslation } from 'react-i18next'

import appCss from '../styles.css?url'
import '../lib/i18n'
import { DatasetProvider } from '../lib/dataset-context'
import { StoreHydration } from '../components/StoreHydration'
import { SiteHeader } from '../components/layout/SiteHeader'
import { SiteFooter } from '../components/layout/SiteFooter'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Valheim Recipes — Crafting Graph & Material Calculator',
      },
      {
        name: 'description',
        content:
          'Browse Valheim recipes by biome, follow ingredient graphs, and calculate base crafting and upgrade material costs.',
      },
      { name: 'theme-color', content: '#090d0b' },
      { property: 'og:type', content: 'website' },
      {
        property: 'og:title',
        content: 'Valheim Recipes — Crafting Graph & Material Calculator',
      },
      {
        property: 'og:description',
        content:
          'A spoiler-aware Valheim recipe graph and material calculator. Base craft and upgrade deltas, recursively broken down to raw materials.',
      },
      { name: 'twitter:card', content: 'summary' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation()

  return (
    <html lang={i18n.resolvedLanguage ?? 'es'}>
      <head>
        <HeadContent />
      </head>
      <body>
        <StoreHydration />
        <DatasetProvider>
          <div id="app" className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </DatasetProvider>
        {import.meta.env.DEV ? (
          <TanStackDevtools
            config={{ position: 'bottom-right' }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}
