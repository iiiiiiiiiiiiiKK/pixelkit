/// <reference lib="webworker" />
import { ProcessingError, runPipeline } from './pipeline'
import type { ErrorCode, WorkerRequest, WorkerResponse } from './types'

/**
 * Worker entry point. Keeping decode + resize + encode off the main thread is
 * what stops a batch of 12 MP photos from freezing the page on a phone.
 */

const scope = self as unknown as DedicatedWorkerGlobalScope

/**
 * WebKit before 16.4 does not expose OffscreenCanvas inside workers. When that
 * happens the main thread takes over (client.ts retries inline), so answer with
 * an explicit code instead of crashing on `document`.
 */
const CAN_RENDER = typeof OffscreenCanvas !== 'undefined'

scope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, blob, ops } = event.data
  const post = (message: WorkerResponse): void => {
    scope.postMessage(message)
  }

  if (!CAN_RENDER) {
    post({ id, type: 'error', code: 'worker-unsupported', detail: 'OffscreenCanvas unavailable' })
    return
  }

  try {
    const result = await runPipeline(blob, ops, (progress, stage) => {
      post({ id, type: 'progress', progress, stage })
    })
    // A Blob is structured-cloneable but NOT transferable, so it is cloned
    // (cheap — the browser shares the underlying bytes) instead of moved.
    post({
      id,
      type: 'done',
      blob: result.blob,
      width: result.width,
      height: result.height,
      mime: result.mime,
      hadTransparency: result.hadTransparency,
      ms: result.ms,
    })
  } catch (error) {
    const code: ErrorCode = error instanceof ProcessingError ? (error.code as ErrorCode) : 'unknown'
    post({
      id,
      type: 'error',
      code,
      detail: error instanceof Error ? error.message : String(error),
    })
  }
}
