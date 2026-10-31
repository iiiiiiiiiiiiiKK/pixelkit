import { MAX_DIMENSION } from './geometry'
import { MAX_OUTPUT_PIXELS, mimeForFormat } from './formats'
import type { EncodableFormat, ProcessOps, Rect } from './types'

/**
 * Canvas level rendering. Shared by the Web Worker (OffscreenCanvas) and the
 * main-thread fallback (HTMLCanvasElement) so both paths behave identically.
 */

export type AnyCanvas = OffscreenCanvas | HTMLCanvasElement
export type AnyContext2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

export const HAS_OFFSCREEN_CANVAS =
  typeof OffscreenCanvas !== 'undefined' && typeof OffscreenCanvas.prototype.convertToBlob === 'function'

export function createCanvas(width: number, height: number): AnyCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height)
  }
  if (typeof document === 'undefined') {
    // Inside a worker without OffscreenCanvas there is nothing to draw on.
    throw new Error('worker-unsupported')
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

export function createContext(canvas: AnyCanvas): AnyContext2D {
  const context = canvas.getContext('2d') as AnyContext2D | null
  if (!context) throw new Error('canvas-2d-unavailable')
  return context
}

export interface TargetPlan {
  /** Area of the source bitmap to read. */
  source: Rect
  /** Final output size in pixels. */
  output: { width: number; height: number }
}

/**
 * Works out what to cut out and what size to write, validating every bound so a
 * malicious or accidental huge request cannot exhaust memory.
 */
export function planTarget(
  sourceWidth: number,
  sourceHeight: number,
  ops: ProcessOps,
): TargetPlan {
  const full: Rect = { x: 0, y: 0, width: sourceWidth, height: sourceHeight }
  let source = full
  if (ops.crop) {
    const width = Math.min(Math.max(Math.round(ops.crop.width), 1), sourceWidth)
    const height = Math.min(Math.max(Math.round(ops.crop.height), 1), sourceHeight)
    const x = Math.min(Math.max(Math.round(ops.crop.x), 0), sourceWidth - width)
    const y = Math.min(Math.max(Math.round(ops.crop.y), 0), sourceHeight - height)
    source = { x, y, width, height }
  }

  const output = ops.resize
    ? {
        width: Math.min(Math.max(Math.round(ops.resize.width), 1), MAX_DIMENSION),
        height: Math.min(Math.max(Math.round(ops.resize.height), 1), MAX_DIMENSION),
      }
    : { width: source.width, height: source.height }

  if (output.width * output.height > MAX_OUTPUT_PIXELS) {
    throw new RangeError('too-large')
  }
  return { source, output }
}

/** Draws `source` into `target` with progressive halving for crisp downscales. */
function drawStepped(
  target: AnyContext2D,
  source: CanvasImageSource,
  sourceRect: Rect,
  width: number,
  height: number,
): void {
  let currentW = Math.round(sourceRect.width)
  let currentH = Math.round(sourceRect.height)
  let current: CanvasImageSource = source
  let sx = sourceRect.x
  let sy = sourceRect.y

  // Cropping with drawImage is exact, but a single huge downscale looks soft.
  // Halving repeatedly (every step at most 2×) keeps edges crisp.
  while (currentW > width * 2 && currentH > height * 2) {
    const nextW = Math.max(width, Math.round(currentW / 2))
    const nextH = Math.max(height, Math.round(currentH / 2))
    const step = createCanvas(nextW, nextH)
    const stepContext = createContext(step)
    stepContext.imageSmoothingEnabled = true
    stepContext.imageSmoothingQuality = 'high'
    const scaleX = nextW / currentW
    const scaleY = nextH / currentH
    stepContext.drawImage(current, sx, sy, currentW, currentH, 0, 0, nextW, nextH)
    sx = 0
    sy = 0
    current = step
    currentW = nextW
    currentH = nextH
    void scaleX
    void scaleY
  }

  target.imageSmoothingEnabled = true
  target.imageSmoothingQuality = 'high'
  target.drawImage(current, sx, sy, currentW, currentH, 0, 0, width, height)
}

/** Renders the operation into a fresh canvas and returns it. */
export function renderProcessed(
  bitmap: ImageBitmap,
  ops: ProcessOps,
  plan: TargetPlan,
): AnyCanvas {
  const canvas = createCanvas(plan.output.width, plan.output.height)
  const context = createContext(canvas)

  const needsFlatten = ops.format === 'jpeg' || ops.flatten === true
  if (needsFlatten) {
    context.fillStyle = ops.background ?? '#ffffff'
    context.fillRect(0, 0, plan.output.width, plan.output.height)
  }

  drawStepped(context, bitmap, plan.source, plan.output.width, plan.output.height)
  return canvas
}

/** Encodes a canvas, verifying that the browser really produced the format. */
export async function encodeCanvas(
  canvas: AnyCanvas,
  format: EncodableFormat,
  quality?: number,
): Promise<Blob> {
  const mime = mimeForFormat(format)
  const safeQuality = format === 'png' ? undefined : clampQuality(quality)

  const blob = await toBlob(canvas, mime, safeQuality)
  if (!blob) throw new Error('encode-failed')
  if (blob.type.split(';')[0] !== mime) {
    // The browser silently fell back to another format (e.g. PNG). Renaming the
    // extension would produce a broken file, so fail loudly instead.
    throw new Error('encode-unsupported')
  }
  return blob
}

function clampQuality(quality?: number): number {
  if (typeof quality !== 'number' || !Number.isFinite(quality)) return 0.85
  return Math.min(Math.max(quality, 0.05), 1)
}

function toBlob(canvas: AnyCanvas, mime: string, quality?: number): Promise<Blob | null> {
  if ('convertToBlob' in canvas) {
    return canvas.convertToBlob({ type: mime, quality }).catch(() => null)
  }
  return new Promise((resolve) => {
    ;(canvas as HTMLCanvasElement).toBlob((blob) => resolve(blob), mime, quality)
  })
}

const ALPHA_SAMPLE_MAX = 128

/** Samples a downscaled copy to find out whether the source has transparency. */
export function detectTransparency(bitmap: ImageBitmap): boolean {
  const scale = Math.min(1, ALPHA_SAMPLE_MAX / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = createCanvas(width, height)
  const context = createContext(canvas)
  context.drawImage(bitmap, 0, 0, width, height)
  let data: Uint8ClampedArray
  try {
    data = context.getImageData(0, 0, width, height).data
  } catch {
    return false
  }
  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 250) return true
  }
  return false
}
