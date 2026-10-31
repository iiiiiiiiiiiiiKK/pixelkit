import { expect, test } from '@playwright/test'
import { FIXTURES, addFiles, expectItems, waitForDone } from './helpers'

/**
 * Runs in the `mobile-safari` project: real WebKit at an iPhone 13 viewport
 * (390 × 844, DPR 3, touch, mobile meta viewport). This is the checks that
 * matter for the "iPhone must be properly responsive" requirement.
 */

/**
 * Fails if anything pushes the page wider than the screen. Elements inside a
 * horizontal scroller (the tool rail) are allowed to be wider — that is what the
 * scroller is for.
 */
async function assertNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const metrics = await page.evaluate(() => {
    const insideScroller = (element: Element): boolean => {
      let node = element.parentElement
      while (node) {
        if (/(auto|scroll)/.test(getComputedStyle(node).overflowX)) return true
        node = node.parentElement
      }
      return false
    }
    const offenders = [...document.querySelectorAll('body *')]
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        if (rect.width === 0 || rect.right <= window.innerWidth + 1) return false
        return !insideScroller(element)
      })
      .slice(0, 5)
      .map((element) => `${element.tagName.toLowerCase()}.${(element.className || '').toString().slice(0, 30)}`)
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      offenders,
    }
  })
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth)
  expect(metrics.offenders).toEqual([])
}

test.describe('iPhone (WebKit)', () => {
  test('home fits the viewport and the menu works', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await assertNoHorizontalOverflow(page)

    // Desktop navigation is replaced by a sheet inside the header.
    const header = page.locator('header')
    await expect(header.getByRole('link', { name: 'How it works' }).first()).toBeHidden()
    await page.getByRole('button', { name: /Open navigation|Close/ }).click()
    const sheetLink = header.getByRole('link', { name: 'How it works' }).first()
    await expect(sheetLink).toBeVisible()
    await sheetLink.click()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('How PixelKit works')
  })

  test('tap targets are large enough and text stays readable', async ({ page }) => {
    await page.goto('/')
    const small = await page.evaluate(() => {
      // Buttons and block level links must be comfortably tappable; inline prose
      // links are excluded because they follow the line box of the text.
      const interactive = [...document.querySelectorAll('button, a, [role="button"]')]
      return interactive
        .filter((element) => {
          // The skip link is intentionally 1×1 until it is focused.
          if (element.closest('.sr-only-focusable')) return false
          const style = getComputedStyle(element)
          if (element.tagName === 'A' && style.display === 'inline') return false
          if (style.visibility === 'hidden' || style.display === 'none') return false
          const rect = element.getBoundingClientRect()
          return rect.width > 1 && rect.height > 1 && rect.height < 32
        })
        .map((element) => `${element.tagName}:${(element.textContent ?? '').trim().slice(0, 16)}`)
        .slice(0, 5)
    })
    expect(small).toEqual([])
  })

  test('the workspace stacks preview above settings and processes a photo', async ({ page }) => {
    await page.goto('/#/tool/compress')
    await expect(page.getByTestId('dropzone')).toBeVisible()
    await assertNoHorizontalOverflow(page)

    await addFiles(page, [FIXTURES.jpeg])
    await expectItems(page, 1)

    const preview = await page.getByRole('heading', { name: 'Result' }).locator('xpath=ancestor::section[1]').boundingBox()
    const settings = await page.getByRole('heading', { name: 'Settings' }).locator('xpath=ancestor::section[1]').boundingBox()
    expect(preview!.y).toBeLessThan(settings!.y)

    await page.getByTestId('process-mobile').click()
    await waitForDone(page, 1)
    await expect(page.getByTestId('download-zip')).toBeVisible()
    await assertNoHorizontalOverflow(page)
  })

  test('language and theme switches work on mobile', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('lang-toggle').click()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('图片处理')
    await page.getByTestId('theme-toggle').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await assertNoHorizontalOverflow(page)
  })
})
