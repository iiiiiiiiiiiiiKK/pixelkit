import { useI18n } from '../i18n'
import { formatBytes } from '../engine/formats'
import { toolMeta } from '../toolCatalog'
import { useWorkspace } from './store'

/** Session-only processing history. Lives in memory; reload clears it. */
export function HistoryPanel() {
  const { t, lang } = useI18n()
  const { history, clearHistory } = useWorkspace()

  return (
    <section className="card mt-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="text-[14px] font-semibold">{t('history.title')}</h2>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={clearHistory}
          disabled={history.length === 0}
        >
          {t('history.clear')}
        </button>
      </header>

      {history.length === 0 ? (
        <div className="px-4 py-6">
          <p className="text-[13px] text-ink-mute">{t('history.empty')}</p>
          <p className="mt-1.5 text-[12px] text-ink-mute">{t('history.note')}</p>
        </div>
      ) : (
        <div className="scroll-x">
          <table className="w-full min-w-[520px] border-collapse text-[12.5px]" data-testid="history-table">
            <thead>
              <tr className="bg-raised/70 text-left text-ink-mute">
                <th className="px-4 py-2 font-medium">{t('history.columns.name')}</th>
                <th className="px-3 py-2 font-medium">{t('history.columns.tool')}</th>
                <th className="px-3 py-2 text-right font-medium">{t('history.columns.size')}</th>
                <th className="px-4 py-2 text-right font-medium">{t('history.columns.status')}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => (
                <tr key={record.id} className="border-t border-line">
                  <td className="max-w-[240px] truncate px-4 py-2 text-ink" title={record.name}>
                    {record.name}
                  </td>
                  <td className="px-3 py-2 text-ink-soft">{t(toolMeta(record.tool).nameKey)}</td>
                  <td className="mono px-3 py-2 text-right text-ink-soft">
                    {record.outputSize === null ? '—' : formatBytes(record.outputSize, lang)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className={record.status === 'done' ? 'badge badge-ok' : 'badge badge-error'}>
                      {record.status === 'done' ? t('ws.status.done') : t('ws.status.error')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
