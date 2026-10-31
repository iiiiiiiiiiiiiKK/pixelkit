import { expect, test } from '@playwright/test'
import { FIXTURES, addFiles, expectItems, openTool } from './helpers'

test.describe('queue and error handling', () => {
  test('removes a single image', async ({ page }) => {
    await openTool(page, 'compress')
    await addFiles(page, [FIXTURES.jpeg, FIXTURES.tile])
    await expectItems(page, 2)

    await page.getByTestId('file-item').first().getByRole('button', { name: /^Remove / }).click()
    await expectItems(page, 1)
  })

  test('clears the whole list after confirmation', async ({ page }) => {
    await openTool(page, 'compress')
    await addFiles(page, [FIXTURES.jpeg, FIXTURES.tile])
    await expectItems(page, 2)

    await page.getByTestId('clear').click()
    await expect(page.getByText('Remove all images from the list?')).toBeVisible()
    await page.getByTestId('clear').click()

    await expect(page.getByTestId('file-item')).toHaveCount(0)
    await expect(page.getByText('No images yet')).toBeVisible()
  })

  test('a reload starts from an empty queue (nothing is persisted)', async ({ page }) => {
    await openTool(page, 'compress')
    await addFiles(page, [FIXTURES.jpeg])
    await expectItems(page, 1)

    await page.reload()
    await expect(page.getByText('No images yet')).toBeVisible()
    await expect(page.getByTestId('file-item')).toHaveCount(0)

    const stored = await page.evaluate(() => ({ ...localStorage }))
    // Nothing is written unless the user changes a preference themselves.
    expect(Object.keys(stored)).toEqual([])
  })

  test('skips a non-image file mixed into a valid batch', async ({ page }) => {
    await openTool(page, 'compress')
    await addFiles(page, [FIXTURES.jpeg, FIXTURES.invalid])

    await expect(page.getByText('Some files were skipped')).toBeVisible()
    await expect(page.getByText(/notes\.txt/)).toBeVisible()
    await expectItems(page, 1)
  })

  test('shows the processing state and finishes', async ({ page }) => {
    await openTool(page, 'compress')
    await addFiles(page, [FIXTURES.jpeg, FIXTURES.alphaPng, FIXTURES.webp])
    await expectItems(page, 3)

    await page.getByTestId('process').click()
    // While running the button reports progress and a stop action exists.
    await expect(page.getByTestId('stop')).toBeVisible()
    await expect(page.locator('[data-testid="file-item"] .badge-ok')).toHaveCount(3, { timeout: 75_000 })
    await expect(page.getByTestId('stop')).toHaveCount(0)
  })

  test('the ZIP button is disabled until something has been processed', async ({ page }) => {
    await openTool(page, 'compress')
    await addFiles(page, [FIXTURES.tile])
    await expectItems(page, 1)
    await expect(page.getByTestId('download-zip')).toBeDisabled()
  })
})
