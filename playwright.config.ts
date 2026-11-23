import { defineConfig } from '@playwright/test'

const baseURL = 'http://127.0.0.1:4174'
const portableScenarios = /(?:cross-browser|workbench-responsive|chart-inspection|catalog-navigation)\.spec\.ts$/

export default defineConfig({
  testDir: './e2e',
  forbidOnly: Boolean(process.env.CI),
  use: {
    baseURL,
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'webkit-tablet', testMatch: portableScenarios, use: { browserName: 'webkit', viewport: { width: 820, height: 1180 }, hasTouch: true } },
    { name: 'firefox-laptop', testMatch: portableScenarios, use: { browserName: 'firefox', viewport: { width: 1280, height: 720 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: 'vite preview --host 127.0.0.1 --port 4174 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
  },
})
