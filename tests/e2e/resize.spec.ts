import { expect, test } from '@playwright/test'
import {
  FIXTURES,
  addFiles,
  captureDownload,
  decodeSize,
  expectItems,
  openTool,
  runProcess,
  waitForDone,
} from './helpers'

test.describe('resize', () => {
  test('locks the aspect ratio while typing and exports exact pixels', async ({ page }) => {
    await openTool(page, 'resize')
    await addFiles(page, [FIXTURES.jpeg])
    await expectItems(page, 1)

    await page.locator('#resize-width').fill('800')
    // 1600 × 1000 → 800 × 500 with the lock on.
    await expect(page.locator('#resize-height')).toHaveValue('500')

    await runProcess(page)
    await waitForDone(page, 1)

    const file = await captureDownload(page, () =>
      page.getByTestId('file-item').first().getByRole('button', { name: /^Download/ }).click(),
    )
    expect(await decodeSize(page, file.buffer)).toEqual({ width: 800, height: 500 })
  })

  test('unlocking the ratio allows independent width and height', async ({ page }) => {
    await openTool(page, 'resize')
    await addFiles(page, [FIXTURES.jpeg])
    await expectItems(page, 1)

    await page.getByRole('checkbox', { name: /Lock aspect ratio/ }).uncheck()
    await page.locator('#resize-width').fill('640')
    await page.locator('#resize-height').fill('640')
    await runProcess(page)
    await waitForDone(page, 1)

    const file = await captureDownload(page, () =>
      page.getByTestId('file-item').first().getByRole('button', { name: /^Download/ }).click(),
    )
    expect(await decodeSize(page, file.buffer)).toEqual({ width: 640, height: 640 })
  })

  test('scales by percentage', async ({ page }) => {
    await openTool(page, 'resize')
    await addFiles(page, [FIXTURES.webp])
    await expectItems(page, 1)

    await page.getByRole('button', { name: '%', exact: true }).click()
    await page.locator('#resize-percent').evaluate((element) => {
      const input = element as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(input, '25')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })

    await runProcess(page)
    await waitForDone(page, 1)

    const file = await captureDownload(page, () =>
      page.getByTestId('file-item').first().getByRole('button', { name: /^Download/ }).click(),
    )
    // 800 × 600 at 25 % → 200 × 150.
    expect(await decodeSize(page, file.buffer)).toEqual({ width: 200, height: 150 })
  })

  test('rejects invalid dimensions with a visible message', async ({ page }) => {
    await openTool(page, 'resize')
    await addFiles(page, [FIXTURES.jpeg])
    await expectItems(page, 1)

    await page.locator('#resize-width').fill('0')
    await expect(page.getByText(/Enter a whole number between 1 and 16384/).first()).toBeVisible()

    await page.locator('#resize-width').fill('99999')
    await expect(page.getByText(/Enter a whole number between 1 and 16384/).first()).toBeVisible()

    await page.locator('#resize-width').fill('640')
    await expect(page.getByText(/Enter a whole number between 1 and 16384/)).toHaveCount(0)
  })

  test('applies a preset', async ({ page }) => {
    await openTool(page, 'resize')
    await addFiles(page, [FIXTURES.jpeg])
    await expectItems(page, 1)

    await page.getByRole('button', { name: '1080×1080' }).click()
    await expect(page.locator('#resize-width')).toHaveValue('1080')
    await expect(page.locator('#resize-height')).toHaveValue('675')
  })
})
