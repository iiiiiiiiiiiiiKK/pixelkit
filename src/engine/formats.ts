import type { EncodableFormat, InputFormat } from './types'

/**
 * Format sniffing and small formatting helpers.
 *
 * PixelKit never trusts the file extension or the MIME type reported by the OS:
 * both are easy to get wrong (a `.png` that is really a JPEG is extremely
 * common). Everything is decided from the first bytes of the file.
 */

const JPEG = [0xff, 0xd8, 0xff]
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const GIF = [0x47, 0x49, 0x46, 0x38]

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false
  for (let i = 0; i < signature.length; i += 1) {
    if (bytes[i] !== signature[i]) return false
  }
  return true
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  let out = ''
  for (let i = start; i < end && i < bytes.length; i += 1) {
    out += String.fromCharCode(bytes[i])
  }
  return out
}

/** Detects the real container format of an image from its first bytes. */
export function detectInputFormat(bytes: Uint8Array): InputFormat {
  if (bytes.length < 4) return 'unknown'
  if (startsWith(bytes, JPEG)) return 'jpeg'
  if (startsWith(bytes, PNG)) return 'png'
  if (startsWith(bytes, GIF)) return 'gif'
  if (ascii(bytes, 0, 2) === 'BM') return 'bmp'
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') return 'webp'
  if (ascii(bytes, 4, 8) === 'ftyp') {
    const brand = ascii(bytes, 8, 12)
    if (brand === 'avif' || brand === 'avis') return 'avif'
    // iPhones produce HEIC by default; naming it lets us show a useful hint.
    if (brand === 'heic' || brand === 'heix' || brand === 'hevc' || brand === 'mif1' || brand === 'msf1') {
      return 'heic'
    }
    return 'unknown'
  }
  // Very small SVGs are still SVGs; this is a best-effort textual check.
  const head = ascii(bytes, 0, Math.min(bytes.length, 256)).trim().toLowerCase()
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) return 'svg'
  return 'unknown'
}

const MIME_BY_FORMAT: Record<EncodableFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

const EXT_BY_FORMAT: Record<EncodableFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
}

export function mimeForFormat(format: EncodableFormat): string {
  return MIME_BY_FORMAT[format]
}

export function extensionForFormat(format: EncodableFormat): string {
  return EXT_BY_FORMAT[format]
}

export function formatForMime(mime: string): EncodableFormat | undefined {
  const normalised = mime.split(';')[0].trim().toLowerCase()
  if (normalised === 'image/jpeg' || normalised === 'image/jpg') return 'jpeg'
  if (normalised === 'image/png') return 'png'
  if (normalised === 'image/webp') return 'webp'
  return undefined
}

/** Human readable file size. Uses binary units, like the OS does. */
export function formatBytes(bytes: number, locale = 'en'): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes === 0) return '0 B'
  const units = locale === 'zh' ? ['B', 'KB', 'MB', 'GB'] : ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  const digits = exponent === 0 ? 0 : value >= 100 ? 0 : value >= 10 ? 1 : 2
  return `${value.toFixed(digits)} ${units[exponent]}`
}

/** Relative change from `before` to `after`, in percent (positive = smaller). */
export function savedPercent(before: number, after: number): number {
  if (!Number.isFinite(before) || before <= 0) return 0
  return ((before - after) / before) * 100
}

export function formatPercent(value: number): string {
  return `${value > 0 ? '' : value < 0 ? '-' : ''}${Math.abs(value).toFixed(1)}%`
}

/** Upper bound for a single input file. Protects low-memory phones. */
export const MAX_FILE_BYTES = 60 * 1024 * 1024
/** Upper bound for decoded pixels of a single image (≈ 200 MP). */
export const MAX_SOURCE_PIXELS = 200_000_000
/** Upper bound for the pixels of one output image (≈ 100 MP). */
export const MAX_OUTPUT_PIXELS = 100_000_000
