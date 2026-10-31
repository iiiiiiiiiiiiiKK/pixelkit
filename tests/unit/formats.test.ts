import { describe, expect, it } from 'vitest'
import {
  detectInputFormat,
  extensionForFormat,
  formatBytes,
  formatForMime,
  formatPercent,
  mimeForFormat,
  savedPercent,
} from '../../src/engine/formats'

function bytes(...values: number[]): Uint8Array {
  return new Uint8Array(values)
}

function ascii(text: string): Uint8Array {
  return new Uint8Array([...text].map((char) => char.charCodeAt(0)))
}

describe('detectInputFormat', () => {
  it('detects JPEG from magic bytes', () => {
    expect(detectInputFormat(bytes(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10))).toBe('jpeg')
  })

  it('detects PNG from magic bytes', () => {
    expect(detectInputFormat(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('png')
  })

  it('detects WebP from the RIFF container', () => {
    const data = new Uint8Array([...ascii('RIFF'), 0x20, 0x00, 0x00, 0x00, ...ascii('WEBPVP8 ')])
    expect(detectInputFormat(data)).toBe('webp')
  })

  it('detects GIF, BMP and AVIF', () => {
    expect(detectInputFormat(ascii('GIF89a'))).toBe('gif')
    expect(detectInputFormat(ascii('BM6\u0000'))).toBe('bmp')
    const avif = new Uint8Array([0, 0, 0, 0x1c, ...ascii('ftypavif')])
    expect(detectInputFormat(avif)).toBe('avif')
  })

  it('recognises HEIC so the UI can explain the limitation', () => {
    const heic = new Uint8Array([0, 0, 0, 0x18, ...ascii('ftypheic')])
    expect(detectInputFormat(heic)).toBe('heic')
  })

  it('detects SVG text', () => {
    expect(detectInputFormat(ascii('<svg xmlns="http://www.w3.org/2000/svg">'))).toBe('svg')
  })

  it('returns unknown for empty or unrelated files', () => {
    expect(detectInputFormat(new Uint8Array([]))).toBe('unknown')
    expect(detectInputFormat(ascii('just some text'))).toBe('unknown')
  })

  it('rejects a renamed non-image even when the extension lies', () => {
    expect(detectInputFormat(ascii('not an image at all'))).toBe('unknown')
  })
})

describe('format helpers', () => {
  it('maps formats to mime types and extensions', () => {
    expect(mimeForFormat('jpeg')).toBe('image/jpeg')
    expect(mimeForFormat('png')).toBe('image/png')
    expect(mimeForFormat('webp')).toBe('image/webp')
    expect(extensionForFormat('jpeg')).toBe('jpg')
    expect(extensionForFormat('png')).toBe('png')
    expect(formatForMime('image/jpeg; charset=binary')).toBe('jpeg')
    expect(formatForMime('image/gif')).toBeUndefined()
  })

  it('formats byte sizes with sensible precision', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(999)).toBe('999 B')
    expect(formatBytes(1024)).toBe('1.00 KB')
    expect(formatBytes(1536)).toBe('1.50 KB')
    expect(formatBytes(10 * 1024 * 1024)).toBe('10.0 MB')
    expect(formatBytes(Number.NaN)).toBe('—')
  })

  it('computes savings and percentages', () => {
    expect(savedPercent(1000, 250)).toBeCloseTo(75)
    expect(savedPercent(1000, 1250)).toBeCloseTo(-25)
    expect(savedPercent(0, 10)).toBe(0)
    expect(formatPercent(12.345)).toBe('12.3%')
    expect(formatPercent(-3.5)).toBe('-3.5%')
  })
})
