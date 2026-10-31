import { describe, expect, it } from 'vitest'
import { en, zh, type DictKey } from '../../src/i18n/dict'
import { interpolate } from '../../src/i18n'

describe('dictionaries', () => {
  const keys = Object.keys(en) as DictKey[]

  it('translate every key into Chinese', () => {
    const missing = keys.filter((key) => !(key in zh))
    expect(missing).toEqual([])
  })

  it('never ship empty strings', () => {
    const empty = keys.filter((key) => en[key].trim() === '' || zh[key].trim() === '')
    expect(empty).toEqual([])
  })

  it('keep the same interpolation placeholders in both languages', () => {
    const placeholder = (value: string) => (value.match(/\{\w+\}/g) ?? []).sort()
    const mismatched = keys.filter(
      (key) => placeholder(en[key]).join(',') !== placeholder(zh[key]).join(','),
    )
    expect(mismatched).toEqual([])
  })

  it('do not leak untranslated English UI words into the Chinese copy', () => {
    // A few brand and technical terms are intentionally identical, and the
    // language switcher labels are written in the target language on purpose.
    const allowed = new Set(['PixelKit', 'MIT', 'JPG', 'PNG', 'WebP', 'GIF', 'BMP', 'AVIF', 'HEIC', 'HEIF', 'ZIP'])
    const suspicious = keys
      .filter((key) => !key.startsWith('lang.'))
      .filter((key) => {
        const value = zh[key]
        if (value !== en[key]) return false
        const words = value.split(/\s+/).filter((word) => /^[A-Za-z]{3,}$/.test(word))
        return words.some((word) => !allowed.has(word))
      })
    expect(suspicious).toEqual([])
  })
})

describe('interpolate', () => {
  it('replaces named placeholders', () => {
    expect(interpolate('{count} images saved', { count: 3 })).toBe('3 images saved')
  })

  it('leaves unknown placeholders alone', () => {
    expect(interpolate('{missing} stays', { count: 1 })).toBe('{missing} stays')
  })

  it('returns the template when no variables are passed', () => {
    expect(interpolate('{count} images')).toBe('{count} images')
  })
})
