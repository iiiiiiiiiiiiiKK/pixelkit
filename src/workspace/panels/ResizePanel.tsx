import { useI18n } from '../../i18n'
import { Field, Notice, Segmented, Toggle } from '../../components/ui'
import { useWorkspace } from '../store'
import {
  MAX_DIMENSION,
  SIZE_PRESETS,
  heightForWidth,
  parseDimension,
  widthForHeight,
} from '../../engine/geometry'

export function ResizePanel() {
  const { t } = useI18n()
  const { settings, updateSettings, items, selectedId } = useWorkspace()
  const resize = settings.resize
  const selected = items.find((item) => item.id === selectedId) ?? items[0]

  const widthValue = parseDimension(resize.width)
  const heightValue = parseDimension(resize.height)
  const percentValue = Number(resize.percent)
  const percentValid = Number.isFinite(percentValue) && percentValue >= 1 && percentValue <= 400

  const widthError = resize.width !== '' && widthValue === null ? t('panel.resize.invalid') : undefined
  const heightError = resize.height !== '' && heightValue === null ? t('panel.resize.invalid') : undefined
  const percentError = resize.percent !== '' && !percentValid ? t('panel.resize.invalid') : undefined

  const onWidthChange = (raw: string) => {
    updateSettings('resize', { width: raw })
    if (!resize.lock || !selected || selected.width === 0) return
    const parsed = parseDimension(raw)
    if (parsed === null) return
    updateSettings('resize', { height: String(heightForWidth(parsed, selected)) })
  }

  const onHeightChange = (raw: string) => {
    updateSettings('resize', { height: raw })
    if (!resize.lock || !selected || selected.height === 0) return
    const parsed = parseDimension(raw)
    if (parsed === null) return
    updateSettings('resize', { width: String(widthForHeight(parsed, selected)) })
  }

  const applyPreset = (width: number) => {
    updateSettings('resize', { mode: 'pixels', width: String(width), height: '' })
    if (selected) updateSettings('resize', { height: String(heightForWidth(width, selected)) })
  }

  const target =
    resize.mode === 'percent'
      ? selected && percentValid
        ? {
            width: Math.max(1, Math.round((selected.width * percentValue) / 100)),
            height: Math.max(1, Math.round((selected.height * percentValue) / 100)),
          }
        : null
      : widthValue && heightValue
        ? { width: widthValue, height: heightValue }
        : null

  return (
    <div className="space-y-6">
      <Segmented
        ariaLabel={t('panel.resize.target')}
        options={[
          { value: 'pixels', label: t('unit.px') },
          { value: 'percent', label: '%' },
        ]}
        value={resize.mode}
        onChange={(mode) => updateSettings('resize', { mode })}
      />

      {resize.mode === 'pixels' ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('panel.resize.width')} htmlFor="resize-width" error={widthError}>
              <input
                id="resize-width"
                className="input"
                inputMode="numeric"
                value={resize.width}
                placeholder={selected ? String(selected.width) : '1920'}
                aria-invalid={Boolean(widthError)}
                onChange={(event) => onWidthChange(event.target.value)}
              />
            </Field>
            <Field label={t('panel.resize.height')} htmlFor="resize-height" error={heightError}>
              <input
                id="resize-height"
                className="input"
                inputMode="numeric"
                value={resize.height}
                placeholder={selected ? String(selected.height) : '1080'}
                aria-invalid={Boolean(heightError)}
                onChange={(event) => onHeightChange(event.target.value)}
              />
            </Field>
          </div>

          <Toggle
            checked={resize.lock}
            onChange={(lock) => updateSettings('resize', { lock })}
            label={t('panel.resize.lock')}
          />

          <div>
            <p className="field-label">{t('panel.resize.preset')}</p>
            <div className="flex flex-wrap gap-2">
              {SIZE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => applyPreset(preset.width)}
                >
                  {preset.width}×{preset.height}
                </button>
              ))}
              {selected ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() =>
                    updateSettings('resize', {
                      width: String(selected.width),
                      height: String(selected.height),
                    })
                  }
                >
                  {t('panel.resize.preset.original')}
                </button>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <Field
          label={t('panel.resize.percent')}
          htmlFor="resize-percent"
          error={percentError}
          trailing={<span className="mono text-ink">{percentValid ? `${percentValue}%` : '—'}</span>}
        >
          <input
            id="resize-percent"
            className="range"
            type="range"
            min={1}
            max={400}
            step={1}
            value={percentValid ? percentValue : 100}
            onChange={(event) => updateSettings('resize', { percent: event.target.value })}
          />
        </Field>
      )}

      <div className="hairline" />

      <dl className="grid grid-cols-2 gap-y-2 text-[13px]">
        <dt className="text-ink-mute">{t('panel.resize.source')}</dt>
        <dd className="mono text-right text-ink">
          {selected ? `${selected.width} × ${selected.height}` : '—'}
        </dd>
        <dt className="text-ink-mute">{t('panel.resize.target')}</dt>
        <dd className="mono text-right text-ink">
          {target ? `${target.width} × ${target.height}` : '—'}
        </dd>
      </dl>

      <Notice>{t('panel.resize.batchNote')}</Notice>
      <p className="text-[12px] text-ink-mute">
        1 – {MAX_DIMENSION} px
      </p>
    </div>
  )
}
