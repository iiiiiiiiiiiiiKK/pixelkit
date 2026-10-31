import { useI18n } from '../../i18n'
import { Field, Notice, Segmented, Toggle } from '../../components/ui'
import { useWorkspace } from '../store'
import type { EncodableFormat } from '../../engine/types'

/** Compress panel: quality, optional format switch, "keep the smaller file". */
export function CompressPanel() {
  const { t } = useI18n()
  const { settings, updateSettings, encoders, items, selectedId } = useWorkspace()
  const compress = settings.compress

  const selected = items.find((item) => item.id === selectedId) ?? items[0]
  const effectiveFormat: EncodableFormat | null =
    compress.format === 'original'
      ? selected
        ? selected.format === 'jpeg' || selected.format === 'png' || selected.format === 'webp'
          ? selected.format
          : 'png'
        : null
      : compress.format

  const lossless = effectiveFormat === 'png'
  const qualityPercent = Math.round(compress.quality * 100)

  const formatOptions: { value: EncodableFormat | 'original'; label: string }[] = [
    { value: 'original', label: t('panel.compress.keepOriginal') },
    ...encoders.map((format) => ({ value: format, label: format.toUpperCase() })),
  ]

  return (
    <div className="space-y-6">
      <div>
        <div className="field-label">
          <label htmlFor="compress-quality">{t('panel.compress.quality')}</label>
          <span className="mono text-ink">{qualityPercent}%</span>
        </div>
        <input
          id="compress-quality"
          className="range"
          type="range"
          min={5}
          max={100}
          step={1}
          value={qualityPercent}
          disabled={lossless}
          onChange={(event) => updateSettings('compress', { quality: Number(event.target.value) / 100 })}
        />
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-mute">
          {lossless ? t('panel.compress.losslessNote') : t('panel.compress.qualityHint')}
        </p>
      </div>

      <Field label={t('panel.compress.format')}>
        <Segmented
          ariaLabel={t('panel.compress.format')}
          options={formatOptions}
          value={compress.format}
          onChange={(value) => updateSettings('compress', { format: value })}
        />
      </Field>

      <Toggle
        checked={compress.keepSmaller}
        onChange={(checked) => updateSettings('compress', { keepSmaller: checked })}
        label={t('ws.keepSmaller')}
        hint={t('ws.keepSmallerHint')}
      />

      {lossless ? <Notice tone="warn">{t('panel.compress.pngNote')}</Notice> : null}

      {compress.format !== 'original' && !encoders.includes(compress.format as EncodableFormat) ? (
        <Notice tone="error">
          {t('panel.convert.unsupported', { format: (compress.format as string).toUpperCase() })}
        </Notice>
      ) : null}
    </div>
  )
}
