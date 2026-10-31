import { useEffect, useRef } from 'react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { HomePage } from './pages/HomePage'
import { GuidePage } from './pages/GuidePage'
import { PrivacyPage } from './pages/PrivacyPage'
import { WorkspacePage } from './pages/WorkspacePage'
import { useRoute } from './routing'
import { useI18n } from './i18n'

export function App() {
  const route = useRoute()
  const { t } = useI18n()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [route])

  useEffect(() => {
    const names: Record<string, string> = {
      home: t('app.name'),
      guide: `${t('guide.title')} · ${t('app.name')}`,
      privacy: `${t('privacyPage.title')} · ${t('app.name')}`,
    }
    document.title =
      route.name === 'tool'
        ? `${t(`tool.${route.tool}`)} · ${t('app.name')}`
        : (names[route.name] ?? t('app.name'))
  }, [route, t])

  return (
    <div className="flex min-h-screen flex-col">
      <button
        type="button"
        className="sr-only-focusable absolute left-3 top-3 z-50 rounded-md bg-accent px-3 py-2 text-[13px] font-medium text-accent-ink"
        onClick={() => mainRef.current?.focus()}
      >
        {t('nav.skip')}
      </button>

      <Header route={route} />

      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        {route.name === 'home' ? <HomePage /> : null}
        {route.name === 'tool' ? <WorkspacePage route={route} /> : null}
        {route.name === 'guide' ? <GuidePage /> : null}
        {route.name === 'privacy' ? <PrivacyPage /> : null}
      </main>

      <Footer />
    </div>
  )
}
