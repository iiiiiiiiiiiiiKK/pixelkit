import { MAX_FILE_BYTES, detectInputFormat, formatForMime } from './formats'
import { ProcessingError, runPipeline, type ProgressStage } from './pipeline'
import type { EncodableFormat, InputFormat, ProcessOps, ProcessResult, WorkerRequest, WorkerResponse } from './types'

/**
 * Browser-facing facade over the processing pipeline.
 *
 * Prefers a Web Worker (so the UI keeps painting during a batch), falls back to
 * the main thread when workers or OffscreenCanvas are not available.
 */

export type FileRejectReason = 'empty' | 'too-large' | 'unsupported-format'

export interface FileInspection {
  format: InputFormat
  encodable: EncodableFormat | null
  ok: boolean
  reason?: FileRejectReason
}

const SNIFF_BYTES = 512

const DECODABLE: InputFormat[] = ['jpeg', 'png', 'webp', 'gif', 'bmp', 'avif']

/** Reads the first bytes of a file to decide what it really is. */
export async function inspectFile(file: File): Promise<FileInspection> {
  const buffer = await file.slice(0, SNIFF_BYTES).arrayBuffer()
  const format = detectInputFormat(new Uint8Array(buffer))
  const mimeFormat = formatForMime(file.type) ?? null

  if (file.size === 0) return { format, encodable: null, ok: false, reason: 'empty' }
  if (file.size > MAX_FILE_BYTES) return { format, encodable: null, ok: false, reason: 'too-large' }
  if (format === 'svg') return { format, encodable: null, ok: false, reason: 'unsupported-format' }
  if (!DECODABLE.includes(format)) {
    return { format, encodable: null, ok: false, reason: 'unsupported-format' }
  }
  return { format, encodable: mimeFormat, ok: true }
}

/* ------------------------------------------------------------------ worker -- */

let worker: Worker | null = null
let workerUnavailable = false
let requestCounter = 0

interface Inflight {
  resolve: (result: ProcessResult) => void
  reject: (error: unknown) => void
  onProgress?: (progress: number, stage: ProgressStage) => void
}

const inflight = new Map<string, Inflight>()

function getWorker(): Worker | null {
  if (workerUnavailable) return null
  if (worker) return worker
  if (!supportsWorkerPipeline()) {
    // No Worker, or no OffscreenCanvas to render into inside it.
    workerUnavailable = true
    return null
  }
  try {
    const instance = new Worker(new URL('./processor.worker.ts', import.meta.url), { type: 'module' })
    instance.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data
      const entry = inflight.get(message.id)
      if (!entry) return
      if (message.type === 'progress') {
        entry.onProgress?.(message.progress, message.stage)
        return
      }
      inflight.delete(message.id)
      if (message.type === 'done') {
        entry.resolve({
          blob: message.blob,
          width: message.width,
          height: message.height,
          mime: message.mime,
          hadTransparency: message.hadTransparency,
          ms: message.ms,
        })
      } else {
        entry.reject(new ProcessingError(message.code, message.detail ?? message.code))
      }
    }
    instance.onerror = () => {
      // A crashed worker must not leave promises hanging forever.
      workerUnavailable = true
      worker = null
      const pending = [...inflight.values()]
      inflight.clear()
      pending.forEach((entry) => entry.reject(new ProcessingError('unknown', 'worker-crashed')))
    }
    worker = instance
    return worker
  } catch {
    workerUnavailable = true
    return null
  }
}

/** Processes one image blob. Runs in a worker when possible. */
export async function processImage(
  blob: Blob,
  ops: ProcessOps,
  onProgress?: (progress: number, stage: ProgressStage) => void,
): Promise<ProcessResult> {
  const instance = getWorker()
  if (!instance) return runPipeline(blob, ops, onProgress)

  const id = `req-${(requestCounter += 1)}`
  try {
    return await new Promise<ProcessResult>((resolve, reject) => {
      inflight.set(id, { resolve, reject, onProgress })
      const request: WorkerRequest = { id, blob, ops }
      try {
        instance.postMessage(request)
      } catch (error) {
        inflight.delete(id)
        reject(error)
      }
    })
  } catch (error) {
    // Some browsers expose Worker but not OffscreenCanvas inside it (WebKit
    // before 16.4). That is not a user error: retry on the main thread.
    if (error instanceof ProcessingError && error.code === 'worker-unsupported') {
      workerUnavailable = true
      worker = null
      return runPipeline(blob, ops, onProgress)
    }
    throw error
  }
}

/* ------------------------------------------------------- encoder support --- */

let encoderPromise: Promise<EncodableFormat[]> | null = null

/**
 * Detects which output formats this browser can *actually* encode. Extensions
 * are never rewritten without the browser really producing those bytes, so a
 * format that is missing from this list is hidden instead of offered.
 */
export function getEncoderSupport(): Promise<EncodableFormat[]> {
  if (encoderPromise) return encoderPromise
  encoderPromise = (async () => {
    const candidates: EncodableFormat[] = ['jpeg', 'png', 'webp']
    const supported: EncodableFormat[] = []
    const canvas = document.createElement('canvas')
    canvas.width = 8
    canvas.height = 8
    const context = canvas.getContext('2d')
    if (context) {
      context.fillStyle = '#2f6f5f'
      context.fillRect(0, 0, 8, 8)
    }
    for (const format of candidates) {
      const ok = await new Promise<boolean>((resolve) => {
        try {
          canvas.toBlob(
            (blob) => resolve(blob !== null && blob.type === `image/${format}`),
            `image/${format}`,
            0.8,
          )
        } catch {
          resolve(false)
        }
      })
      if (ok) supported.push(format)
    }
    return supported
  })()
  return encoderPromise
}

/** True when the browser can decode in a worker with OffscreenCanvas. */
export function supportsWorkerPipeline(): boolean {
  return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined'
}
