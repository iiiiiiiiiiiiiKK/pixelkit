import { expect, test } from '@playwright/test'

test.describe('home page', () => {
  test('presents the product, all six tools and the author link', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/PixelKit/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Image editing')

    // Six tool entries, each a real button that navigates.
    const toolButtons = page.locator('#tools button')
    await expect(toolButtons).toHaveCount(6)

    // Author X link is in the header and points at the real handle.
    const author = page.locator('a[href="https://x.com/0xkillcoin"]').first()
    await expect(author).toBeVisible()
    await expect(author).toHaveAttribute('target', '_blank')
    await expect(author).toHaveAttribute('rel', /noopener/)

    // Privacy claims are actually on the page.
    await expect(page.getByText('No upload', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('No trackers', { exact: true }).first()).toBeVisible()
  })

  test('opens a tool from the grid', async ({ page }) => {
    await page.goto('/')
    await page.locator('#tools button', { hasText: 'Crop' }).click()
    await expect(page).toHaveURL(/#\/tool\/crop/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Crop')
  })

  test('switches language to Chinese and remembers it after a reload', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Image editing')

    await page.getByTestId('lang-toggle').click()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('图片处理')
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')

    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('图片处理')

    // No half-translated screen: navigation is translated too.
    await expect(page.getByRole('link', { name: '使用说明' }).first()).toBeVisible()
  })

  test('toggles the dark theme and persists the choice', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    await page.getByTestId('theme-toggle').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    const darkBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(darkBackground).toBe('rgb(11, 11, 13)')

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('guide and privacy pages are reachable and translated', async ({ page }) => {
    await page.goto('/#/guide')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('How PixelKit works')

    await page.goto('/#/privacy')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Privacy note')
    await expect(page.getByText('Images are never uploaded')).toBeVisible()
  })

  test('rejects files that are not images and explains why', async ({ page }) => {
    await page.goto('/')
    await page.setInputFiles('[data-testid="file-input"]', 'tests/e2e/fixtures/notes.txt')

    await expect(page.getByText('Some files were skipped')).toBeVisible()
    await expect(page.getByText(/notes\.txt/)).toBeVisible()
    // Nothing was added to the queue.
    await expect(page.getByTestId('file-item')).toHaveCount(0)
  })
})
