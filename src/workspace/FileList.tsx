import { useI18n } from '../i18n'
import { formatBytes, formatPercent, savedPercent } from '../engine/formats'
import type { ToolId } from '../engine/types'
import { useWorkspace, type QueueItem } from './store'
import { CheckIcon, CloseIcon, DownloadIcon, SpinnerIcon, TrashIcon } from '../components/Icons'

function StatusPill({ item }: { item: QueueItem }) {
  const { t } = useI18n()
  if (item.status === 'processing') {
    return (
      <span className="badge">
        <SpinnerIcon size={12} />
        {Math.round(item.progress * 100)}%
      </span>
    )
  }
  if (item.status === 'done') {
    return (
      <span className="badge badge-ok">
        <CheckIcon size={12} />
        {t('ws.status.done')}
      </span>
    )
  }
  if (item.status === 'error') {
    return (
      <span className="badge badge-error">
        <CloseIcon size={12} />
        {t('ws.status.error')}
      </span>
    )
  }
  return <span className="badge">{t('ws.status.queued')}</span>
}

export function FileList({ tool }: { tool: ToolId }) {
  const { t, lang } = useI18n()
  const { items, selectedId, select, removeItem, download, run } = useWorkspace()

  if (items.length === 0) return null

  return (
    <ul className="divide-y divide-line" data-testid="file-list">
      {items.map((item) => {
        const active = item.id === selectedId
        const output = item.output
        const saved = output ? savedPercent(item.size, output.size) : null
        return (
          <li
            key={item.id}
            className={`group relative flex items-center gap-3 px-3 py-2.5 transition-colors sm:px-4 ${
              active ? 'bg-accent-soft/40' : 'hover:bg-raised/60'
            }`}
            data-testid="file-item"
          >
            <button
              type="button"
              onClick={() => select(item.id)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
              aria-label={t('ws.select', { name: item.name })}
              aria-current={active ? 'true' : undefined}
            >
              <span className="checkerboard relative h-11 w-11 shrink-0 overflow-hidden rounded-[8px] border border-line">
                <img
                  src={output?.url ?? item.previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[13.5px] font-medium text-ink" title={item.name}>
                    {item.name}
                  </span>
                  <StatusPill item={item} />
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-ink-mute">
                  <span className="uppercase">{item.format}</span>
                  <span aria-hidden="true">·</span>
                  <span className="mono">
                    {item.width}×{item.height}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="mono">{formatBytes(item.size, lang)}</span>
                  {output ? (
                    <>
                      <span aria-hidden="true">→</span>
                      <span className="mono text-ink">{formatBytes(output.size, lang)}</span>
                      {saved !== null && Math.abs(saved) > 0.05 ? (
                        <span className={saved >= 0 ? 'text-accent' : 'text-warn'}>
                          {saved >= 0 ? '−' : '+'}
                          {formatPercent(Math.abs(saved)).replace('-', '')}
                        </span>
                      ) : null}
                      {output.keptOriginal ? (
                        <span className="badge badge-warn">{t('ws.keptOriginal')}</span>
                      ) : null}
                    </>
                  ) : null}
                </span>

                {item.status === 'processing' ? (
                  <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-line">
                    <span
                      className="block h-full rounded-full bg-accent transition-[width] duration-200"
                      style={{ width: `${Math.max(6, Math.round(item.progress * 100))}%` }}
                    />
                  </span>
                ) : null}

                {item.status === 'error' && item.error ? (
                  <span className="mt-1 block text-[12px] text-danger">
                    {t(`error.${item.error.code}`)}
                  </span>
                ) : null}
              </span>
            </button>

            <div className="flex shrink-0 items-center gap-0.5">
              {item.status === 'error' ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => void run(tool as ToolId)}
                >
                  {t('ws.retry')}
                </button>
              ) : null}
              {output ? (
                <button
                  type="button"
                  className="icon-btn h-8 w-8"
                  aria-label={`${t('ws.download')} ${output.name}`}
                  onClick={() => download(item)}
                >
                  <DownloadIcon size={16} />
                </button>
              ) : null}
              <button
                type="button"
                className="icon-btn h-8 w-8 hover:text-danger"
                aria-label={t('ws.removeItem', { name: item.name })}
                onClick={() => removeItem(item.id)}
              >
                <TrashIcon size={16} />
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
