import { extensionForFormat } from '../engine/formats'
import { baseName, buildOutputName, type RenameSettings } from '../engine/rename'
import type { EncodableFormat, InputFormat, ProcessOps, Rect, ToolId } from '../engine/types'

/**
 * Turns tool settings + per-item facts into pipeline ops and an output name.
 * Pure and unit tested: the UI never mutates image bytes directly.
 */

export interface CompressSettings {
  quality: number
  /** `original` keeps each file's own format when the browser can encode it. */
  format: EncodableFormat | 'original'
  /** Keep the source file when re-encoding produced something larger. */
  keepSmaller: boolean
}

export interface ConvertSettings {
  format: EncodableFormat
  quality: number
  background: string
}

export interface ResizeSettings {
  mode: 'pixels' | 'percent'
  width: string
  height: string
  lock: boolean
  percent: string
}

/** Crop rectangles are stored normalised (0 – 1) so they survive zooming. */
export interface NormalisedRect {
  x: number
  y: number
  width: number
  height: number
}

export interface CropSettings {
  ratioId: string
  rect: NormalisedRect
}

export interface Settings {
  compress: CompressSettings
  convert: ConvertSettings
  resize: ResizeSettings
  crop: CropSettings
  rename: RenameSettings
  info: Record<string, never>
}

export const DEFAULT_SETTINGS: Settings = {
  compress: { quality: 0.72, format: 'original', keepSmaller: true },
  convert: { format: 'webp', quality: 0.9, background: '#ffffff' },
  resize: { mode: 'pixels', width: '', height: '', lock: true, percent: '50' },
  crop: { ratioId: 'free', rect: { x: 0, y: 0, width: 1, height: 1 } },
  rename: { mode: 'template', prefix: 'pixelkit-', suffix: '', start: 1, digits: 3 },
  info: {},
}

/** The format a tool writes when it should stay close to the source. */
export function outputFormatForSource(
  sourceFormat: InputFormat,
  encoders: EncodableFormat[],
): EncodableFormat {
  if (sourceFormat === 'jpeg' && encoders.includes('jpeg')) return 'jpeg'
  if (sourceFormat === 'webp' && encoders.includes('webp')) return 'webp'
  if (sourceFormat === 'png' && encoders.includes('png')) return 'png'
  // GIF, BMP, AVIF, HEIC and anything unusual are flattened into PNG.
  if (encoders.includes('png')) return 'png'
  if (encoders.includes('jpeg')) return 'jpeg'
  return 'webp'
}

export interface OpsInput {
  tool: ToolId
  sourceFormat: InputFormat
  sourceName: string
  width: number
  height: number
  /** Position in the queue, used by the sequential renamer. */
  index: number
  settings: Settings
  encoders: EncodableFormat[]
}

export interface OpsPlan {
  ops: ProcessOps
  /** Suggested file name for the result. */
  name: string
  /** True when the tool only renames and must not touch pixels. */
  passthrough: boolean
}

function replaceExtension(name: string, extension: string): string {
  return `${baseName(name) || 'image'}.${extension}`
}

function cropRectFrom(settings: CropSettings, width: number, height: number): Rect {
  const { rect } = settings
  const x = Math.round(rect.x * width)
  const y = Math.round(rect.y * height)
  const w = Math.round(rect.width * width)
  const h = Math.round(rect.height * height)
  return {
    x: Math.min(Math.max(x, 0), Math.max(width - 1, 0)),
    y: Math.min(Math.max(y, 0), Math.max(height - 1, 0)),
    width: Math.min(Math.max(w, 1), width),
    height: Math.min(Math.max(h, 1), height),
  }
}

export function buildOpsPlan(input: OpsInput): OpsPlan {
  const { tool, settings, encoders, sourceFormat, sourceName, width, height } = input

  switch (tool) {
    case 'compress': {
      const format =
        settings.compress.format === 'original'
          ? outputFormatForSource(sourceFormat, encoders)
          : settings.compress.format
      return {
        ops: { format, quality: settings.compress.quality, flatten: format === 'jpeg' },
        name: replaceExtension(sourceName, extensionForFormat(format)),
        passthrough: false,
      }
    }
    case 'convert': {
      const format = settings.convert.format
      return {
        ops: {
          format,
          quality: settings.convert.quality,
          flatten: format === 'jpeg',
          background: settings.convert.background,
        },
        name: replaceExtension(sourceName, extensionForFormat(format)),
        passthrough: false,
      }
    }
    case 'resize': {
      const format = outputFormatForSource(sourceFormat, encoders)
      if (settings.resize.mode === 'percent') {
        const percent = Number(settings.resize.percent)
        const factor = Number.isFinite(percent) && percent > 0 ? percent / 100 : 1
        return {
          ops: {
            format,
            resize: {
              width: Math.max(1, Math.round(width * factor)),
              height: Math.max(1, Math.round(height * factor)),
            },
          },
          name: replaceExtension(sourceName, extensionForFormat(format)),
          passthrough: false,
        }
      }
      const targetWidth = Number(settings.resize.width)
      const targetHeight = Number(settings.resize.height)
      return {
        ops: {
          format,
          resize: {
            width: Number.isFinite(targetWidth) && targetWidth > 0 ? Math.round(targetWidth) : width,
            height: Number.isFinite(targetHeight) && targetHeight > 0 ? Math.round(targetHeight) : height,
          },
        },
        name: replaceExtension(sourceName, extensionForFormat(format)),
        passthrough: false,
      }
    }
    case 'crop': {
      const format = outputFormatForSource(sourceFormat, encoders)
      return {
        ops: { format, crop: cropRectFrom(settings.crop, width, height) },
        name: `${baseName(sourceName) || 'image'}-crop.${extensionForFormat(format)}`,
        passthrough: false,
      }
    }
    case 'rename': {
      const format = outputFormatForSource(sourceFormat, encoders)
      return {
        ops: { format },
        name: buildOutputName(settings.rename, input.index, sourceName, extensionForFormat(format)),
        passthrough: true,
      }
    }
    default:
      return {
        ops: { format: outputFormatForSource(sourceFormat, encoders) },
        name: sourceName,
        passthrough: true,
      }
  }
}
