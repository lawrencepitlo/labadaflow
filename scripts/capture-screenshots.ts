import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

async function run() {
  const outDir = resolve(process.cwd(), 'screenshots')
  mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })

  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 },
  ]

  const themes: Array<'light' | 'dark'> = ['light', 'dark']

  const routes = [
    { path: '/', name: 'landing' },
    { path: '/track', name: 'track-search' },
    { path: '/track/LF-BTW4F050', name: 'track-detail' },
    { path: '/sign-in', name: 'sign-in' },
  ]

  for (const vp of viewports) {
    for (const theme of themes) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme,
      })
      const page = await context.newPage()

      for (const r of routes) {
        try {
          await page.goto(`http://localhost:3000${r.path}`, { waitUntil: 'networkidle' })
          // If dark mode, ensure dark class is set on <html>
          if (theme === 'dark') {
            await page.evaluate(() => document.documentElement.classList.add('dark'))
          } else {
            await page.evaluate(() => document.documentElement.classList.remove('dark'))
          }
          await page.waitForTimeout(400)

          const filename = `${r.name}_${vp.name}_${theme}.png`
          await page.screenshot({ path: resolve(outDir, filename), fullPage: false })
          console.log(`Saved screenshot: ${filename}`)
        } catch (err: unknown) {
          console.error(`Error capturing ${r.path} (${vp.name}, ${theme}):`, err instanceof Error ? err.message : String(err))
        }
      }

      await context.close()
    }
  }

  await browser.close()
  console.log('All screenshots captured successfully!')
}

run().catch(console.error)
