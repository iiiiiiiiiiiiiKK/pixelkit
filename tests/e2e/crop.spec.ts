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

test.describe('crop', () => {
  test('crops to a 1:1 square and exports exactly those pixels', async ({ page }) => {
    await openTool(page, 'crop')
    await addFiles(page, [FIXTURES.alphaPng])
    await expectItems(page, 1)

    await page.getByRole('button', { name: '1:1', exact: true }).click()
    // A 1200 × 800 source, so a square is 800 × 800.
    await expect(page.getByText(/800 × 800/).first()).toBeVisible()

    await runProcess(page)
    await waitForDone(page, 1)

    const file = await captureDownload(page, () =>
      page.getByTestId('file-item').first().getByRole('button', { name: /^Download/ }).click(),
    )
    expect(file.name).toBe('photo-alpha-crop.png')
    expect(await decodeSize(page, file.buffer)).toEqual({ width: 800, height: 800 })
  })

  test('resets to the full frame', async ({ page }) => {
    await openTool(page, 'crop')
    await addFiles(page, [FIXTURES.alphaPng])
    await expectItems(page, 1)

    await page.getByRole('button', { name: '16:9', exact: true }).click()
    await page.getByRole('button', { name: 'Reset', exact: true }).click()
    await expect(page.getByText(/1200 × 800/).first()).toBeVisible()

    await runProcess(page)
    await waitForDone(page, 1)
    const file = await captureDownload(page, () =>
      page.getByTestId('file-item').first().getByRole('button', { name: /^Download/ }).click(),
    )
    expect(await decodeSize(page, file.buffer)).toEqual({ width: 1200, height: 800 })
  })

  test('dragging a handle changes the selection', async ({ page }) => {
    await openTool(page, 'crop')
    await addFiles(page, [FIXTURES.alphaPng])
    await expectItems(page, 1)

    const box = page.locator('[role="group"][aria-label^="Selection"]')
    await expect(box).toBeVisible()

    const readSize = async () => {
      const label = await box.getAttribute('aria-label')
      const match = label?.match(/(\d+)\s*×\s*(\d+)/)
      if (!match) throw new Error(`could not read the selection size from "${label}"`)
      return { width: Number(match[1]), height: Number(match[2]) }
    }

    expect(await readSize()).toEqual({ width: 1200, height: 800 })

    // Drag the south-east handle inwards with the mouse. The editor has to be in
    // view first: raw mouse coordinates are viewport relative and do not scroll.
    const handle = page.locator('button[aria-label="Selection se"]')
    await handle.scrollIntoViewIfNeeded()
    const handleBox = await handle.boundingBox()
    if (!handleBox) throw new Error('crop handle has no bounding box')

    const startX = handleBox.x + handleBox.width / 2
    const startY = handleBox.y + handleBox.height / 2
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX - 120, startY - 80, { steps: 10 })
    await page.mouse.up()

    const after = await readSize()
    expect(after.width).toBeLessThan(1200)
    expect(after.height).toBeLessThan(800)

    await runProcess(page)
    await waitForDone(page, 1)
    const file = await captureDownload(page, () =>
      page.getByTestId('file-item').first().getByRole('button', { name: /^Download/ }).click(),
    )
    // The exported pixels match the selection that was shown.
    expect(await decodeSize(page, file.buffer)).toEqual(after)
  })

  test('keyboard arrows nudge the selection', async ({ page }) => {
    await openTool(page, 'crop')
    await addFiles(page, [FIXTURES.alphaPng])
    await expectItems(page, 1)

    const box = page.locator('[role="group"][aria-label^="Selection"]')
    await page.getByRole('button', { name: '1:1', exact: true }).click()
    const before = await box.boundingBox()
    await box.focus()
    for (let index = 0; index < 5; index += 1) await page.keyboard.press('ArrowRight')
    const after = await box.boundingBox()
    expect(after!.x).toBeGreaterThan(before!.x)
  })

  test('crop only processes the selected image', async ({ page }) => {
    await openTool(page, 'crop')
    await addFiles(page, [FIXTURES.alphaPng, FIXTURES.jpeg])
    await expectItems(page, 2)

    await runProcess(page)
    await expect(page.locator('[data-testid="file-item"] .badge-ok')).toHaveCount(1, { timeout: 60_000 })
    await expect(page.getByText('Crop applies to the selected image only.')).toBeVisible()
  })
})
