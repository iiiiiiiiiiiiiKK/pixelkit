import { expect, test } from '@playwright/test'
import { unzipSync } from 'fflate'
import {
  FIXTURES,
  addFiles,
  captureDownload,
  expectItems,
  openTool,
  runProcess,
  setRange,
  sniff,
  waitForDone,
} from './helpers'

test.describe('compress', () => {
  test('compresses a batch, shows real byte sizes and downloads a smaller file', async ({ page }) => {
    await openTool(page, 'compress')
    await addFiles(page, [FIXTURES.jpeg, FIXTURES.alphaPng])
    await expectItems(page, 2)

    // Quality slider is usable and reports its value.
    await setRange(page, '#compress-quality', 60)
    await expect(page.locator('#compress-quality')).toHaveValue('60')

    await runProcess(page)
    await waitForDone(page, 2)

    // The preview shows before / after sizes from the real result.
    const stats = page.getByTestId('preview-stats')
    await expect(stats).toContainText('Before')
    await expect(stats).toContainText('After')

    const firstRow = page.getByTestId('file-item').first()
    const downloadButton = firstRow.getByRole('button', { name: /^Download/ })
    const file = await captureDownload(page, () => downloadButton.click())

    expect(file.name).toBe('photo-wide.jpg')
    expect(sniff(file.buffer)).toBe('jpeg')
    // 60 % quality on a photo must actually produce fewer bytes than the source.
    expect(file.size).toBeLessThan(511_900)
  })

  test('downloads the whole batch as a ZIP with sensible names', async ({ page }) => {
    await openTool(page, 'compress')
    await addFiles(page, [FIXTURES.jpeg, FIXTURES.alphaPng, FIXTURES.webp])
    await expectItems(page, 3)
    await runProcess(page)
    await waitForDone(page, 3)

    const zip = await captureDownload(page, () => page.getByTestId('download-zip').click())
    expect(zip.name).toMatch(/^pixelkit-compress-\d{8}-\d{4}\.zip$/)
    expect(sniff(zip.buffer)).toBe('zip')

    const entries = Object.keys(unzipSync(new Uint8Array(zip.buffer))).sort()
    expect(entries).toEqual(['graphic.webp', 'photo-alpha.png', 'photo-wide.jpg'])
  })

  test('can convert while compressing and keeps the extension honest', async ({ page }) => {
    await openTool(page, 'compress')
    await addFiles(page, [FIXTURES.alphaPng])
    await expectItems(page, 1)

    await page.getByRole('button', { name: 'WEBP', exact: true }).click()
    await runProcess(page)
    await waitForDone(page, 1)

    const file = await captureDownload(page, () =>
      page.getByTestId('file-item').first().getByRole('button', { name: /^Download/ }).click(),
    )
    expect(file.name).toBe('photo-alpha.webp')
    expect(sniff(file.buffer)).toBe('webp')
  })

  test('warns that PNG compression is lossless', async ({ page }) => {
    await openTool(page, 'compress')
    await addFiles(page, [FIXTURES.alphaPng])
    await expectItems(page, 1)
    await expect(page.getByText(/PNG is lossless/)).toBeVisible()
  })
})
