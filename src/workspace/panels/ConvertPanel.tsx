import { useI18n } from '../../i18n'
import { Field, Notice, Segmented } from '../../components/ui'
import { useWorkspace } from '../store'
import type { EncodableFormat } from '../../engine/types'

const FORMATS: EncodableFormat[] = ['jpeg', 'png', 'webp']

export function ConvertPanel() {
  const { t } = useI18n()
  const { settings, updateSettings, encoders, items } = useWorkspace()
  const convert = settings.convert
  const qualityPercent = Math.round(convert.quality * 100)
  const hasGif = items.some((item) => item.format === 'gif')
  const missing = FORMATS.filter((format) => !encoders.includes(format))

  return (
    <div className="space-y-6">
      <Field label={t('panel.convert.format')} hint={t('panel.convert.supported')}>
        <Segmented
          ariaLabel={t('panel.convert.format')}
          options={FORMATS.map((format) => ({
            value: format,
            label: format.toUpperCase() + (encoders.includes(format) ? '' : ' ·—'),
          }))}
          value={convert.format}
          onChange={(value) => updateSettings('convert', { format: value })}
        />
      </Field>

      <div>
        <div className="field-label">
          <label htmlFor="convert-quality">{t('panel.convert.quality')}</label>
          <span className="mono text-ink">{qualityPercent}%</span>
        </div>
        <input
          id="convert-quality"
          className="range"
          type="range"
          min={5}
          max={100}
          step={1}
          value={qualityPercent}
          disabled={convert.format === 'png'}
          onChange={(event) => updateSettings('convert', { quality: Number(event.target.value) / 100 })}
        />
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-mute">
          {convert.format === 'png' ? t('panel.compress.losslessNote') : t('panel.compress.qualityHint')}
        </p>
      </div>

      {convert.format === 'jpeg' ? (
        <Field label={t('panel.convert.background')} htmlFor="convert-bg">
          <div className="flex items-center gap-2">
            <input
              id="convert-bg"
              type="color"
              value={convert.background}
              onChange={(event) => updateSettings('convert', { background: event.target.value })}
              className="h-10 w-12 cursor-pointer rounded-[8px] border border-line-strong bg-surface p-1"
            />
            <input
              className="input mono flex-1"
              value={convert.background}
              aria-label={t('panel.convert.background')}
              onChange={(event) => {
                const value = event.target.value.trim()
                if (/^#[0-9a-fA-F]{0,6}$/.test(value)) updateSettings('convert', { background: value })
              }}
              onBlur={(event) => {
                if (!/^#[0-9a-fA-F]{6}$/.test(event.target.value.trim())) {
                  updateSettings('convert', { background: '#ffffff' })
                }
              }}
            />
          </div>
        </Field>
      ) : null}

      {convert.format === 'jpeg' ? <Notice tone="warn">{t('panel.convert.transparency')}</Notice> : null}
      {hasGif ? <Notice>{t('panel.convert.gifNote')}</Notice> : null}
      {missing.length > 0 ? (
        <Notice tone="error">
          {t('ws.encoderMissing', {
            format: missing.map((format) => format.toUpperCase()).join(', '),
          })}
        </Notice>
      ) : null}
    </div>
  )
}
