/**
 * Captures the screenshots used in README.md from the real app.
 * Usage: npm run build && npm run preview  (or npm run dev), then
 *        node scripts/screenshots.mjs [baseUrl]
 */
import { chromium } from '@playwright/test'
import { mkdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(here, '..')
const outDir = resolve(projectRoot, 'docs/screenshots')
const base = process.argv[2] ?? process.env.BASE ?? 'http://localhost:5180'

const FIXTURES = [
  'tests/e2e/fixtures/photo-wide.jpg',
  'tests/e2e/fixtures/photo-alpha.png',
  'tests/e2e/fixtures/graphic.webp',
].map((file) => resolve(projectRoot, file))

async function settle(page, ms = 350) {
  await page.waitForTimeout(ms)
}

async function main() {
  await mkdir(outDir, { recursive: true })
  const browser = await chromium.launch()

  const desktop = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    // 1.5× keeps retina crispness without making the README weigh 5 MB.
    deviceScaleFactor: 1.5,
    locale: 'en-US',
  })
  await desktop.addInitScript(() => {
    localStorage.setItem('pixelkit.lang', 'en')
    localStorage.setItem('pixelkit.theme', 'light')
  })

  await desktop.goto(base, { waitUntil: 'networkidle' })
  await settle(desktop)
  await desktop.screenshot({ path: resolve(outDir, 'home-light.png') })

  await desktop.getByTestId('theme-toggle').click()
  await settle(desktop)
  await desktop.screenshot({ path: resolve(outDir, 'home-dark.png') })

  await desktop.getByTestId('theme-toggle').click()
  await settle(desktop, 200)

  // Compress, with real files and a finished batch.
  await desktop.goto(`${base}/#/tool/compress`, { waitUntil: 'networkidle' })
  await desktop.setInputFiles('[data-testid="add-more-input"]', FIXTURES)
  await settle(desktop, 900)
  await desktop.getByTestId('process').click()
  await desktop.locator('[data-testid="file-item"] .badge-ok').first().waitFor({ timeout: 60_000 })
  await desktop.waitForFunction(
    () => document.querySelectorAll('[data-testid="file-item"] .badge-ok').length === 3,
    undefined,
    { timeout: 90_000 },
  )
  await settle(desktop, 400)
  await desktop.screenshot({ path: resolve(outDir, 'workspace-compress.png') })

  // Crop editor with a 1:1 selection.
  await desktop.goto(`${base}/#/tool/crop`, { waitUntil: 'networkidle' })
  await settle(desktop, 400)
  await desktop.setInputFiles('[data-testid="add-more-input"]', [FIXTURES[1]])
  await settle(desktop, 700)
  await desktop.getByRole('button', { name: '1:1', exact: true }).click()
  await settle(desktop, 400)
  await desktop.screenshot({ path: resolve(outDir, 'workspace-crop.png') })

  // Batch rename preview.
  await desktop.goto(`${base}/#/tool/rename`, { waitUntil: 'networkidle' })
  await settle(desktop, 400)
  await desktop.setInputFiles('[data-testid="add-more-input"]', FIXTURES)
  await settle(desktop, 800)
  await desktop.screenshot({ path: resolve(outDir, 'workspace-rename.png') })

  // Mobile (iPhone 13 viewport, WebKit-like metrics on Chromium).
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    locale: 'en-US',
  })
  await mobile.addInitScript(() => {
    localStorage.setItem('pixelkit.lang', 'zh')
    localStorage.setItem('pixelkit.theme', 'light')
  })
  await mobile.goto(base, { waitUntil: 'networkidle' })
  await settle(mobile, 500)
  await mobile.screenshot({ path: resolve(outDir, 'mobile-home.png') })

  await mobile.goto(`${base}/#/tool/compress`, { waitUntil: 'networkidle' })
  await settle(mobile, 400)
  await mobile.setInputFiles('[data-testid="add-more-input"]', [FIXTURES[0]])
  await settle(mobile, 700)
  await mobile.getByTestId('process-mobile').click()
  await mobile.locator('[data-testid="file-item"] .badge-ok').first().waitFor({ timeout: 60_000 })
  await settle(mobile, 400)
  await mobile.screenshot({ path: resolve(outDir, 'mobile-workspace.png') })

  // App icon (180 × 180 PNG) generated from the real logo mark.
  const iconPage = await browser.newPage({ viewport: { width: 180, height: 180 }, deviceScaleFactor: 1 })
  await iconPage.setContent(
    `<body style="margin:0;background:transparent">
       <img src="${base}/favicon.svg" width="180" height="180" />
     </body>`,
  )
  await iconPage.waitForTimeout(300)
  await iconPage.screenshot({
    path: resolve(projectRoot, 'public/apple-touch-icon.png'),
    omitBackground: true,
  })

  await browser.close()

  const files = ['home-light.png', 'home-dark.png', 'workspace-compress.png', 'workspace-crop.png']
  for (const name of files) {
    const buffer = await readFile(resolve(outDir, name))
    console.log(`${name}: ${(buffer.length / 1024).toFixed(0)} kB`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
