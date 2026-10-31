import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useI18n } from '../i18n'
import { useWorkspace } from './store'
import { CROP_RATIOS } from '../engine/geometry'
import { moveRect, rectToPixels, resizeRect, type Handle } from './cropMath'

/**
 * Handles sit *inside* the selection: the preview is clipped with overflow
 * hidden, so a handle centred on the border would be half unclickable.
 */
const HANDLES: { id: Handle; className: string }[] = [
  { id: 'nw', className: 'left-0 top-0 cursor-nwse-resize' },
  { id: 'n', className: 'left-1/2 top-0 -translate-x-1/2 cursor-ns-resize' },
  { id: 'ne', className: 'right-0 top-0 cursor-nesw-resize' },
  { id: 'e', className: 'right-0 top-1/2 -translate-y-1/2 cursor-ew-resize' },
  { id: 'se', className: 'right-0 bottom-0 cursor-nwse-resize' },
  { id: 's', className: 'left-1/2 bottom-0 -translate-x-1/2 cursor-ns-resize' },
  { id: 'sw', className: 'left-0 bottom-0 cursor-nesw-resize' },
  { id: 'w', className: 'left-0 top-1/2 -translate-y-1/2 cursor-ew-resize' },
]

interface DragState {
  mode: 'move' | 'resize'
  handle: Handle | null
  startX: number
  startY: number
  startRect: { x: number; y: number; width: number; height: number }
}

/**
 * Interactive crop box. Pointer events cover mouse, pen and touch, so the same
 * code path works on an iPhone. Arrow keys nudge, Shift + arrows resize.
 */
export function CropEditor() {
  const { t } = useI18n()
  const { items, selectedId, settings, updateSettings } = useWorkspace()
  const item = items.find((entry) => entry.id === selectedId) ?? items[0]

  const containerRef = useRef<HTMLDivElement>(null)
  const [available, setAvailable] = useState(0)
  const dragRef = useRef<DragState | null>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0
      setAvailable(width)
    })
    observer.observe(element)
    setAvailable(element.clientWidth)
    return () => observer.disconnect()
  }, [])

  const ratio = useMemo(() => {
    const found = CROP_RATIOS.find((entry) => entry.id === settings.crop.ratioId)
    return found?.value ?? null
  }, [settings.crop.ratioId])

  const display = useMemo(() => {
    if (!item || item.width === 0 || item.height === 0 || available === 0) {
      return { width: 0, height: 0 }
    }
    const maxHeight = Math.min(560, Math.max(240, Math.round(window.innerHeight * 0.58)))
    const scale = Math.min(available / item.width, maxHeight / item.height)
    return {
      width: Math.max(1, Math.round(item.width * scale)),
      height: Math.max(1, Math.round(item.height * scale)),
    }
  }, [item, available])

  const rect = settings.crop.rect

  const commit = useCallback(
    (next: { x: number; y: number; width: number; height: number }) => {
      updateSettings('crop', { rect: next })
    },
    [updateSettings],
  )

  const onPointerDown = (event: PointerEvent<HTMLElement>, mode: 'move' | 'resize', handle: Handle | null) => {
    if (!item || display.width === 0) return
    event.preventDefault()
    event.stopPropagation()
    ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
    dragRef.current = {
      mode,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startRect: { ...rect },
    }
    setDragging(true)
  }

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag || !item || display.width === 0) return
    const dx = (event.clientX - drag.startX) / display.width
    const dy = (event.clientY - drag.startY) / display.height
    if (drag.mode === 'move') {
      commit(moveRect(drag.startRect, dx, dy))
      return
    }
    if (!drag.handle) return
    commit(
      resizeRect(drag.startRect, drag.handle, dx, dy, {
        ratio,
        pixelWidth: item.width,
        pixelHeight: item.height,
      }),
    )
  }

  const endDrag = () => {
    dragRef.current = null
    setDragging(false)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.02 : 0.005
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
    event.preventDefault()
    if (!item) return
    const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0
    const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0
    const handle: Handle = event.shiftKey
      ? (dy < 0 ? 'n' : dy > 0 ? 's' : dx < 0 ? 'w' : 'e')
      : 'se'
    if (event.shiftKey) {
      commit(
        resizeRect(
          rect,
          handle,
          dx * 2,
          dy * 2,
          { ratio, pixelWidth: item.width, pixelHeight: item.height },
        ),
      )
    } else {
      commit(moveRect(rect, dx, dy))
    }
  }

  if (!item) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-[14px] border border-dashed border-line-strong text-[13px] text-ink-mute">
        {t('panel.crop.noImage')}
      </div>
    )
  }

  const pixels = rectToPixels(rect, item.width, item.height)

  return (
    <div className="flex flex-col items-center">
      <div ref={containerRef} className="w-full">
        <div
          className="relative mx-auto overflow-hidden rounded-[12px] bg-raised select-none touch-none"
          style={{ width: display.width || '100%', height: display.height || 240 }}
        >
          <img
            src={item.previewUrl}
            alt={t('ws.previewAlt', { name: item.name })}
            className="pointer-events-none h-full w-full object-contain"
            draggable={false}
          />

          <div
            className="absolute cursor-move"
            style={{
              left: `${rect.x * 100}%`,
              top: `${rect.y * 100}%`,
              width: `${rect.width * 100}%`,
              height: `${rect.height * 100}%`,
              boxShadow: '0 0 0 9999px rgb(0 0 0 / 55%)',
              outline: '1.5px solid #ffffff',
              outlineOffset: '-1.5px',
            }}
            onPointerDown={(event) => onPointerDown(event, 'move', null)}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={onKeyDown}
            role="group"
            tabIndex={0}
            aria-label={`${t('panel.crop.selection')} ${pixels.width} × ${pixels.height}`}
            data-dragging={dragging}
            data-testid="crop-box"
          >
            {/* Thirds guides */}
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <div className="absolute left-1/3 top-0 h-full w-px bg-white/70" />
              <div className="absolute left-2/3 top-0 h-full w-px bg-white/70" />
              <div className="absolute left-0 top-1/3 h-px w-full bg-white/70" />
              <div className="absolute left-0 top-2/3 h-px w-full bg-white/70" />
            </div>

            {HANDLES.map((handle) => (
              <button
                key={handle.id}
                type="button"
                aria-label={`${t('panel.crop.selection')} ${handle.id}`}
                className={`crop-handle ${handle.className}`}
                onPointerDown={(event) => onPointerDown(event, 'resize', handle.id)}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                tabIndex={-1}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="mono mt-3 text-[12.5px] text-ink-mute">
        {t('panel.crop.output')} · {pixels.width} × {pixels.height} {t('unit.px')}
      </p>
    </div>
  )
}
