import { describe, expect, it } from 'vitest'
import { centerRectForRatio, clampNormalised, moveRect, rectToPixels, resizeRect } from '../../src/workspace/cropMath'
import { FULL_RECT, MIN_SIZE } from '../../src/workspace/cropMath'

const canvas = { pixelWidth: 1000, pixelHeight: 500 }

describe('clampNormalised', () => {
  it('keeps the rect inside the unit square', () => {
    const rect = clampNormalised({ x: -0.5, y: 0.9, width: 0.4, height: 0.4 })
    expect(rect.x).toBe(0)
    expect(rect.width).toBe(0.4)
    expect(rect.y).toBeCloseTo(0.6)
  })

  it('enforces a minimum size', () => {
    const rect = clampNormalised({ x: 0.5, y: 0.5, width: 0, height: 0 })
    expect(rect.width).toBeCloseTo(MIN_SIZE)
    expect(rect.height).toBeCloseTo(MIN_SIZE)
  })
})

describe('centerRectForRatio', () => {
  it('returns the whole image for a free selection', () => {
    expect(centerRectForRatio(null, 1000, 500)).toEqual(FULL_RECT)
  })

  it('produces a square for 1:1 inside a landscape image', () => {
    const rect = centerRectForRatio(1, 1000, 500)
    // A square is limited by the shorter side: 500 × 500 px.
    expect(rect.height).toBe(1)
    expect(rect.width).toBeCloseTo(0.5)
    expect(rect.x).toBeCloseTo(0.25)
    expect(rect.y).toBe(0)
  })

  it('matches the requested pixel aspect ratio', () => {
    const rect = centerRectForRatio(16 / 9, 600, 900)
    const pixelRatio = (rect.width * 600) / (rect.height * 900)
    expect(pixelRatio).toBeCloseTo(16 / 9, 2)
  })
})

describe('moveRect', () => {
  it('moves and clamps at the edges', () => {
    const rect = { x: 0.2, y: 0.2, width: 0.4, height: 0.4 }
    expect(moveRect(rect, 0.1, 0).x).toBeCloseTo(0.3)
    expect(moveRect(rect, 1, 1)).toMatchObject({ x: 0.6, y: 0.6 })
    expect(moveRect(rect, -1, -1)).toMatchObject({ x: 0, y: 0 })
  })

  it('never changes the size', () => {
    const rect = { x: 0.2, y: 0.2, width: 0.4, height: 0.4 }
    const moved = moveRect(rect, 0.05, -0.05)
    expect(moved.width).toBe(rect.width)
    expect(moved.height).toBe(rect.height)
  })
})

describe('resizeRect', () => {
  it('resizes freely when no ratio is set', () => {
    const rect = { x: 0.2, y: 0.2, width: 0.4, height: 0.4 }
    const next = resizeRect(rect, 'se', 0.1, 0.1, { ratio: null, ...canvas })
    expect(next.width).toBeCloseTo(0.5)
    expect(next.height).toBeCloseTo(0.5)
    expect(next.x).toBeCloseTo(0.2)
  })

  it('keeps the pixel aspect ratio when one is chosen', () => {
    const rect = centerRectForRatio(1, canvas.pixelWidth, canvas.pixelHeight)
    const next = resizeRect(rect, 'se', -0.1, -0.05, { ratio: 1, ...canvas })
    const pixelRatio = (next.width * canvas.pixelWidth) / (next.height * canvas.pixelHeight)
    expect(pixelRatio).toBeCloseTo(1, 1)
  })

  it('stays inside the image bounds', () => {
    const rect = { x: 0.5, y: 0.5, width: 0.4, height: 0.4 }
    const next = resizeRect(rect, 'se', 5, 5, { ratio: null, ...canvas })
    expect(next.x + next.width).toBeLessThanOrEqual(1.0001)
    expect(next.y + next.height).toBeLessThanOrEqual(1.0001)
  })

  it('never collapses below the minimum size', () => {
    const rect = { x: 0.2, y: 0.2, width: 0.4, height: 0.4 }
    const next = resizeRect(rect, 'nw', 5, 5, { ratio: null, ...canvas })
    expect(next.width).toBeGreaterThanOrEqual(MIN_SIZE - 1e-6)
    expect(next.height).toBeGreaterThanOrEqual(MIN_SIZE - 1e-6)
  })

  it('anchors the opposite corner when resizing from the north-west', () => {
    const rect = { x: 0.2, y: 0.2, width: 0.4, height: 0.4 }
    const next = resizeRect(rect, 'nw', 0.1, 0.1, { ratio: null, ...canvas })
    expect(next.x + next.width).toBeCloseTo(0.6)
    expect(next.y + next.height).toBeCloseTo(0.6)
  })
})

describe('rectToPixels', () => {
  it('converts and clamps to whole pixels', () => {
    expect(rectToPixels({ x: 0.25, y: 0.5, width: 0.5, height: 0.5 }, 1000, 500)).toEqual({
      x: 250,
      y: 250,
      width: 500,
      height: 250,
    })
  })

  it('never returns a zero width', () => {
    const pixels = rectToPixels({ x: 0, y: 0, width: 0.0001, height: 0.0001 }, 100, 100)
    expect(pixels.width).toBeGreaterThanOrEqual(1)
    expect(pixels.height).toBeGreaterThanOrEqual(1)
  })
})
