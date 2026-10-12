import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests against the built static site (`npm run build` first).
 *
 * CI installs Playwright's own Chromium. Elsewhere, PW_CHROMIUM_PATH can
 * point at an existing Chromium binary instead.
 */
const PORT = 4173;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH }
      : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node e2e/serve.mjs",
    url: `http://localhost:${PORT}/`,
    env: { PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
  },
});
