import { expect, test } from '@playwright/test'
import { FIXTURES, addFiles, expectItems, openTool } from './helpers'

test.describe('image info', () => {
  test('lists real format, dimensions and size for each file', async ({ page }) => {
    await openTool(page, 'info')
    await addFiles(page, [FIXTURES.jpeg, FIXTURES.webp])
    await expectItems(page, 2)

    const table = page.locator('table').first()
    await expect(table).toContainText('photo-wide.jpg')
    await expect(table).toContainText('1600 × 1000')
    await expect(table).toContainText('JPEG')
    await expect(table).toContainText('graphic.webp')
    await expect(table).toContainText('800 × 600')
    await expect(table).toContainText('WEBP')
    // 1600 × 1000 = 1.6 megapixels, computed from the file, not guessed.
    await expect(table).toContainText('1.6 MP')
  })

  test('states that metadata is not invented', async ({ page }) => {
    await openTool(page, 'info')
    await addFiles(page, [FIXTURES.tile])
    await expectItems(page, 1)
    await expect(page.getByText(/not guessed or invented/)).toBeVisible()
  })

  test('shows an empty state before files are added', async ({ page }) => {
    await openTool(page, 'info')
    await expect(page.getByText('No images yet')).toBeVisible()
  })
})
