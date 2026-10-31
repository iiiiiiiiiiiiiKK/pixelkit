import { useI18n } from '../i18n'
import { navigate } from '../routing'
import { TOOLS } from '../toolCatalog'
import { useWorkspace } from '../workspace/store'
import { DropZone } from '../components/DropZone'
import { SectionHeading } from '../components/ui'
import {
  ArrowRightIcon,
  ImageIcon,
  LayersIcon,
  ShieldIcon,
  XIcon,
  CheckIcon,
} from '../components/Icons'
import { AUTHOR_URL } from '../components/Header'

export function HomePage() {
  const { t } = useI18n()
  const { addFiles } = useWorkspace()

  const start = async (files: File[]) => {
    await addFiles(files)
    navigate({ name: 'tool', tool: 'compress' })
  }

  const steps = [1, 2, 3, 4] as const
  const privacy = [1, 2, 3, 4, 5] as const

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="grid-paper pointer-events-none absolute inset-x-0 top-0 h-[380px] opacity-60" aria-hidden="true" />
        <div className="shell relative pb-14 pt-12 sm:pb-16 sm:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-ink-soft">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
              {t('hero.badge')}
            </p>

            <h1 className="mt-6 text-[clamp(2rem,4.6vw,3.5rem)] font-semibold leading-[1.08]">
              {t('hero.title')}
            </h1>
            <p className="mx-auto mt-5 max-w-[38rem] text-[15px] leading-relaxed text-ink-soft sm:text-[16.5px]">
              {t('hero.subtitle')}
            </p>
          </div>

          <div className="mx-auto mt-9 max-w-2xl">
            <DropZone onFiles={(files) => void start(files)} />
          </div>

          <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-ink-mute">
            <span className="inline-flex items-center gap-1.5">
              <ShieldIcon size={14} /> {t('privacy.1.title')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <LayersIcon size={14} /> {t('tool.convert')} · {t('tool.resize')} · {t('tool.crop')}
            </span>
            <a
              className="inline-flex min-h-8 items-center gap-1.5 px-1 transition-colors hover:text-ink"
              href={AUTHOR_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <XIcon size={11} /> 0xkillcoin
            </a>
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="shell scroll-mt-20" id="tools">
        <SectionHeading
          eyebrow={t('home.or')}
          title={t('tools.title')}
          description={t('tools.subtitle')}
        />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => navigate({ name: 'tool', tool: tool.id })}
                className="group relative flex flex-col items-start gap-3 rounded-[14px] border border-line bg-surface p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_10px_30px_-18px_rgb(0_0_0_/_35%)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-line bg-raised text-ink transition-colors group-hover:text-accent">
                  <Icon size={19} />
                </span>
                <span className="text-[15px] font-semibold">{t(tool.nameKey)}</span>
                <span className="text-[13px] leading-relaxed text-ink-soft">{t(tool.descKey)}</span>
                <span className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {t('tools.open')} <ArrowRightIcon size={13} />
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Steps */}
      <section className="shell mt-20">
        <SectionHeading title={t('steps.title')} />
        <ol className="mt-8 grid gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <li key={step} className="bg-surface p-5">
              <span className="mono text-[12px] text-accent">0{step}</span>
              <h3 className="mt-2 text-[15px] font-semibold">{t(`steps.${step}.title`)}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{t(`steps.${step}.desc`)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Privacy */}
      <section className="shell mt-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
          <div>
            <SectionHeading title={t('privacy.title')} description={t('privacy.subtitle')} />
            <button
              type="button"
              className="btn btn-secondary mt-6"
              onClick={() => navigate({ name: 'privacy' })}
            >
              {t('privacy.readMore')} <ArrowRightIcon size={15} />
            </button>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {privacy.map((index) => (
              <li key={index} className="rounded-[12px] border border-line bg-surface p-4">
                <span className="flex items-center gap-2 text-[13.5px] font-semibold">
                  <CheckIcon size={15} className="text-accent" />
                  {t(`privacy.${index}.title`)}
                </span>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
                  {t(`privacy.${index}.desc`)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Closing card */}
      <section className="shell mt-20">
        <div className="relative overflow-hidden rounded-[18px] border border-line bg-surface p-6 sm:p-10">
          <div className="grid-paper pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-[20px] font-semibold sm:text-[24px]">{t('home.startTitle')}</h2>
              <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-ink-soft">
                {t('hero.local')}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => navigate({ name: 'tool', tool: 'compress' })}
            >
              <ImageIcon size={17} /> {t('hero.browse')}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
