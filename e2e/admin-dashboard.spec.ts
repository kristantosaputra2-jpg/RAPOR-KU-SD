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

async function openAuthenticatedDashboard(page: Page, withClassPeriod = false) {
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
  await page.route("**/rest/v1/schools*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withClassPeriod ? [{ id: "school-1" }] : [],
    })
  })
  await page.route("**/rest/v1/academic_years*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withClassPeriod
        ? [
            {
              id: "year-1",
              school_id: "school-1",
              name: "2026/2027",
              is_active: true,
              created_at: "2026-09-02T00:00:00.000Z",
              updated_at: "2026-09-02T00:00:00.000Z",
            },
          ]
        : [],
    })
  })
  await page.route("**/rest/v1/semesters*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withClassPeriod
        ? [
            {
              id: "semester-1",
              academic_year_id: "year-1",
              number: 1,
              is_active: true,
              created_at: "2026-09-02T00:00:00.000Z",
              updated_at: "2026-09-02T00:00:00.000Z",
            },
          ]
        : [],
    })
  })
  await page.route("**/rest/v1/teacher_profiles*", async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route("**/rest/v1/classes*", async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route("**/rest/v1/students*", async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route("**/rest/v1/class_members*", async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route("**/rest/v1/public_school_identity*", async (route) => {
    await route.fulfill({
      status: 200,
      json: [
        {
          school_name: "SD Negeri Tumbang Kawei",
          logo_url: null,
        },
      ],
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
  await expect(
    page.getByText("RapotKu - SD Negeri Tumbang Kawei"),
  ).toBeVisible()
}

async function openSignedOutLogin(page: Page) {
  await page.route("**/rest/v1/public_school_identity*", async (route) => {
    await route.fulfill({
      status: 200,
      json: [
        {
          school_name: "SD Negeri Tumbang Kawei",
          logo_url: null,
        },
      ],
    })
  })

  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Masuk ke akun Anda" }),
  ).toBeVisible()
}

async function openSchoolSettings(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Pengaturan Sekolah" })
      .click()
  } else {
    await page.getByRole("button", { name: "Pengaturan Sekolah" }).click()
  }

  await expect(
    page.getByRole("heading", { name: "Pengaturan Sekolah" }),
  ).toBeVisible()
}

async function openAcademicPeriods(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Tahun & Semester" })
      .click()
  } else {
    await page.getByRole("button", { name: "Tahun & Semester" }).click()
  }

  await expect(
    page.getByRole("heading", { name: "Tahun Ajaran & Semester" }),
  ).toBeVisible()
}

async function openTeachers(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Data Guru" })
      .click()
  } else {
    await page.getByRole("button", { name: "Data Guru" }).click()
  }

  await expect(page.getByRole("heading", { name: "Data Guru" })).toBeVisible()
}

async function openClasses(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Data Kelas" })
      .click()
  } else {
    await page.getByRole("button", { name: "Data Kelas" }).click()
  }

  await expect(page.getByRole("heading", { name: "Data Kelas" })).toBeVisible()
}

async function openStudents(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Data Siswa" })
      .click()
  } else {
    await page.getByRole("button", { name: "Data Siswa" }).click()
  }

  await expect(page.getByRole("heading", { name: "Data Siswa" })).toBeVisible()
}

const mobileViewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
] as const

for (const viewport of mobileViewports.slice(0, 2)) {
  test(`login bergambar utuh pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openSignedOutLogin(page)

    const heroImage = page.getByAltText(
      "Ilustrasi siswa sekolah dasar di halaman sekolah",
    )
    await expect(heroImage).toBeVisible()
    await expect(page.getByText("SD Negeri Tumbang Kawei").last()).toBeVisible()

    const imageRatio = await heroImage.evaluate((image: HTMLImageElement) => ({
      displayed: image.clientWidth / image.clientHeight,
      natural: image.naturalWidth / image.naturalHeight,
    }))

    expect(Math.abs(imageRatio.displayed - imageRatio.natural)).toBeLessThan(
      0.02,
    )
  })
}

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

const settingsViewports = [
  ...mobileViewports,
  { width: 1280, height: 900 },
] as const

for (const viewport of settingsViewports) {
  test(`pengaturan sekolah nyaman pada ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page)
    await openSchoolSettings(page, viewport.width)

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(layout.scrollWidth).toBe(layout.clientWidth)
    await expect(page.getByLabel(/Nama sekolah/)).toBeVisible()
    await expect(page.getByLabel("Nama kepala sekolah")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Simpan pengaturan" }),
    ).toBeVisible()
  })
}

for (const viewport of settingsViewports) {
  test(`Data Guru nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page)
    await openTeachers(page, viewport.width)

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(layout.scrollWidth).toBe(layout.clientWidth)
    await expect(page.getByLabel("Cari guru")).toBeVisible()
    await expect(page.getByText("Belum ada data guru")).toBeVisible()

    await page.getByRole("button", { name: "Tambah Guru" }).first().click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByLabel(/Nama Lengkap/)).toBeVisible()
    await expect(page.getByLabel(/Peran Utama/)).toBeVisible()
  })
}

for (const viewport of settingsViewports) {
  test(`Data Kelas nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page, true)
    await openClasses(page, viewport.width)

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(layout.scrollWidth).toBe(layout.clientWidth)
    await expect(page.getByLabel("Cari kelas")).toBeVisible()
    await expect(page.getByText("Belum ada data kelas")).toBeVisible()

    await page.getByRole("button", { name: "Tambah Kelas" }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByLabel(/Tingkat Kelas/)).toBeVisible()
    await expect(page.getByLabel(/Nama Rombel/)).toBeVisible()
    await expect(page.getByText(/lower_primary/)).toBeVisible()
  })
}

for (const viewport of settingsViewports) {
  test(`Data Siswa nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page, true)
    await openStudents(page, viewport.width)

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(layout.scrollWidth).toBe(layout.clientWidth)
    await expect(page.getByLabel("Cari siswa")).toBeVisible()
    await expect(page.getByLabel("Filter kelas")).toBeVisible()
    await expect(page.getByText("Belum ada data siswa")).toBeVisible()

    await page.getByRole("button", { name: "Tambah Siswa" }).first().click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByLabel(/Nama Lengkap/)).toBeVisible()
    await expect(page.getByLabel(/Kelas Semester Aktif/)).toBeVisible()
  })
}

for (const viewport of settingsViewports) {
  test(`tahun ajaran dan semester nyaman pada ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page)
    await openAcademicPeriods(page, viewport.width)

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(layout.scrollWidth).toBe(layout.clientWidth)
    await expect(page.getByLabel("Nama tahun ajaran")).toBeVisible()
    await expect(page.getByText("Belum ada tahun ajaran")).toBeVisible()
    await expect(page.getByRole("button", { name: "Tambah" })).toBeVisible()
  })
}
