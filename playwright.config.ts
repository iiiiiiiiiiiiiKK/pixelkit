import { defineConfig, devices } from '@playwright/test'

const PORT = 5183

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'en-US',
    timezoneId: 'Asia/Shanghai',
    trace: 'retain-on-failure',
    video: 'off',
  },
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], locale: 'en-US' },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      // Real WebKit with an iPhone 13 viewport — this is the Safari engine that
      // ships on iOS, not a resized desktop Chromium.
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'], locale: 'en-US' },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
})
