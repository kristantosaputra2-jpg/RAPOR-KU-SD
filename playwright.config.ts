import { defineConfig, devices } from "@playwright/test"
import { loadEnv } from "vite"

const environment = loadEnv("development", process.cwd(), "")
process.env.RAPOTKU_E2E_SUPABASE_URL = environment.VITE_SUPABASE_URL

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:5173",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
  },
})
