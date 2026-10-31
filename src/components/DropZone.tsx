import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react'
import { useI18n } from '../i18n'
import { UploadIcon } from './Icons'

interface DropZoneProps {
  onFiles: (files: File[]) => void
  /** Extra class names for the wrapper. */
  className?: string
  compact?: boolean
}

/**
 * Accessible drag & drop + file picker.
 * The whole box is a button: it can be focused and activated with the keyboard,
 * and it exposes the same behaviour to screen readers as a file input.
 */
export function DropZone({ onFiles, className = '', compact = false }: DropZoneProps) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [active, setActive] = useState(false)
  const dragDepth = useRef(0)

  const accept = (list: FileList | null) => {
    if (!list || list.length === 0) return
    onFiles(Array.from(list))
  }

  const onDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    dragDepth.current += 1
    setActive(true)
  }

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setActive(false)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    dragDepth.current = 0
    setActive(false)
    accept(event.dataTransfer.files)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      inputRef.current?.click()
    }
  }

  return (
    <div
      className={`dropzone ${compact ? 'px-5 py-7' : 'px-6 py-12 sm:px-10 sm:py-16'} ${className}`.trim()}
      data-active={active}
      data-testid="dropzone"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
      aria-label={t('hero.browse')}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif,image/heic,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.heic"
        multiple
        className="sr-only"
        data-testid="file-input"
        onChange={(event) => {
          accept(event.target.files)
          // Reset so picking the same file twice still fires a change event.
          event.target.value = ''
        }}
      />

      <div className="pointer-events-none flex flex-col items-center text-center">
        <span
          className={`flex items-center justify-center rounded-full border border-line bg-surface text-accent shadow-[0_1px_2px_rgb(0_0_0_/_5%)] ${
            compact ? 'h-11 w-11' : 'mb-5 h-14 w-14'
          }`}
        >
          <UploadIcon size={compact ? 19 : 23} />
        </span>
        <p
          className={`mt-3 font-semibold tracking-[-0.01em] ${
            compact ? 'text-[15px]' : 'text-[19px] sm:text-[22px]'
          }`}
        >
          {active ? t('hero.dropActive') : t('hero.dropTitle')}
        </p>
        <span className="btn btn-primary btn-sm mt-4">{t('hero.browse')}</span>
        <p className="mt-4 text-[12.5px] text-ink-mute">{t('hero.formats')}</p>
        {!compact ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-ink-mute">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            {t('hero.local')}
          </p>
        ) : null}
      </div>
    </div>
  )
}
