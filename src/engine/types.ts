/** Shared types for the PixelKit processing engine. */

export type ToolId = 'compress' | 'convert' | 'resize' | 'crop' | 'rename' | 'info'

/** Formats PixelKit can *encode*. Read support is broader — see InputFormat. */
export type EncodableFormat = 'jpeg' | 'png' | 'webp'

/** Formats we can recognise from magic bytes (read support depends on the browser). */
export type InputFormat =
  | 'jpeg'
  | 'png'
  | 'webp'
  | 'gif'
  | 'bmp'
  | 'avif'
  | 'heic'
  | 'svg'
  | 'unknown'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface ProcessOps {
  /** Target container format. */
  format: EncodableFormat
  /** 0.05 – 1. Lossy formats only; ignored for PNG. */
  quality?: number
  /** Crop rectangle in source pixel space, before any resize. */
  crop?: Rect
  /** Exact output size in pixels, applied after cropping. */
  resize?: { width: number; height: number }
  /** Paint this colour behind transparent pixels before encoding. */
  background?: string
  /** Whether the background should be painted at all (JPEG always flattens). */
  flatten?: boolean
}

export type ErrorCode =
  | 'empty'
  | 'unsupported-format'
  | 'decode-failed'
  | 'encode-failed'
  | 'too-large'
  | 'aborted'
  /** Internal: the worker cannot render (no OffscreenCanvas) — retry inline. */
  | 'worker-unsupported'
  | 'unknown'

export interface ProcessResult {
  blob: Blob
  width: number
  height: number
  mime: string
  /** True when the *source* had non-opaque pixels. */
  hadTransparency: boolean
  ms: number
}

export type WorkerRequest = {
  id: string
  blob: Blob
  ops: ProcessOps
}

export type WorkerResponse =
  | { id: string; type: 'progress'; progress: number; stage: 'decode' | 'draw' | 'encode' }
  | {
      id: string
      type: 'done'
      blob: Blob
      width: number
      height: number
      mime: string
      hadTransparency: boolean
      ms: number
    }
  | { id: string; type: 'error'; code: ErrorCode; detail?: string }
