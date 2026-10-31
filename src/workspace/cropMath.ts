import type { NormalisedRect } from './ops'

/**
 * Geometry for the interactive crop box. Rectangles are normalised to 0 – 1 so
 * the same selection can be drawn at any preview size and still map exactly to
 * source pixels. Pure functions — covered by unit tests.
 */

export type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export const MIN_SIZE = 0.03

export const FULL_RECT: NormalisedRect = { x: 0, y: 0, width: 1, height: 1 }

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Keeps a rectangle inside the image and above the minimum size. */
export function clampNormalised(rect: NormalisedRect, min = MIN_SIZE): NormalisedRect {
  const width = clamp(rect.width, min, 1)
  const height = clamp(rect.height, min, 1)
  const x = clamp(rect.x, 0, 1 - width)
  const y = clamp(rect.y, 0, 1 - height)
  return { x, y, width, height }
}

/**
 * Largest rectangle with a given *pixel* aspect ratio, centred in the image.
 * `ratio` is width / height in pixels; `null` returns the full image.
 */
export function centerRectForRatio(
  ratio: number | null,
  pixelWidth: number,
  pixelHeight: number,
): NormalisedRect {
  if (!ratio || pixelWidth <= 0 || pixelHeight <= 0) return FULL_RECT
  const imageRatio = pixelWidth / pixelHeight
  if (ratio >= imageRatio) {
    const width = 1
    const height = clamp(pixelWidth / (ratio * pixelHeight), MIN_SIZE, 1)
    return { x: 0, y: (1 - height) / 2, width, height }
  }
  const width = clamp((ratio * pixelHeight) / pixelWidth, MIN_SIZE, 1)
  return { x: (1 - width) / 2, y: 0, width, height: 1 }
}

/** Moves a rectangle without changing its size, keeping it inside the image. */
export function moveRect(rect: NormalisedRect, dx: number, dy: number): NormalisedRect {
  return {
    x: clamp(rect.x + dx, 0, 1 - rect.width),
    y: clamp(rect.y + dy, 0, 1 - rect.height),
    width: rect.width,
    height: rect.height,
  }
}

export interface ResizeOptions {
  /** Pixel aspect ratio to enforce, or null for free resizing. */
  ratio: number | null
  pixelWidth: number
  pixelHeight: number
}

/**
 * Drags one handle by (dx, dy) in normalised units.
 * With a ratio the resize is driven by the dominant axis and anchored to the
 * opposite corner, which is what every image editor does.
 */
export function resizeRect(
  rect: NormalisedRect,
  handle: Handle,
  dx: number,
  dy: number,
  options: ResizeOptions,
): NormalisedRect {
  const { ratio, pixelWidth, pixelHeight } = options
  let left = rect.x
  let top = rect.y
  let right = rect.x + rect.width
  let bottom = rect.y + rect.height

  const horizontal = handle.includes('w') ? -1 : handle.includes('e') ? 1 : 0
  const vertical = handle.includes('n') ? -1 : handle.includes('s') ? 1 : 0

  if (horizontal === -1) left = clamp(left + dx, 0, right - MIN_SIZE)
  if (horizontal === 1) right = clamp(right + dx, left + MIN_SIZE, 1)
  if (vertical === -1) top = clamp(top + dy, 0, bottom - MIN_SIZE)
  if (vertical === 1) bottom = clamp(bottom + dy, top + MIN_SIZE, 1)

  let width = right - left
  let height = bottom - top

  if (ratio && pixelWidth > 0 && pixelHeight > 0) {
    const k = pixelWidth / pixelHeight
    if (horizontal !== 0 || vertical === 0) {
      height = (width * k) / ratio
    } else {
      width = (height * ratio) / k
    }

    // Anchor: opposite corner / edge stays fixed.
    let anchorX: number
    if (horizontal === -1) anchorX = right
    else if (horizontal === 1) anchorX = left
    else anchorX = left + width / 2
    let anchorY: number
    if (vertical === -1) anchorY = bottom
    else if (vertical === 1) anchorY = top
    else anchorY = top + height / 2

    const availableW = horizontal === -1 ? anchorX : horizontal === 1 ? 1 - anchorX : 2 * Math.min(anchorX, 1 - anchorX)
    const availableH = vertical === -1 ? anchorY : vertical === 1 ? 1 - anchorY : 2 * Math.min(anchorY, 1 - anchorY)
    const scale = Math.min(1, availableW / width, availableH / height)
    width *= scale
    height *= scale

    if (width < MIN_SIZE) {
      width = MIN_SIZE
      height = (width * k) / ratio
    }
    if (height < MIN_SIZE) {
      height = MIN_SIZE
      width = (height * ratio) / k
    }

    left =
      horizontal === -1 ? anchorX - width : horizontal === 1 ? anchorX : anchorX - width / 2
    top = vertical === -1 ? anchorY - height : vertical === 1 ? anchorY : anchorY - height / 2
    right = left + width
    bottom = top + height
  }

  return clampNormalised({ x: left, y: top, width: right - left, height: bottom - top })
}

/** Pixel dimensions of a normalised rectangle. */
export function rectToPixels(
  rect: NormalisedRect,
  pixelWidth: number,
  pixelHeight: number,
): { x: number; y: number; width: number; height: number } {
  const width = Math.max(1, Math.round(rect.width * pixelWidth))
  const height = Math.max(1, Math.round(rect.height * pixelHeight))
  return {
    x: Math.min(Math.round(rect.x * pixelWidth), Math.max(pixelWidth - width, 0)),
    y: Math.min(Math.round(rect.y * pixelHeight), Math.max(pixelHeight - height, 0)),
    width,
    height,
  }
}
