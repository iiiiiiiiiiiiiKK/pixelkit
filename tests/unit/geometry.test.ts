import { describe, expect, it } from 'vitest'
import {
  MAX_DIMENSION,
  centerAspectRect,
  clampRect,
  fitWithin,
  heightForWidth,
  parseDimension,
  relativePercent,
  scaleByPercent,
  scaleRect,
  widthForHeight,
} from '../../src/engine/geometry'

describe('parseDimension', () => {
  it('accepts whole numbers inside the allowed range', () => {
    expect(parseDimension('1920')).toBe(1920)
    expect(parseDimension(1)).toBe(1)
    expect(parseDimension(String(MAX_DIMENSION))).toBe(MAX_DIMENSION)
  })

  it('rejects zero, negatives, decimals, junk and out of range values', () => {
    expect(parseDimension('0')).toBeNull()
    expect(parseDimension('-10')).toBeNull()
    expect(parseDimension('12.5')).toBeNull()
    expect(parseDimension('abc')).toBeNull()
    expect(parseDimension('')).toBeNull()
    expect(parseDimension(String(MAX_DIMENSION + 1))).toBeNull()
    expect(parseDimension(Number.NaN)).toBeNull()
  })
})

describe('clampRect', () => {
  it('keeps a rectangle inside the bounds', () => {
    const rect = clampRect({ x: -20, y: 90, width: 40, height: 40 }, { width: 100, height: 100 })
    // The rect is pushed to x = 0 and clipped to the remaining height.
    expect(rect).toEqual({ x: 0, y: 90, width: 40, height: 10 })
  })

  it('never produces a zero sized rectangle', () => {
    const rect = clampRect({ x: 99, y: 99, width: 0, height: 0 }, { width: 100, height: 100 })
    expect(rect.width).toBeGreaterThanOrEqual(1)
    expect(rect.height).toBeGreaterThanOrEqual(1)
  })
})

describe('centerAspectRect', () => {
  it('returns a 1:1 square centred in a landscape image', () => {
    const rect = centerAspectRect(1, { width: 1000, height: 500 })
    expect(rect).toEqual({ x: 250, y: 0, width: 500, height: 500 })
  })

  it('returns a 16:9 rectangle centred in a portrait image', () => {
    const rect = centerAspectRect(16 / 9, { width: 600, height: 900 })
    expect(rect.width).toBe(600)
    expect(rect.height).toBe(338)
    expect(rect.x).toBe(0)
    expect(rect.y).toBe(281)
  })
})

describe('scaleRect', () => {
  it('scales around the centre and clamps to bounds', () => {
    const rect = scaleRect({ x: 100, y: 100, width: 200, height: 200 }, 2, { width: 400, height: 400 })
    expect(rect.x).toBe(0)
    expect(rect.y).toBe(0)
    expect(rect.width).toBe(400)
    expect(rect.height).toBe(400)
  })
})

describe('resize maths', () => {
  it('fits inside a box preserving the ratio', () => {
    expect(fitWithin(4000, 2000, 1000, 1000)).toEqual({ width: 1000, height: 500 })
    expect(fitWithin(1000, 4000, 1000, 1000)).toEqual({ width: 250, height: 1000 })
  })

  it('scales by percentage with clamping', () => {
    expect(scaleByPercent(1000, 500, 50)).toEqual({ width: 500, height: 250 })
    expect(scaleByPercent(1000, 500, 400)).toEqual({ width: 4000, height: 2000 })
    expect(scaleByPercent(2, 2, 1)).toEqual({ width: 1, height: 1 })
  })

  it('derives the missing side from the ratio', () => {
    expect(heightForWidth(800, { width: 1600, height: 900 })).toBe(450)
    expect(widthForHeight(450, { width: 1600, height: 900 })).toBe(800)
    expect(relativePercent({ width: 800, height: 450 }, { width: 1600, height: 900 })).toBe(50)
  })
})
