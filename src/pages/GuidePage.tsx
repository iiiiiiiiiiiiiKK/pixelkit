import { useI18n } from '../i18n'
import { navigate } from '../routing'
import { ArrowRightIcon } from '../components/Icons'

export function GuidePage() {
  const { t } = useI18n()
  const steps = [1, 2, 3, 4] as const
  const faq = [1, 2, 3, 4] as const

  return (
    <div className="shell max-w-3xl pb-16 pt-10">
      <h1 className="text-[28px] font-semibold sm:text-[34px]">{t('guide.title')}</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{t('guide.lead')}</p>

      <div className="mt-10 space-y-8">
        {steps.map((step) => (
          <section key={step}>
            <h2 className="text-[16px] font-semibold">{t(`guide.s${step}.title`)}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{t(`guide.s${step}.body`)}</p>
          </section>
        ))}
      </div>

      <section className="mt-12 rounded-[14px] border border-line bg-surface p-5">
        <h2 className="text-[16px] font-semibold">{t('guide.limits.title')}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{t('guide.limits.body')}</p>
      </section>

      <section className="mt-12">
        <h2 className="text-[16px] font-semibold">{t('guide.faq.title')}</h2>
        <div className="mt-4 divide-y divide-line rounded-[14px] border border-line bg-surface">
          {faq.map((index) => (
            <details key={index} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-[14px] font-medium">
                {t(`guide.faq.q${index}`)}
                <span className="text-ink-mute transition-transform group-open:rotate-90">
                  <ArrowRightIcon size={15} />
                </span>
              </summary>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{t(`guide.faq.a${index}`)}</p>
            </details>
          ))}
        </div>
      </section>

      <button
        type="button"
        className="btn btn-primary btn-lg mt-10"
        onClick={() => navigate({ name: 'tool', tool: 'compress' })}
      >
        {t('hero.browse')}
      </button>
    </div>
  )
}
