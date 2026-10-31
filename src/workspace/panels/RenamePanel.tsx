import { useI18n } from '../../i18n'
import { Field, Notice, Segmented } from '../../components/ui'
import { useWorkspace } from '../store'
import { buildOpsPlan } from '../ops'
import { dedupeEntryNames } from '../../engine/zip'

export function RenamePanel() {
  const { t } = useI18n()
  const { settings, updateSettings, items, encoders } = useWorkspace()
  const rename = settings.rename

  const names = dedupeEntryNames(
    items.map((item, index) =>
      buildOpsPlan({
        tool: 'rename',
        sourceFormat: item.format,
        sourceName: item.name,
        width: item.width,
        height: item.height,
        index,
        settings,
        encoders,
      }).name,
    ),
  )

  return (
    <div className="space-y-6">
      <Field label={t('panel.rename.mode')}>
        <Segmented
          ariaLabel={t('panel.rename.mode')}
          options={[
            { value: 'template', label: t('panel.rename.mode.template') },
            { value: 'keep', label: t('panel.rename.mode.keep') },
          ]}
          value={rename.mode}
          onChange={(mode) => updateSettings('rename', { mode })}
        />
      </Field>

      {rename.mode === 'template' ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('panel.rename.prefix')} htmlFor="rename-prefix">
            <input
              id="rename-prefix"
              className="input"
              value={rename.prefix}
              onChange={(event) => updateSettings('rename', { prefix: event.target.value })}
            />
          </Field>
          <Field label={t('panel.rename.suffix')} htmlFor="rename-suffix">
            <input
              id="rename-suffix"
              className="input"
              value={rename.suffix}
              onChange={(event) => updateSettings('rename', { suffix: event.target.value })}
            />
          </Field>
        </div>
      ) : null}

      {rename.mode === 'template' ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('panel.rename.start')} htmlFor="rename-start">
            <input
              id="rename-start"
              className="input"
              inputMode="numeric"
              value={String(rename.start)}
              onChange={(event) => {
                const value = event.target.value.replace(/[^\d]/g, '')
                updateSettings('rename', { start: value === '' ? 0 : Number(value) })
              }}
            />
          </Field>
          <Field label={t('panel.rename.digits')} htmlFor="rename-digits">
            <input
              id="rename-digits"
              className="input"
              inputMode="numeric"
              value={String(rename.digits)}
              onChange={(event) => {
                const value = event.target.value.replace(/[^\d]/g, '')
                updateSettings('rename', { digits: value === '' ? 1 : Number(value) })
              }}
            />
          </Field>
        </div>
      ) : null}

      <Notice>{t('panel.rename.note')}</Notice>

      <div>
        <p className="field-label">{t('panel.rename.preview')}</p>
        {names.length === 0 ? (
          <p className="text-[12.5px] text-ink-mute">{t('panel.rename.empty')}</p>
        ) : (
          <ol
            className="max-h-52 space-y-1 overflow-y-auto rounded-[10px] border border-line bg-raised/60 p-2.5"
            data-testid="rename-preview"
          >
            {names.map((name, index) => (
              <li key={`${name}-${index}`} className="mono flex items-center gap-2 text-[12.5px] text-ink-soft">
                <span className="w-5 shrink-0 text-right text-ink-mute">{index + 1}</span>
                <span className="truncate" data-testid="rename-preview-name">
                  {name}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
