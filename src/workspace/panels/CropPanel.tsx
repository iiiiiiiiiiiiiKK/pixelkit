import { useI18n } from '../../i18n'
import { Notice } from '../../components/ui'
import { useWorkspace } from '../store'
import { CROP_RATIOS } from '../../engine/geometry'
import { FULL_RECT, centerRectForRatio, rectToPixels } from '../cropMath'

export function CropPanel() {
  const { t } = useI18n()
  const { settings, updateSettings, items, selectedId } = useWorkspace()
  const item = items.find((entry) => entry.id === selectedId) ?? items[0]

  const applyRatio = (ratioId: string) => {
    const preset = CROP_RATIOS.find((entry) => entry.id === ratioId)
    const ratio = preset?.value ?? null
    const rect = item ? centerRectForRatio(ratio, item.width, item.height) : FULL_RECT
    updateSettings('crop', { ratioId, rect })
  }

  const pixels = item ? rectToPixels(settings.crop.rect, item.width, item.height) : null

  return (
    <div className="space-y-6">
      <div>
        <p className="field-label">{t('panel.crop.ratio')}</p>
        <div className="flex flex-wrap gap-2">
          {CROP_RATIOS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`btn btn-sm ${settings.crop.ratioId === preset.id ? 'btn-primary' : 'btn-secondary'}`}
              aria-pressed={settings.crop.ratioId === preset.id}
              onClick={() => applyRatio(preset.id)}
            >
              {preset.value === null ? t('panel.crop.free') : preset.id}
            </button>
          ))}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-y-2 text-[13px]">
        <dt className="text-ink-mute">{t('panel.crop.output')}</dt>
        <dd className="mono text-right text-ink">
          {pixels ? `${pixels.width} × ${pixels.height}` : '—'}
        </dd>
        <dt className="text-ink-mute">{t('panel.crop.selection')}</dt>
        <dd className="mono text-right text-ink-soft">
          {pixels ? `${pixels.x}, ${pixels.y}` : '—'}
        </dd>
      </dl>

      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => updateSettings('crop', { ratioId: 'free', rect: FULL_RECT })}
        >
          {t('panel.crop.reset')}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            if (!item) return
            const preset = CROP_RATIOS.find((entry) => entry.id === settings.crop.ratioId)
            updateSettings('crop', {
              rect: centerRectForRatio(preset?.value ?? null, item.width, item.height),
            })
          }}
        >
          {t('panel.crop.center')}
        </button>
      </div>

      <Notice>{t('panel.crop.hint')}</Notice>
      <Notice tone="warn">{t('ws.cropHint')}</Notice>
    </div>
  )
}
