import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, buildOpsPlan, outputFormatForSource, type Settings } from '../../src/workspace/ops'
import type { EncodableFormat, InputFormat } from '../../src/engine/types'

const ALL: EncodableFormat[] = ['jpeg', 'png', 'webp']

function plan(overrides: {
  tool: Parameters<typeof buildOpsPlan>[0]['tool']
  sourceFormat?: InputFormat
  sourceName?: string
  width?: number
  height?: number
  index?: number
  settings?: Partial<Settings>
}) {
  return buildOpsPlan({
    tool: overrides.tool,
    sourceFormat: overrides.sourceFormat ?? 'jpeg',
    sourceName: overrides.sourceName ?? 'holiday.jpg',
    width: overrides.width ?? 1600,
    height: overrides.height ?? 1000,
    index: overrides.index ?? 0,
    settings: { ...DEFAULT_SETTINGS, ...overrides.settings },
    encoders: ALL,
  })
}

describe('outputFormatForSource', () => {
  it('keeps jpeg, png and webp when the browser can encode them', () => {
    expect(outputFormatForSource('jpeg', ALL)).toBe('jpeg')
    expect(outputFormatForSource('png', ALL)).toBe('png')
    expect(outputFormatForSource('webp', ALL)).toBe('webp')
  })

  it('falls back to png for gif, bmp and avif sources', () => {
    expect(outputFormatForSource('gif', ALL)).toBe('png')
    expect(outputFormatForSource('bmp', ALL)).toBe('png')
    expect(outputFormatForSource('avif', ALL)).toBe('png')
  })

  it('respects the encoders the browser actually reports', () => {
    expect(outputFormatForSource('webp', ['jpeg', 'png'])).toBe('png')
    expect(outputFormatForSource('png', ['jpeg'])).toBe('jpeg')
  })
})

describe('buildOpsPlan — compress', () => {
  it('keeps the source format and applies the quality', () => {
    const result = plan({ tool: 'compress', settings: { compress: { quality: 0.6, format: 'original', keepSmaller: true } } })
    expect(result.ops).toMatchObject({ format: 'jpeg', quality: 0.6, flatten: true })
    expect(result.name).toBe('holiday.jpg')
    expect(result.passthrough).toBe(false)
  })

  it('switches the container and the extension when asked', () => {
    const result = plan({
      tool: 'compress',
      settings: { compress: { quality: 0.8, format: 'webp', keepSmaller: false } },
    })
    expect(result.ops.format).toBe('webp')
    expect(result.name).toBe('holiday.webp')
  })
})

describe('buildOpsPlan — convert', () => {
  it('targets the requested format and passes the background colour', () => {
    const result = plan({
      tool: 'convert',
      sourceName: 'art.png',
      sourceFormat: 'png',
      settings: { convert: { format: 'jpeg', quality: 0.9, background: '#ff0000' } },
    })
    expect(result.ops).toMatchObject({ format: 'jpeg', background: '#ff0000', flatten: true })
    expect(result.name).toBe('art.jpg')
  })

  it('does not flatten when converting to a format that supports alpha', () => {
    const result = plan({
      tool: 'convert',
      sourceFormat: 'jpeg',
      settings: { convert: { format: 'webp', quality: 0.85, background: '#ffffff' } },
    })
    expect(result.ops.flatten).toBe(false)
  })
})

describe('buildOpsPlan — resize', () => {
  it('halves the image for 50 percent', () => {
    const result = plan({ tool: 'resize', settings: { resize: { mode: 'percent', width: '', height: '', lock: true, percent: '50' } } })
    expect(result.ops.resize).toEqual({ width: 800, height: 500 })
  })

  it('uses explicit pixel values', () => {
    const result = plan({
      tool: 'resize',
      settings: { resize: { mode: 'pixels', width: '320', height: '200', lock: false, percent: '50' } },
    })
    expect(result.ops.resize).toEqual({ width: 320, height: 200 })
  })

  it('falls back to the source size for empty or invalid input', () => {
    const result = plan({
      tool: 'resize',
      settings: { resize: { mode: 'pixels', width: '', height: 'abc', lock: true, percent: '50' } },
    })
    expect(result.ops.resize).toEqual({ width: 1600, height: 1000 })
  })
})

describe('buildOpsPlan — crop', () => {
  it('converts a normalised selection into source pixels', () => {
    const result = plan({
      tool: 'crop',
      sourceName: 'scene.png',
      sourceFormat: 'png',
      settings: {
        crop: { ratioId: '1:1', rect: { x: 0, y: 0.25, width: 1, height: 0.5 } },
      },
    })
    expect(result.ops.crop).toEqual({ x: 0, y: 250, width: 1600, height: 500 })
    expect(result.name).toBe('scene-crop.png')
  })
})

describe('buildOpsPlan — rename', () => {
  it('numbers files without touching pixels', () => {
    const result = plan({
      tool: 'rename',
      index: 4,
      settings: {
        rename: { mode: 'template', prefix: 'web-', suffix: '', start: 1, digits: 2 },
      },
    })
    expect(result.passthrough).toBe(true)
    expect(result.name).toBe('web-05.jpg')
  })

  it('keeps the extension of gif sources once they are normalised to png', () => {
    const result = plan({
      tool: 'rename',
      sourceFormat: 'gif',
      sourceName: 'loop.gif',
      settings: { rename: { mode: 'keep', prefix: '', suffix: '', start: 1, digits: 3 } },
    })
    expect(result.name).toBe('loop.png')
  })
})
