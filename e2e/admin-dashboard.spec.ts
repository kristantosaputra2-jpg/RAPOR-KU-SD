import { expect, test, type Page } from "@playwright/test"

const adminUser = {
  id: "admin-dashboard-test",
  aud: "authenticated",
  role: "authenticated",
  email: "admin@example.com",
  email_confirmed_at: "2026-09-02T00:00:00.000Z",
  phone: "",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  identities: [],
  created_at: "2026-09-02T00:00:00.000Z",
  updated_at: "2026-09-02T00:00:00.000Z",
}

async function openAuthenticatedDashboard(page: Page) {
  const supabaseUrl = process.env.RAPOTKU_E2E_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error("VITE_SUPABASE_URL belum tersedia untuk pengujian E2E.")
  }

  const projectReference = new URL(supabaseUrl).hostname.split(".")[0]

  if (!projectReference) {
    throw new Error("Referensi project Supabase tidak valid.")
  }

  await page.route("**/auth/v1/user", async (route) => {
    await route.fulfill({ status: 200, json: adminUser })
  })
  await page.route("**/rest/v1/profiles*", async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        id: adminUser.id,
        full_name: "Admin Sekolah",
        role: "admin",
        is_active: true,
      },
    })
  })

  await page.addInitScript(
    ({ projectRef, user }) => {
      const session = {
        access_token: "e2e-access-token",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: "e2e-refresh-token",
        user,
      }

      window.localStorage.setItem(
        `sb-${projectRef}-auth-token`,
        JSON.stringify(session),
      )
    },
    { projectRef: projectReference, user: adminUser },
  )

  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Ringkasan hari ini" }),
  ).toBeVisible()
}

const mobileViewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
] as const

for (const viewport of mobileViewports) {
  test(`dashboard nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page)

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(layout.scrollWidth).toBe(layout.clientWidth)
    await expect(page.getByRole("button", { name: "Buka menu" })).toBeVisible()

    await page.getByRole("button", { name: "Buka menu" }).click()
    await expect(page.getByLabel("Menu Admin")).toBeVisible()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Tutup menu" })
      .click()
    await expect(page.getByLabel("Menu Admin")).toBeHidden()
  })
}

test("dashboard nyaman pada desktop 1280px", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await openAuthenticatedDashboard(page)

  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))

  expect(layout.scrollWidth).toBe(layout.clientWidth)
  await expect(page.getByRole("button", { name: "Buka menu" })).toBeHidden()
  await expect(
    page.getByRole("navigation", { name: "Menu utama" }),
  ).toBeVisible()
})
