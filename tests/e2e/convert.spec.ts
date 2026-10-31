import { expect, test } from '@playwright/test'
import {
  FIXTURES,
  addFiles,
  captureDownload,
  decodeSize,
  expectItems,
  openTool,
  runProcess,
  sniff,
  waitForDone,
} from './helpers'

test.describe('convert', () => {
  test('PNG to WebP produces real WebP bytes at the original dimensions', async ({ page }) => {
    await openTool(page, 'convert')
    await addFiles(page, [FIXTURES.alphaPng])
    await expectItems(page, 1)

    await page.getByRole('button', { name: 'WEBP', exact: true }).click()
    await runProcess(page)
    await waitForDone(page, 1)

    const file = await captureDownload(page, () =>
      page.getByTestId('file-item').first().getByRole('button', { name: /^Download/ }).click(),
    )

    expect(file.name).toBe('photo-alpha.webp')
    // The container really is WebP — the extension was not just renamed.
    expect(sniff(file.buffer)).toBe('webp')
    expect(await decodeSize(page, file.buffer)).toEqual({ width: 1200, height: 800 })
  })

  test('PNG to JPEG flattens transparency and is flagged in the UI', async ({ page }) => {
    await openTool(page, 'convert')
    await addFiles(page, [FIXTURES.alphaPng])
    await expectItems(page, 1)

    await page.getByRole('button', { name: 'JPEG', exact: true }).click()
    await expect(page.getByText(/JPEG has no alpha channel/)).toBeVisible()

    await runProcess(page)
    await waitForDone(page, 1)

    const file = await captureDownload(page, () =>
      page.getByTestId('file-item').first().getByRole('button', { name: /^Download/ }).click(),
    )
    expect(file.name).toBe('photo-alpha.jpg')
    expect(sniff(file.buffer)).toBe('jpeg')
  })

  test('JPEG to PNG works and is listed in the session history', async ({ page }) => {
    await openTool(page, 'convert')
    await addFiles(page, [FIXTURES.jpeg])
    await expectItems(page, 1)

    await page.getByRole('button', { name: 'PNG', exact: true }).click()
    await runProcess(page)
    await waitForDone(page, 1)

    const file = await captureDownload(page, () =>
      page.getByTestId('file-item').first().getByRole('button', { name: /^Download/ }).click(),
    )
    expect(file.name).toBe('photo-wide.png')
    expect(sniff(file.buffer)).toBe('png')

    const history = page.getByTestId('history-table')
    await expect(history).toContainText('photo-wide.jpg')
    await expect(history).toContainText('Convert')
  })

  test('shows which encoders the browser really supports', async ({ page }) => {
    await openTool(page, 'convert')
    await expect(page.getByText(/detected in your browser/)).toBeVisible()
    // Chromium in CI encodes JPEG, PNG and WebP, so no missing-encoder warning.
    await expect(page.getByText(/cannot encode/)).toHaveCount(0)
  })

  test('history can be cleared', async ({ page }) => {
    await openTool(page, 'convert')
    await addFiles(page, [FIXTURES.tile])
    await expectItems(page, 1)
    await runProcess(page)
    await waitForDone(page, 1)

    await expect(page.getByTestId('history-table')).toBeVisible()
    await page.getByRole('button', { name: 'Clear history' }).click()
    await expect(page.getByText('Nothing processed in this session yet.')).toBeVisible()
  })
})
