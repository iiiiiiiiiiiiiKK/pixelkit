import { useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { navigate, type Route } from '../routing'
import { TOOLS, toolMeta } from '../toolCatalog'
import type { ToolId } from '../engine/types'
import { formatBytes, savedPercent } from '../engine/formats'
import { CompressPanel } from '../workspace/panels/CompressPanel'
import { ConvertPanel } from '../workspace/panels/ConvertPanel'
import { CropPanel } from '../workspace/panels/CropPanel'
import { InfoPanel } from '../workspace/panels/InfoPanel'
import { RenamePanel } from '../workspace/panels/RenamePanel'
import { ResizePanel } from '../workspace/panels/ResizePanel'
import { FileList } from '../workspace/FileList'
import { HistoryPanel } from '../workspace/HistoryPanel'
import { Preview } from '../workspace/Preview'
import { useWorkspace } from '../workspace/store'
import { DropZone } from '../components/DropZone'
import { Button, Notice } from '../components/ui'
import { ArrowLeftIcon, DownloadIcon, PlusIcon, SpinnerIcon, TrashIcon } from '../components/Icons'

function ToolPanel({ tool }: { tool: ToolId }) {
  switch (tool) {
    case 'compress':
      return <CompressPanel />
    case 'convert':
      return <ConvertPanel />
    case 'resize':
      return <ResizePanel />
    case 'crop':
      return <CropPanel />
    case 'rename':
      return <RenamePanel />
    default:
      return <InfoPanel />
  }
}

export function WorkspacePage({ route }: { route: Extract<Route, { name: 'tool' }> }) {
  const tool = route.tool
  const { t, lang } = useI18n()
  const {
    items,
    settings,
    running,
    rejections,
    dismissRejections,
    addFiles,
    clearAll,
    run,
    stop,
    downloadAll,
    stats,
    selectedId,
    notice,
    setNotice,
  } = useWorkspace()

  const inputRef = useRef<HTMLInputElement>(null)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const meta = toolMeta(tool)

  const pending = items.filter((item) => item.status !== 'done').length
  const processCount = tool === 'crop' ? Math.min(1, items.length) : pending > 0 ? pending : items.length
  const hasOutputs = items.some((item) => item.output)
  const selected = items.find((item) => item.id === selectedId) ?? items[0]
  const selectedSaved = selected?.output ? savedPercent(selected.size, selected.output.size) : null
  const outputFormatHint = useMemo(() => {
    if (tool === 'compress') {
      return settings.compress.format === 'original'
        ? t('panel.compress.keepOriginal')
        : settings.compress.format.toUpperCase()
    }
    if (tool === 'convert') return settings.convert.format.toUpperCase()
    return null
  }, [tool, settings, t])

  const processLabel =
    tool === 'info'
      ? t('ws.processOne')
      : tool === 'crop'
        ? t('ws.processOne')
        : t('ws.process', { count: processCount })

  return (
    <div className="shell pb-24 pt-6 sm:pt-8 lg:pb-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            className="btn btn-ghost btn-sm -ml-2 mb-2"
            onClick={() => navigate({ name: 'home' })}
          >
            <ArrowLeftIcon size={15} /> {t('ws.back')}
          </button>
          <h1 className="text-[24px] font-semibold sm:text-[28px]">{t(meta.nameKey)}</h1>
          <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-ink-soft">{t(meta.descKey)}</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif"
            className="hidden"
            data-testid="add-more-input"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? [])
              event.target.value = ''
              if (files.length > 0) void addFiles(files)
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            icon={<PlusIcon size={15} />}
            data-testid="add-more"
            onClick={() => inputRef.current?.click()}
          >
            {t('ws.addMore')}
          </Button>
          {items.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              icon={<TrashIcon size={15} />}
              data-testid="clear"
              onClick={() => {
                if (confirmingClear) {
                  clearAll()
                  setConfirmingClear(false)
                } else {
                  setConfirmingClear(true)
                  window.setTimeout(() => setConfirmingClear(false), 4000)
                }
              }}
            >
              {confirmingClear ? t('ws.clearConfirm') : t('ws.clear')}
            </Button>
          ) : null}
        </div>
      </div>

      <nav className="scroll-x mt-5 -mx-1 flex gap-1.5 px-1 pb-1" aria-label={t('nav.tools')}>
        {TOOLS.map((entry) => {
          const Icon = entry.icon
          const active = entry.id === tool
          return (
            <button
              key={entry.id}
              type="button"
              aria-current={active ? 'page' : undefined}
              data-testid={`tab-${entry.id}`}
              onClick={() => navigate({ name: 'tool', tool: entry.id })}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors ${
                active
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-line bg-surface text-ink-soft hover:text-ink'
              }`}
            >
              <Icon size={15} />
              {t(entry.nameKey)}
            </button>
          )
        })}
      </nav>

      {rejections.length > 0 ? (
        <div className="mt-4">
          <Notice tone="error" title={t('hero.rejectTitle')}>
            <span>{t('error.rejected', { count: rejections.length, names: rejections.map((r) => r.name).join(', ') })}</span>
            <button type="button" className="ml-2 underline" onClick={dismissRejections}>
              {t('common.dismiss')}
            </button>
          </Notice>
        </div>
      ) : null}

      {notice ? (
        <div className="mt-4">
          <Notice tone="warn">
            {notice === 'zip-empty' ? t('ws.zipEmpty') : t('error.zip')}
            <button type="button" className="ml-2 underline" onClick={() => setNotice(null)}>
              {t('common.dismiss')}
            </button>
          </Notice>
        </div>
      ) : null}

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[352px_minmax(0,1fr)]">
        {/* Settings */}
        <section className="card order-2 p-4 sm:p-5 lg:order-1 lg:sticky lg:top-20" aria-label={t('ws.panelTitle')}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="panel-title">{t('ws.panelTitle')}</h2>
            {outputFormatHint ? <span className="badge">{outputFormatHint}</span> : null}
          </div>

          <ToolPanel tool={tool} />

          <div className="mt-6 hidden lg:block">
            <div className="hairline mb-4" />
            <Button
              variant="primary"
              className="w-full"
              loading={running}
              disabled={items.length === 0}
              data-testid="process"
              onClick={() => void run(tool)}
            >
              {running ? t('ws.processing') : processLabel}
            </Button>
            {running ? (
              <Button variant="ghost" className="mt-2 w-full" data-testid="stop" onClick={stop}>
                {t('ws.stop')}
              </Button>
            ) : null}
            {stats.total > 0 ? (
              <p className="mt-3 text-center text-[12px] text-ink-mute">
                {stats.done > 0 ? `${t('ws.doneCount', { count: stats.done })} · ` : ''}
                {stats.failed > 0 ? `${t('ws.failedCount', { count: stats.failed })} · ` : ''}
                {lang === 'zh' ? `共 ${formatBytes(stats.originalBytes, lang)}` : `Total ${formatBytes(stats.originalBytes, lang)}`}
              </p>
            ) : null}
          </div>
        </section>

        {/* Preview */}
        <section className="card order-1 p-4 sm:p-5 lg:order-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="panel-title">{t('ws.resultTitle')}</h2>
            {items.length > 0 ? (
              <span className="text-[12px] text-ink-mute">
                {pending > 0 ? t('ws.queueCount', { count: pending }) : t('ws.doneCount', { count: stats.done })}
              </span>
            ) : null}
          </div>

          {items.length === 0 ? (
            <div data-testid="empty-state">
              <div className="mb-5 text-center">
                <p className="text-[15px] font-semibold">{t('ws.emptyTitle')}</p>
                <p className="mx-auto mt-1 max-w-[36ch] text-[12.5px] leading-relaxed text-ink-mute">
                  {t('ws.emptyDesc')}
                </p>
              </div>
              <DropZone onFiles={(files) => void addFiles(files)} compact />
            </div>
          ) : (
            <Preview key={`${tool}:${selectedId}`} tool={tool} />
          )}

          {selectedSaved !== null && Math.abs(selectedSaved) > 0.05 ? (
            <p className="mt-3 text-[12px] text-ink-mute">
              {selectedSaved >= 0 ? t('ws.saved') : t('ws.grew')} {Math.abs(selectedSaved).toFixed(1)}%
            </p>
          ) : null}
        </section>
      </div>

      {/* Files */}
      {items.length > 0 ? (
        <section className="card mt-5 overflow-hidden" aria-label={t('ws.filesTitle')}>
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <h2 className="text-[14px] font-semibold">
              {t('ws.filesTitle')}
              <span className="ml-2 text-[12px] font-normal text-ink-mute">{items.length}</span>
            </h2>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={running ? <SpinnerIcon size={14} /> : <DownloadIcon size={15} />}
                disabled={!hasOutputs || running}
                data-testid="download-zip"
                onClick={() => void downloadAll(tool)}
              >
                {t('ws.downloadAll')}
              </Button>
            </div>
          </header>
          <FileList tool={tool} />
          <p className="border-t border-line px-4 py-2.5 text-[11.5px] text-ink-mute">{t('ws.zipNote')}</p>
        </section>
      ) : null}

      <HistoryPanel />

      {/* Mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            className="h-11 flex-1"
            loading={running}
            disabled={items.length === 0}
            data-testid="process-mobile"
            onClick={() => void run(tool)}
          >
            {running ? t('ws.processing') : processLabel}
          </Button>
          {running ? (
            <Button variant="secondary" className="h-11" onClick={stop}>
              {t('ws.stop')}
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="h-11"
              disabled={!hasOutputs}
              onClick={() => void downloadAll(tool)}
              icon={<DownloadIcon size={16} />}
            >
              ZIP
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
