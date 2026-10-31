import { MAX_SOURCE_PIXELS } from './formats'
import { detectTransparency, encodeCanvas, planTarget, renderProcessed } from './render'
import type { ProcessOps, ProcessResult } from './types'

/**
 * The single processing pipeline. Runs inside a Web Worker when the browser
 * supports it (see processor.worker.ts) and on the main thread otherwise.
 */

export type ProgressStage = 'decode' | 'draw' | 'encode'

export class ProcessingError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ProcessingError'
    this.code = code
  }
}

async function decodeBitmap(blob: Blob): Promise<ImageBitmap> {
  if (typeof createImageBitmap !== 'function') {
    throw new ProcessingError('decode-failed', 'createImageBitmap is unavailable')
  }
  try {
    // `from-image` respects EXIF orientation, which is what phone photos need.
    return await createImageBitmap(blob, { imageOrientation: 'from-image' })
  } catch {
    try {
      return await createImageBitmap(blob)
    } catch {
      throw new ProcessingError('decode-failed', 'The browser could not decode this file')
    }
  }
}

export async function runPipeline(
  blob: Blob,
  ops: ProcessOps,
  onProgress?: (progress: number, stage: ProgressStage) => void,
): Promise<ProcessResult> {
  const startedAt = now()
  onProgress?.(0.15, 'decode')

  const bitmap = await decodeBitmap(blob)
  try {
    if (bitmap.width * bitmap.height > MAX_SOURCE_PIXELS) {
      throw new ProcessingError('too-large', 'Source image has too many pixels')
    }
    const hadTransparency = detectTransparency(bitmap)
    onProgress?.(0.45, 'draw')

    let plan
    try {
      plan = planTarget(bitmap.width, bitmap.height, ops)
    } catch (error) {
      if (error instanceof RangeError) {
        throw new ProcessingError('too-large', 'Requested output is too large')
      }
      throw error
    }

    const canvas = renderProcessed(bitmap, ops, plan)
    onProgress?.(0.75, 'encode')

    let encoded: Blob
    try {
      encoded = await encodeCanvas(canvas, ops.format, ops.quality)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'encode-failed'
      throw new ProcessingError('encode-failed', message)
    }

    onProgress?.(1, 'encode')
    return {
      blob: encoded,
      width: plan.output.width,
      height: plan.output.height,
      mime: encoded.type,
      hadTransparency,
      ms: Math.max(0, Math.round(now() - startedAt)),
    }
  } finally {
    bitmap.close()
  }
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}
