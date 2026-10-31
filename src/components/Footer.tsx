import { useI18n } from '../i18n'
import { AUTHOR_URL, REPO_URL } from './Header'
import { GithubIcon, LogoMark, XIcon } from './Icons'

export function Footer() {
  const { t } = useI18n()
  const year = new Date().getFullYear()

  return (
    <footer className="mt-24 border-t border-line bg-surface/60">
      <div className="shell grid gap-10 py-14 md:grid-cols-[1.6fr_1fr_1fr] md:gap-8">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <LogoMark size={26} className="text-accent" />
            <span className="text-[16px] font-semibold">PixelKit</span>
          </div>
          <p className="mt-3.5 text-[13.5px] leading-relaxed text-ink-soft">{t('footer.about')}</p>
          <p className="mt-4 text-[12.5px] text-ink-mute">{t('footer.builtWith')}</p>
        </div>

        <nav aria-label={t('footer.resources')}>
          <p className="panel-title mb-3.5">{t('footer.resources')}</p>
          <ul className="space-y-1 text-[13.5px]">
            <li>
              <a
                className="inline-flex min-h-8 items-center text-ink-soft transition-colors hover:text-ink"
                href="#/guide"
              >
                {t('footer.guide')}
              </a>
            </li>
            <li>
              <a
                className="inline-flex min-h-8 items-center text-ink-soft transition-colors hover:text-ink"
                href="#/privacy"
              >
                {t('footer.privacy')}
              </a>
            </li>
            <li>
              <a
                className="inline-flex min-h-8 items-center gap-1.5 text-ink-soft transition-colors hover:text-ink"
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubIcon size={14} /> {t('footer.repo')}
              </a>
            </li>
            <li>
              <a
                className="inline-flex min-h-8 items-center gap-1.5 text-ink-soft transition-colors hover:text-ink"
                href={AUTHOR_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <XIcon size={12} /> {t('footer.author')}
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <p className="panel-title mb-3.5">{t('footer.legal')}</p>
          <ul className="space-y-1 text-[13.5px]">
            <li>
              <a
                className="inline-flex min-h-8 items-center text-ink-soft transition-colors hover:text-ink"
                href={`${REPO_URL}/blob/main/LICENSE`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('footer.license')}
              </a>
            </li>
            <li className="min-h-8 content-center text-ink-mute">{t('footer.rights')}</li>
          </ul>
        </div>
      </div>

      <div className="shell flex flex-col gap-2 border-t border-line py-6 text-[12.5px] text-ink-mute sm:flex-row sm:items-center sm:justify-between">
        <span>
          © {year} PixelKit · MIT
        </span>
        <span className="inline-flex items-center gap-1.5">
          {t('app.tagline')}
        </span>
      </div>
    </footer>
  )
}
