import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en, zh, type DictKey, type Dictionary } from './dict'

export type Lang = 'zh' | 'en'

const STORAGE_KEY = 'pixelkit.lang'
const DICTS: Record<Lang, Dictionary> = { en, zh }

export type TranslateVars = Record<string, string | number>

export interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  toggleLang: () => void
  /**
   * Looks a key up in the active dictionary. Taking a plain string keeps
   * dynamic keys (for example `error.` + a runtime error code) type-safe enough
   * while still falling back to English and finally to the key itself.
   */
  t: (key: DictKey | string, vars?: TranslateVars) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function readStoredLang(): Lang | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'zh' || value === 'en' ? value : null
  } catch {
    return null
  }
}

/** Picks the interface language from the browser, defaulting to English. */
export function detectLang(): Lang {
  const stored = readStoredLang()
  if (stored) return stored
  const candidates = typeof navigator !== 'undefined' ? [navigator.language, ...(navigator.languages ?? [])] : []
  for (const candidate of candidates) {
    if (!candidate) continue
    const lower = candidate.toLowerCase()
    if (lower.startsWith('zh')) return 'zh'
    if (lower.startsWith('en')) return 'en'
  }
  return 'en'
}

export function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key]
    return value === undefined ? match : String(value)
  })
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detectLang())

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en')
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* private mode: the choice simply is not remembered */
    }
  }, [])

  const value = useMemo<I18nValue>(() => {
    const dictionary = DICTS[lang] as Record<string, string>
    const fallback = en as Record<string, string>
    return {
      lang,
      setLang,
      toggleLang: () => setLang(lang === 'zh' ? 'en' : 'zh'),
      t: (key, vars) => interpolate(dictionary[key] ?? fallback[key] ?? key, vars),
    }
  }, [lang, setLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>')
  return value
}
