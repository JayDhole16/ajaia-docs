import { defineConfig } from "@playwright/test";

/**
 * End-to-end walkthrough test. Runs against a running app:
 *   npm run dev                                   # then: npm run test:e2e
 *   E2E_BASE_URL=https://<live-url> npm run test:e2e
 * Uses the locally installed Google Chrome (no browser download needed).
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
  },
});
