import { useI18n } from '../i18n'

export function PrivacyPage() {
  const { t } = useI18n()
  const sections = [1, 2, 3, 4, 5] as const

  return (
    <div className="shell max-w-3xl pb-16 pt-10">
      <h1 className="text-[28px] font-semibold sm:text-[34px]">{t('privacyPage.title')}</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{t('privacyPage.lead')}</p>

      <div className="mt-10 space-y-8">
        {sections.map((index) => (
          <section key={index}>
            <h2 className="text-[16px] font-semibold">{t(`privacyPage.${index}.title`)}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{t(`privacyPage.${index}.body`)}</p>
          </section>
        ))}

        <section>
          <h2 className="text-[16px] font-semibold">{t('privacyPage.security.title')}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{t('privacyPage.security.body')}</p>
        </section>
      </div>
    </div>
  )
}
