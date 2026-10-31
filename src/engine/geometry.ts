import type { Rect } from './types'

/**
 * Pure geometry helpers. Everything here is unit tested and free of DOM APIs,
 * so the same maths drives the interactive crop UI and the pixel pipeline.
 */

export const MIN_DIMENSION = 1
export const MAX_DIMENSION = 16384

/** Clamps a rectangle so it stays inside `bounds` and is at least 1×1 px. */
export function clampRect(rect: Rect, bounds: { width: number; height: number }): Rect {
  const x = Math.min(Math.max(Math.round(rect.x), 0), Math.max(bounds.width - 1, 0))
  const y = Math.min(Math.max(Math.round(rect.y), 0), Math.max(bounds.height - 1, 0))
  const width = Math.min(Math.max(Math.round(rect.width), MIN_DIMENSION), bounds.width - x)
  const height = Math.min(Math.max(Math.round(rect.height), MIN_DIMENSION), bounds.height - y)
  return { x, y, width, height }
}

/** The largest rectangle with the given aspect ratio (w / h) centred in bounds. */
export function centerAspectRect(
  aspect: number,
  bounds: { width: number; height: number },
): Rect {
  const boundsAspect = bounds.width / bounds.height
  let width = bounds.width
  let height = bounds.height
  if (aspect > boundsAspect) {
    height = bounds.width / aspect
  } else {
    width = bounds.height * aspect
  }
  width = Math.max(MIN_DIMENSION, Math.round(width))
  height = Math.max(MIN_DIMENSION, Math.round(height))
  return {
    x: Math.round((bounds.width - width) / 2),
    y: Math.round((bounds.height - height) / 2),
    width,
    height,
  }
}

/** Scales a rect by `factor`, keeping it inside bounds. */
export function scaleRect(rect: Rect, factor: number, bounds: { width: number; height: number }): Rect {
  const centerX = rect.x + rect.width / 2
  const centerY = rect.y + rect.height / 2
  const width = rect.width * factor
  const height = rect.height * factor
  return clampRect(
    { x: centerX - width / 2, y: centerY - height / 2, width, height },
    bounds,
  )
}

/** Parses a dimension typed by the user. Returns null for anything unusable. */
export function parseDimension(raw: string | number): number | null {
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return null
    const value = Math.round(raw)
    return value >= MIN_DIMENSION && value <= MAX_DIMENSION ? value : null
  }
  const trimmed = raw.trim()
  if (trimmed === '' || !/^\d+$/.test(trimmed)) return null
  const value = Number.parseInt(trimmed, 10)
  return value >= MIN_DIMENSION && value <= MAX_DIMENSION ? value : null
}

/** Fits within a box while preserving the aspect ratio. */
export function fitWithin(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / width, maxHeight / height)
  if (!Number.isFinite(ratio) || ratio <= 0) return { width: MIN_DIMENSION, height: MIN_DIMENSION }
  return {
    width: Math.max(MIN_DIMENSION, Math.round(width * ratio)),
    height: Math.max(MIN_DIMENSION, Math.round(height * ratio)),
  }
}

/** New size after scaling by a percentage (10 – 400). */
export function scaleByPercent(
  width: number,
  height: number,
  percent: number,
): { width: number; height: number } {
  const factor = Math.min(Math.max(percent, 1), 400) / 100
  return {
    width: Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, Math.round(width * factor))),
    height: Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, Math.round(height * factor))),
  }
}

/** Height that keeps the original aspect ratio for a given width. */
export function heightForWidth(width: number, source: { width: number; height: number }): number {
  return Math.max(MIN_DIMENSION, Math.round((width * source.height) / source.width))
}

/** Width that keeps the original aspect ratio for a given height. */
export function widthForHeight(height: number, source: { width: number; height: number }): number {
  return Math.max(MIN_DIMENSION, Math.round((height * source.width) / source.height))
}

/** A percentage label such as "62%" for a target size relative to the source. */
export function relativePercent(target: { width: number; height: number }, source: { width: number; height: number }): number {
  if (source.width <= 0) return 100
  return Math.round((target.width / source.width) * 100)
}

export const SIZE_PRESETS: { id: string; width: number; height: number | null }[] = [
  { id: 'hd', width: 1920, height: 1080 },
  { id: 'instagram', width: 1080, height: 1080 },
  { id: 'story', width: 1080, height: 1920 },
  { id: 'twitter', width: 1600, height: 900 },
  { id: 'thumb', width: 640, height: 640 },
]

export const CROP_RATIOS: { id: string; label: string; value: number | null }[] = [
  { id: 'free', label: 'free', value: null },
  { id: '1:1', label: '1:1', value: 1 },
  { id: '4:3', label: '4:3', value: 4 / 3 },
  { id: '3:2', label: '3:2', value: 3 / 2 },
  { id: '16:9', label: '16:9', value: 16 / 9 },
  { id: '9:16', label: '9:16', value: 9 / 16 },
]
