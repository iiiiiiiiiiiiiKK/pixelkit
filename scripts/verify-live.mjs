/**
 * Verifies the deployed site with a real browser.
 *
 * Usage:
 *   npm run verify:live                      # checks the GitHub Pages URL
 *   node scripts/verify-live.mjs <url>
 *
 * It exercises the production build (hash routing, sub-path assets, the CSP
 * meta tag) and fails on console errors, so a broken deploy cannot pass.
 */
import { chromium, devices } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(here, '..')
const base = (process.argv[2] ?? 'https://iiiiiiiiiiiiiKK.github.io/pixelkit/').replace(/\/?$/, '/')

const results = []
let failures = 0

function check(name, condition, detail = '') {
  results.push({ name, ok: Boolean(condition), detail })
  if (!condition) failures += 1
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

function sniff(buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg'
  if (buffer[0] === 0x89 && buffer.toString('latin1', 1, 4) === 'PNG') return 'png'
  if (buffer.toString('latin1', 0, 4) === 'RIFF' && buffer.toString('latin1', 8, 12) === 'WEBP') return 'webp'
  if (buffer.toString('latin1', 0, 2) === 'PK') return 'zip'
  return 'unknown'
}

async function decodeSize(page, buffer) {
  return await page.evaluate(async (data) => {
    const binary = atob(data)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    const bitmap = await createImageBitmap(new Blob([bytes]))
    const size = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return size
  }, buffer.toString('base64'))
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: 'en-US' })
const consoleErrors = []
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`))

// --- home -------------------------------------------------------------------
const response = await page.goto(base, { waitUntil: 'networkidle' })
check('home responds 200', response?.status() === 200, `status ${response?.status()}`)
check('title', (await page.title()).includes('PixelKit'))
check('h1 present', (await page.locator('h1').innerText()).length > 10)
check('six tool entries', (await page.locator('#tools button').count()) === 6)

const csp = await page.getAttribute('meta[http-equiv="Content-Security-Policy"]', 'content')
check('CSP meta tag shipped', Boolean(csp) && csp.includes("default-src 'self'"))

const authorHref = await page.locator('a[href="https://x.com/0xkillcoin"]').first().getAttribute('href')
check('author X link', authorHref === 'https://x.com/0xkillcoin', authorHref ?? 'missing')

const cssLoaded = await page.evaluate(() => {
  const body = getComputedStyle(document.body)
  return body.backgroundColor !== 'rgba(0, 0, 0, 0)' && body.fontFamily.length > 0
})
check('stylesheet applied', cssLoaded)

// --- a real compress run on the deployed bundle -------------------------------
const fixture = resolve(projectRoot, 'tests/e2e/fixtures/photo-wide.jpg')
if (!existsSync(fixture)) {
  // The sample image is generated on demand (and git-ignored), so a fresh clone
  // can run this check without manual preparation.
  console.log('generating image fixtures…')
  execFileSync(process.execPath, [resolve(projectRoot, 'scripts/make-fixtures.mjs')], {
    cwd: projectRoot,
    stdio: 'inherit',
  })
}
await page.goto(`${base}#/tool/compress`, { waitUntil: 'networkidle' })
await page.setInputFiles('[data-testid="add-more-input"]', fixture)
await page.waitForSelector('[data-testid="file-item"]', { timeout: 15_000 })
check('file accepted in workspace', (await page.locator('[data-testid="file-item"]').count()) === 1)

await page.getByTestId('process').click()
await page.waitForSelector('[data-testid="file-item"] .badge-ok', { timeout: 60_000 })
check('image processed', (await page.locator('[data-testid="file-item"] .badge-ok').count()) === 1)

const downloadPromise = page.waitForEvent('download')
await page.getByTestId('file-item').first().getByRole('button', { name: /^Download/ }).click()
const download = await downloadPromise
const downloadedPath = await download.path()
const buffer = await readFile(downloadedPath)
const original = await readFile(fixture)
check('download produced a JPEG', sniff(buffer) === 'jpeg', sniff(buffer))
check('result is smaller than the source', buffer.length < original.length, `${buffer.length} < ${original.length}`)
check('download keeps the file name', download.suggestedFilename() === 'photo-wide.jpg', download.suggestedFilename())

// --- resize path (proves the worker runs on the deployed origin) -------------
// A fresh page so the queue from the compress run cannot leak into this check.
const resizePage = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: 'en-US' })
resizePage.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
resizePage.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`))
await resizePage.goto(`${base}#/tool/resize`, { waitUntil: 'networkidle' })
await resizePage.setInputFiles('[data-testid="add-more-input"]', fixture)
await resizePage.waitForSelector('[data-testid="file-item"]')
await resizePage.locator('#resize-width').fill('640')
await resizePage.getByTestId('process').click()
await resizePage.waitForSelector('[data-testid="file-item"] .badge-ok', { timeout: 60_000 })
const resizeDownload = resizePage.waitForEvent('download')
await resizePage.getByTestId('file-item').first().getByRole('button', { name: /^Download/ }).click()
const resized = await resizeDownload
const resizedBuffer = await readFile(await resized.path())
const size = await decodeSize(resizePage, resizedBuffer)
check('resized to 640 × 400', size.width === 640 && size.height === 400, `${size.width}×${size.height}`)
await resizePage.close()

// --- language + theme --------------------------------------------------------
await page.goto(base, { waitUntil: 'networkidle' })
await page.getByTestId('lang-toggle').click()
check('chinese interface', (await page.locator('h1').innerText()).includes('图片处理'))
await page.getByTestId('theme-toggle').click()
check('dark theme', (await page.getAttribute('html', 'data-theme')) === 'dark')

// --- mobile -----------------------------------------------------------------
const mobile = await browser.newPage({ ...devices['iPhone 13'], locale: 'zh-CN' })
const mobileErrors = []
mobile.on('pageerror', (error) => mobileErrors.push(error.message))
await mobile.goto(base, { waitUntil: 'networkidle' })
const overflow = await mobile.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  innerWidth: window.innerWidth,
}))
check('no horizontal overflow on iPhone', overflow.scrollWidth <= overflow.innerWidth, JSON.stringify(overflow))
check('mobile heading visible', await mobile.locator('h1').isVisible())
check('mobile language is zh-CN by default', (await mobile.locator('h1').innerText()).includes('图片处理'))
check('no mobile page errors', mobileErrors.length === 0, mobileErrors.join(' | '))

// --- hygiene ----------------------------------------------------------------
const cspViolations = consoleErrors.filter((text) => /Content Security Policy/i.test(text))
check('no CSP violations', cspViolations.length === 0, cspViolations.join(' | '))
check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '))

await browser.close()

console.log(`\n${results.filter((r) => r.ok).length}/${results.length} checks passed on ${base}`)
if (failures > 0) {
  console.error(`${failures} check(s) failed`)
  process.exit(1)
}
