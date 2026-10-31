/**
 * Generates real image fixtures for the end-to-end tests.
 *
 * The images are drawn in a headless Chromium canvas and encoded by the browser
 * itself, so the fixtures are genuine JPEG / PNG / WebP files rather than
 * hand-crafted byte blobs. Run automatically by `npm run test:e2e`.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(here, '../tests/e2e/fixtures')

const RECIPES = [
  { name: 'photo-wide.jpg', width: 1600, height: 1000, type: 'image/jpeg', quality: 0.95, variant: 'photo' },
  { name: 'photo-alpha.png', width: 1200, height: 800, type: 'image/png', variant: 'alpha' },
  { name: 'graphic.webp', width: 800, height: 600, type: 'image/webp', quality: 0.92, variant: 'graphic' },
  { name: 'small-tile.png', width: 320, height: 320, type: 'image/png', variant: 'graphic' },
  { name: 'portrait.jpg', width: 900, height: 1350, type: 'image/jpeg', quality: 0.9, variant: 'portrait' },
]

function drawImage({ width, height, variant }) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (variant === 'alpha') {
    // Transparent background: only the shapes are painted.
    ctx.clearRect(0, 0, width, height)
  } else {
    const sky = ctx.createLinearGradient(0, 0, width, height)
    sky.addColorStop(0, '#0f6b52')
    sky.addColorStop(0.55, '#1d9a7a')
    sky.addColorStop(1, '#f3f1eb')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, width, height)
  }

  const palette = ['#f5c04f', '#e86a58', '#2f6f9f', '#f3f1eb', '#17161a']
  palette.forEach((color, index) => {
    ctx.fillStyle = color
    ctx.beginPath()
    const cx = (width / (palette.length + 1)) * (index + 1)
    const cy = height * (0.35 + 0.22 * Math.sin(index * 1.7))
    ctx.arc(cx, cy, Math.min(width, height) * 0.14, 0, Math.PI * 2)
    ctx.fill()
  })

  // Fine detail makes "quality" actually visible in compression tests.
  ctx.strokeStyle = variant === 'alpha' ? 'rgba(23,22,26,0.45)' : 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 1
  for (let x = 0; x < width; x += 6) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + height * 0.15, height)
    ctx.stroke()
  }

  ctx.fillStyle = variant === 'alpha' ? '#0f6b52' : '#17161a'
  ctx.font = `600 ${Math.round(height * 0.11)}px sans-serif`
  ctx.fillText('PixelKit', width * 0.06, height * 0.9)

  return canvas.toDataURL('image/png')
}

async function main() {
  await mkdir(outDir, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage()

  for (const recipe of RECIPES) {
    const pngDataUrl = await page.evaluate(drawImage, recipe)
    let dataUrl = pngDataUrl
    if (recipe.type !== 'image/png') {
      // Re-encode the drawn canvas into the requested container format.
      dataUrl = await page.evaluate(
        async ({ source, type, quality }) => {
          const image = new Image()
          image.src = source
          await image.decode()
          const canvas = document.createElement('canvas')
          canvas.width = image.width
          canvas.height = image.height
          canvas.getContext('2d').drawImage(image, 0, 0)
          return canvas.toDataURL(type, quality)
        },
        { source: pngDataUrl, type: recipe.type, quality: recipe.quality },
      )
    }
    const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
    const buffer = Buffer.from(base64, 'base64')
    await writeFile(resolve(outDir, recipe.name), buffer)
    console.log(`fixture ${recipe.name} ${(buffer.length / 1024).toFixed(1)} kB`)
  }

  await browser.close()

  // A deliberately invalid file: looks harmless, must be rejected by the UI.
  await writeFile(resolve(outDir, 'notes.txt'), 'This is not an image at all.\n')
  console.log('fixture notes.txt (invalid)')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
