import { describe, expect, it } from 'vitest'
import { baseName, buildOutputName, buildOutputNames, sanitizeFileName } from '../../src/engine/rename'

const settings = { mode: 'template' as const, prefix: 'shot-', suffix: '', start: 1, digits: 3 }

describe('sanitizeFileName', () => {
  it('strips characters that are illegal on Windows and macOS', () => {
    expect(sanitizeFileName('a/b\\c:d*e?f"g<h>i|j')).toBe('abcdefghij')
  })

  it('trims whitespace and leading dots', () => {
    expect(sanitizeFileName('   ..hidden name.  ')).toBe('hidden name')
  })

  it('collapses control characters', () => {
    expect(sanitizeFileName('na\u0000me\u001f')).toBe('name')
  })
})

describe('baseName', () => {
  it('removes only the final extension', () => {
    expect(baseName('holiday.photo.png')).toBe('holiday.photo')
    expect(baseName('no-extension')).toBe('no-extension')
    expect(baseName('.gitignore')).toBe('.gitignore')
  })
})

describe('buildOutputName', () => {
  it('pads sequential numbers', () => {
    expect(buildOutputName(settings, 0, 'a.jpg', 'jpg')).toBe('shot-001.jpg')
    expect(buildOutputName(settings, 9, 'a.jpg', 'jpg')).toBe('shot-010.jpg')
  })

  it('honours start number and digit count', () => {
    const custom = { ...settings, start: 100, digits: 5 }
    expect(buildOutputName(custom, 0, 'a.jpg', 'jpg')).toBe('shot-00100.jpg')
  })

  it('keeps the original stem untouched in keep mode', () => {
    // Prefix and suffix belong to template mode only; keep mode must not mangle
    // the name a user already chose.
    const keep = { ...settings, mode: 'keep' as const, prefix: 'ignored-', suffix: '-ignored' }
    expect(buildOutputName(keep, 3, 'My Photo.JPG', 'jpg')).toBe('My Photo.jpg')
  })

  it('strips an extension typed into the prefix', () => {
    const withExt = { ...settings, prefix: 'batch.png' }
    expect(buildOutputName(withExt, 0, 'a.jpg', 'jpg')).toBe('batch001.jpg')
  })

  it('falls back to a usable name when everything is stripped', () => {
    const empty = { mode: 'keep' as const, prefix: '', suffix: '', start: 1, digits: 3 }
    expect(buildOutputName(empty, 0, '...', 'png')).toBe('image.png')
  })
})

describe('buildOutputNames', () => {
  it('resolves collisions with numeric suffixes', () => {
    const keep = { mode: 'keep' as const, prefix: '', suffix: '', start: 1, digits: 3 }
    const names = buildOutputNames(
      [{ name: 'photo.jpg' }, { name: 'photo.jpg' }, { name: 'photo.jpg' }],
      keep,
      'jpg',
    )
    expect(names).toEqual(['photo.jpg', 'photo-1.jpg', 'photo-2.jpg'])
  })

  it('treats names case-insensitively, like Windows and macOS', () => {
    const keep = { mode: 'keep' as const, prefix: '', suffix: '', start: 1, digits: 3 }
    const names = buildOutputNames([{ name: 'Photo.jpg' }, { name: 'photo.jpg' }], keep, 'jpg')
    expect(names).toEqual(['Photo.jpg', 'photo-1.jpg'])
  })

  it('keeps a unique list for a mixed batch', () => {
    const names = buildOutputNames(
      [{ name: 'a.png' }, { name: 'b.png' }, { name: 'c.png' }],
      settings,
      'webp',
    )
    expect(names).toEqual(['shot-001.webp', 'shot-002.webp', 'shot-003.webp'])
    expect(new Set(names).size).toBe(3)
  })
})
