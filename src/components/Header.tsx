import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { useTheme } from '../theme'
import { navigate, routeHash, type Route } from '../routing'
import { CloseIcon, GithubIcon, GlobeIcon, LogoMark, MoonIcon, SunIcon, XIcon } from './Icons'

export const AUTHOR_URL = 'https://x.com/0xkillcoin'
export const REPO_URL = 'https://github.com/iiiiiiiiiiiiiKK/pixelkit'

interface HeaderProps {
  route: Route
}

export function Header({ route }: HeaderProps) {
  const { t, lang, toggleLang } = useI18n()
  const { theme, toggleTheme } = useTheme()
  // The sheet is keyed by route so navigating closes it without an effect.
  const routeKey = routeHash(route)
  const [openFor, setOpenFor] = useState<string | null>(null)
  const menuOpen = openFor === routeKey
  const setMenuOpen = (open: boolean) => setOpenFor(open ? routeKey : null)

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenFor(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const links: { href: string; label: string; active: boolean }[] = [
    { href: '#/', label: t('nav.tools'), active: route.name === 'home' || route.name === 'tool' },
    { href: '#/guide', label: t('nav.guide'), active: route.name === 'guide' },
    { href: '#/privacy', label: t('nav.privacy'), active: route.name === 'privacy' },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="shell flex h-16 items-center gap-3">
        <a
          href="#/"
          onClick={(event) => {
            event.preventDefault()
            navigate({ name: 'home' })
          }}
          className="group flex items-center gap-2.5 rounded-md py-1 pr-1 text-ink"
        >
          <LogoMark size={30} className="text-accent" />
          <span className="text-[17px] font-semibold tracking-[-0.02em]">PixelKit</span>
        </a>

        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={link.active ? 'page' : undefined}
              className={`rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors ${
                link.active ? 'text-ink' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <a
            href={AUTHOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('a11y.author')}
            title={t('a11y.author')}
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-raised hover:text-ink"
          >
            <XIcon size={15} />
            <span className="hidden lg:inline">0xkillcoin</span>
          </a>

          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('nav.source')}
            title={t('nav.source')}
            className="icon-btn hidden sm:inline-flex"
          >
            <GithubIcon size={17} />
          </a>

          <button
            type="button"
            onClick={toggleLang}
            aria-label={t('a11y.lang')}
            title={t('a11y.lang')}
            data-testid="lang-toggle"
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-raised hover:text-ink"
          >
            <GlobeIcon size={16} />
            <span className="tabular-nums">{lang === 'zh' ? 'EN' : '中文'}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={t('a11y.theme')}
            title={t('a11y.theme')}
            aria-pressed={theme === 'dark'}
            data-testid="theme-toggle"
            className="icon-btn"
          >
            {theme === 'dark' ? <SunIcon size={17} /> : <MoonIcon size={17} />}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? t('common.close') : t('nav.menu')}
            aria-expanded={menuOpen}
            className="icon-btn md:hidden"
          >
            {menuOpen ? (
              <CloseIcon size={18} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="fade-in border-t border-line bg-surface md:hidden">
          <div className="shell flex flex-col py-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-md px-2 py-3 text-[15px] font-medium text-ink-soft hover:bg-raised hover:text-ink"
              >
                {link.label}
              </a>
            ))}
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md px-2 py-3 text-[15px] font-medium text-ink-soft hover:bg-raised hover:text-ink"
            >
              <GithubIcon size={16} /> {t('nav.source')}
            </a>
            <a
              href={AUTHOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md px-2 py-3 text-[15px] font-medium text-ink-soft hover:bg-raised hover:text-ink"
            >
              <XIcon size={15} /> @0xkillcoin
            </a>
          </div>
        </div>
      ) : null}
    </header>
  )
}
