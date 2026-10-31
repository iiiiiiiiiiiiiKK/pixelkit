import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { unzipSync } from 'fflate'
import { FIXTURES, addFiles, captureDownload, expectItems, openTool, runProcess, waitForDone } from './helpers'

test.describe('batch rename', () => {
  test('previews sequential names and packages them without re-encoding', async ({ page }) => {
    await openTool(page, 'rename')
    await addFiles(page, [FIXTURES.webp, FIXTURES.jpeg])
    await expectItems(page, 2)

    await page.locator('#rename-prefix').fill('shot-')
    await page.locator('#rename-start').fill('5')
    await page.locator('#rename-digits').fill('2')

    await expect(page.getByText('shot-05.webp')).toBeVisible()
    await expect(page.getByText('shot-06.jpg')).toBeVisible()

    await runProcess(page)
    await waitForDone(page, 2)

    const zip = await captureDownload(page, () => page.getByTestId('download-zip').click())
    const entries = Object.keys(unzipSync(new Uint8Array(zip.buffer))).sort()
    expect(entries).toEqual(['shot-05.webp', 'shot-06.jpg'])
  })

  test('handles duplicate names in keep mode', async ({ page }) => {
    await openTool(page, 'rename')
    await addFiles(page, [FIXTURES.tile, FIXTURES.tile])
    await expectItems(page, 2)

    await page.getByRole('button', { name: 'Keep original name' }).click()
    const preview = page.getByTestId('rename-preview')
    await expect(preview.getByTestId('rename-preview-name')).toHaveText(['small-tile.png', 'small-tile-1.png'])

    await runProcess(page)
    await waitForDone(page, 2)

    const zip = await captureDownload(page, () => page.getByTestId('download-zip').click())
    const entries = Object.keys(unzipSync(new Uint8Array(zip.buffer))).sort()
    expect(entries).toEqual(['small-tile-1.png', 'small-tile.png'])
  })

  test('renaming does not change the bytes', async ({ page }) => {
    await openTool(page, 'rename')
    await addFiles(page, [FIXTURES.jpeg])
    await expectItems(page, 1)

    await page.locator('#rename-prefix').fill('renamed-')
    await runProcess(page)
    await waitForDone(page, 1)

    const file = await captureDownload(page, () =>
      page.getByTestId('file-item').first().getByRole('button', { name: /^Download/ }).click(),
    )
    expect(file.name).toBe('renamed-001.jpg')
    // Renaming must not re-encode: the byte count stays exactly the same.
    const original = await readFile(FIXTURES.jpeg)
    expect(file.size).toBe(original.byteLength)
    expect(file.buffer.equals(original)).toBe(true)
  })
})
