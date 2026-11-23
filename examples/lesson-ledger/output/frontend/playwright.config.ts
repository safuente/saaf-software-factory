import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.APP_URL;
if (!baseURL) {
  throw new Error("APP_URL is not set; run through `make e2e`, which reads .env");
}

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/support/global-setup.ts",
  forbidOnly: true,
  retries: 0,
  // The Docker VM that runs every project's stack has 4 CPUs, and each log-in or sign-up runs
  // Argon2id (64 MiB, 4 lanes) in the backend. More browsers than that only queue behind the
  // hashing and starve each other when the host is busy.
  workers: 4,
  // Log-in and sign-up wait for Argon2id on that shared VM: about 0.1 s idle, over 1 s with
  // 9 at once, and more under other projects' load. 10 s keeps every assertion and only waits
  // longer for the server to answer.
  expect: { timeout: 10_000 },
  reporter: "line",
  // ADR-007: every test runs with reduced motion, so nothing moves and results never depend on
  // timing. Only e2e/f08-motion.spec.ts overrides it, to check the motion itself.
  use: { baseURL, reducedMotion: "reduce" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
