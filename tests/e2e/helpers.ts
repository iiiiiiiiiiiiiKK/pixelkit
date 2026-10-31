import { expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

/** Shared helpers for the end-to-end suite. */

export const FIXTURES = {
  jpeg: 'tests/e2e/fixtures/photo-wide.jpg',
  alphaPng: 'tests/e2e/fixtures/photo-alpha.png',
  webp: 'tests/e2e/fixtures/graphic.webp',
  tile: 'tests/e2e/fixtures/small-tile.png',
  portrait: 'tests/e2e/fixtures/portrait.jpg',
  invalid: 'tests/e2e/fixtures/notes.txt',
}

export const SOURCE_SIZES = {
  jpeg: { width: 1600, height: 1000 },
  alphaPng: { width: 1200, height: 800 },
  webp: { width: 800, height: 600 },
  tile: { width: 320, height: 320 },
  portrait: { width: 900, height: 1350 },
}

export async function openTool(page: Page, tool: string): Promise<void> {
  await page.goto(`/#/tool/${tool}`)
  await expect(page.getByTestId('dropzone').or(page.getByTestId('file-list'))).toBeVisible()
}

export async function addFiles(page: Page, files: string[], where: 'home' | 'workspace' = 'workspace'): Promise<void> {
  const selector = where === 'home' ? '[data-testid="file-input"]' : '[data-testid="add-more-input"]'
  await page.setInputFiles(selector, files.map((file) => resolve(file)))
}

export async function expectItems(page: Page, count: number): Promise<void> {
  await expect(page.getByTestId('file-item')).toHaveCount(count)
}

export async function waitForDone(page: Page, count: number): Promise<void> {
  await expect(page.locator('[data-testid="file-item"] .badge-ok')).toHaveCount(count, { timeout: 75_000 })
}

export async function runProcess(page: Page): Promise<void> {
  const desktop = page.getByTestId('process')
  const mobile = page.getByTestId('process-mobile')
  if (await desktop.isVisible()) await desktop.click()
  else await mobile.click()
}

export interface Downloaded {
  name: string
  buffer: Buffer
  size: number
}

export async function captureDownload(page: Page, action: () => Promise<void>): Promise<Downloaded> {
  const [download] = await Promise.all([page.waitForEvent('download'), action()])
  const path = await download.path()
  if (!path) throw new Error('download did not produce a file')
  const buffer = await readFile(path)
  return { name: download.suggestedFilename(), buffer, size: buffer.length }
}

/** Reads the real container signature from bytes (not from the file name). */
export function sniff(buffer: Buffer): 'jpeg' | 'png' | 'webp' | 'zip' | 'unknown' {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg'
  if (buffer.length > 8 && buffer[0] === 0x89 && buffer.toString('latin1', 1, 4) === 'PNG') return 'png'
  if (buffer.length > 12 && buffer.toString('latin1', 0, 4) === 'RIFF' && buffer.toString('latin1', 8, 12) === 'WEBP') {
    return 'webp'
  }
  if (buffer.length > 4 && buffer.toString('latin1', 0, 2) === 'PK') return 'zip'
  return 'unknown'
}

/** Decodes the downloaded bytes in the browser to read the real pixel size. */
export async function decodeSize(page: Page, buffer: Buffer): Promise<{ width: number; height: number }> {
  const base64 = buffer.toString('base64')
  return await page.evaluate(async (data) => {
    const binary = atob(data)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
    const blob = new Blob([bytes])
    const bitmap = await createImageBitmap(blob)
    const size = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return size
  }, base64)
}

export function sourceSize(file: keyof typeof SOURCE_SIZES) {
  return SOURCE_SIZES[file]
}

/**
 * Range inputs cannot be `fill`ed, so drive them through the native value
 * setter and a real `input` event, which is what React listens to.
 */
export async function setRange(page: Page, selector: string, value: number): Promise<void> {
  await page.locator(selector).evaluate((element, next) => {
    const input = element as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, String(next))
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }, value)
}
