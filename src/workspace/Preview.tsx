import { useState } from 'react'
import { useI18n } from '../i18n'
import { formatBytes, formatPercent, savedPercent } from '../engine/formats'
import type { ToolId } from '../engine/types'
import { useWorkspace } from './store'
import { CropEditor } from './CropEditor'
import { ImageIcon } from '../components/Icons'

/**
 * Centre pane: the selected image, before/after, or the crop editor.
 * The parent gives this component a key of `tool:selectedId`, so the
 * before/after choice resets naturally when the selection changes.
 */
export function Preview({ tool }: { tool: ToolId }) {
  const { t, lang } = useI18n()
  const { items, selectedId } = useWorkspace()
  const item = items.find((entry) => entry.id === selectedId) ?? items[0]
  const [view, setView] = useState<'after' | 'before'>('after')

  if (tool === 'crop') return <CropEditor />

  if (!item) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed border-line-strong text-center">
        <ImageIcon size={26} className="text-ink-mute" />
        <div>
          <p className="text-[14px] font-medium">{t('ws.emptyTitle')}</p>
          <p className="mt-1 max-w-[34ch] text-[12.5px] text-ink-mute">{t('ws.emptyDesc')}</p>
        </div>
      </div>
    )
  }

  const output = item.output
  const canToggle = Boolean(output) && output?.url !== item.previewUrl
  const effectiveView = canToggle ? view : 'before'
  const shownUrl = effectiveView === 'after' && output ? output.url : item.previewUrl
  const saved = output ? savedPercent(item.size, output.size) : null

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="badge">{item.format.toUpperCase()}</span>
        <span className="mono text-[12px] text-ink-mute">
          {item.width} × {item.height}
        </span>
        {canToggle ? (
          <div className="ml-auto">
            <div className="segmented">
              <button type="button" aria-pressed={effectiveView === 'before'} onClick={() => setView('before')}>
                {t('ws.before')}
              </button>
              <button type="button" aria-pressed={effectiveView === 'after'} onClick={() => setView('after')}>
                {t('ws.after')}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="checkerboard flex min-h-[240px] items-center justify-center overflow-hidden rounded-[12px] border border-line">
        <img
          key={shownUrl}
          src={shownUrl}
          alt={t('ws.previewAlt', { name: item.name })}
          className="fade-in max-h-[52vh] w-auto max-w-full object-contain"
          draggable={false}
        />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-[12.5px]" data-testid="preview-stats">
        <div>
          <dt className="text-ink-mute">{t('ws.before')}</dt>
          <dd className="mono mt-0.5 text-[13.5px] text-ink">{formatBytes(item.size, lang)}</dd>
        </div>
        <div>
          <dt className="text-ink-mute">{t('ws.after')}</dt>
          <dd className="mono mt-0.5 text-[13.5px] text-ink">
            {output ? formatBytes(output.size, lang) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-ink-mute">{t('ws.saved')}</dt>
          <dd className={`mono mt-0.5 text-[13.5px] ${saved !== null && saved < 0 ? 'text-warn' : 'text-accent'}`}>
            {saved === null ? '—' : Math.abs(saved) < 0.05 ? t('ws.sameSize') : formatPercent(saved)}
          </dd>
        </div>
      </dl>

      {output && output.name !== item.name ? (
        <p className="mono mt-2 truncate text-[12px] text-ink-mute">
          {t('ws.outputName')}: {output.name}
        </p>
      ) : null}
    </div>
  )
}
