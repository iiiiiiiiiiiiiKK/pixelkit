import { useI18n } from '../../i18n'
import { Notice } from '../../components/ui'
import { useWorkspace } from '../store'
import { formatBytes, formatPercent, savedPercent } from '../../engine/formats'

/** Image info panel. Only real, readable facts — no invented EXIF. */
export function InfoPanel() {
  const { t, lang } = useI18n()
  const { items } = useWorkspace()

  if (items.length === 0) {
    return <p className="text-[13px] text-ink-mute">{t('panel.info.empty')}</p>
  }

  return (
    <div className="space-y-4">
      <div className="scroll-x rounded-[10px] border border-line">
        <table className="w-full min-w-[520px] border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-raised text-left text-ink-mute">
              <th className="px-3 py-2 font-medium">{t('panel.info.filename')}</th>
              <th className="px-3 py-2 font-medium">{t('panel.info.format')}</th>
              <th className="px-3 py-2 font-medium">{t('panel.info.dimensions')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('panel.info.size')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('panel.info.savings')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const output = item.output
              const saved = output ? savedPercent(item.size, output.size) : null
              return (
                <tr key={item.id} className="border-t border-line align-top">
                  <td className="max-w-[220px] truncate px-3 py-2 text-ink" title={item.name}>
                    {item.name}
                  </td>
                  <td className="px-3 py-2 text-ink-soft">{item.format.toUpperCase()}</td>
                  <td className="mono px-3 py-2 text-ink-soft">
                    {item.width} × {item.height}
                    <span className="ml-2 text-ink-mute">
                      {((item.width * item.height) / 1_000_000).toFixed(1)} {t('unit.mp')}
                    </span>
                  </td>
                  <td className="mono px-3 py-2 text-right text-ink-soft">
                    {formatBytes(item.size, lang)}
                    {output ? (
                      <span className="block text-ink">
                        → {formatBytes(output.size, lang)}
                      </span>
                    ) : null}
                  </td>
                  <td className="mono px-3 py-2 text-right">
                    {saved === null ? (
                      <span className="text-ink-mute">—</span>
                    ) : (
                      <span className={saved >= 0 ? 'text-accent' : 'text-warn'}>{formatPercent(saved)}</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Notice>{t('panel.info.notice')}</Notice>
    </div>
  )
}
