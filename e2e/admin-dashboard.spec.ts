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

async function openAuthenticatedDashboard(
  page: Page,
  withClassPeriod = false,
  withGradeData = false,
  gradeLevel = 2,
) {
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
    await route.fulfill({
      status: 200,
      json: withGradeData
        ? [
            {
              id: "class-1",
              academic_year_id: "year-1",
              semester_id: "semester-1",
              grade_level: gradeLevel,
              name: `Kelas ${gradeLevel}A`,
              homeroom_teacher_id: null,
              template_group:
                gradeLevel <= 3 ? "lower_primary" : "upper_primary",
              created_at: "2026-09-02T00:00:00.000Z",
              updated_at: "2026-09-02T00:00:00.000Z",
            },
          ]
        : [],
    })
  })
  await page.route("**/rest/v1/students*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withGradeData
        ? ["Ani", "Budi", "Citra"].map((name, index) => ({
            id: `student-${index + 1}`,
            full_name: name,
            nis: `100${index + 1}`,
            nisn: null,
            gender: index === 1 ? "male" : "female",
            birth_place: null,
            birth_date: null,
            religion: null,
            address: null,
            father_name: null,
            mother_name: null,
            guardian_name: null,
            is_active: true,
            created_at: "2026-09-02T00:00:00.000Z",
            updated_at: "2026-09-02T00:00:00.000Z",
          }))
        : [],
    })
  })
  await page.route("**/rest/v1/class_members*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withGradeData
        ? [1, 2, 3].map((number) => ({
            id: `member-${number}`,
            student_id: `student-${number}`,
            class_id: "class-1",
            semester_id: "semester-1",
            created_at: "2026-09-02T00:00:00.000Z",
            updated_at: "2026-09-02T00:00:00.000Z",
          }))
        : [],
    })
  })
  await page.route("**/rest/v1/subjects*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withGradeData
        ? [
            {
              id: "subject-1",
              name: "Matematika",
              code: "MTK",
              is_local_content: false,
              display_order: 1,
              is_active: true,
              created_at: "2026-09-02T00:00:00.000Z",
              updated_at: "2026-09-02T00:00:00.000Z",
            },
          ]
        : [],
    })
  })
  await page.route("**/rest/v1/teacher_assignments*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withGradeData
        ? [
            {
              id: "assignment-1",
              teacher_id: "teacher-1",
              class_id: "class-1",
              subject_id: "subject-1",
              academic_year_id: "year-1",
              semester_id: "semester-1",
              is_active: true,
              created_at: "2026-09-02T00:00:00.000Z",
              updated_at: "2026-09-02T00:00:00.000Z",
            },
          ]
        : [],
    })
  })
  await page.route("**/rest/v1/learning_outcomes*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withGradeData
        ? [
            {
              id: "outcome-1",
              subject_id: "subject-1",
              grade_level: gradeLevel,
              semester_id: "semester-1",
              code: "CP-1",
              title: "Bilangan dasar",
              description: "Memahami bilangan dasar.",
              is_active: true,
              created_at: "2026-09-02T00:00:00.000Z",
              updated_at: "2026-09-02T00:00:00.000Z",
            },
            {
              id: "outcome-2",
              subject_id: "subject-1",
              grade_level: gradeLevel,
              semester_id: "semester-1",
              code: "CP-2",
              title: "Operasi hitung",
              description: "Menerapkan operasi hitung sederhana.",
              is_active: true,
              created_at: "2026-09-02T00:00:00.000Z",
              updated_at: "2026-09-02T00:00:00.000Z",
            },
          ]
        : [],
    })
  })
  await page.route("**/rest/v1/grading_rules*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withGradeData
        ? [
            {
              id: "rule-1",
              class_id: "class-1",
              subject_id: "subject-1",
              semester_id: "semester-1",
              minimum_mastery_score: 65,
              created_at: "2026-09-02T00:00:00.000Z",
              updated_at: "2026-09-02T00:00:00.000Z",
            },
          ]
        : [],
    })
  })
  await page.route("**/rest/v1/assessment_components*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withGradeData
        ? [
            {
              id: "component-knowledge",
              code: "knowledge",
              name: "Pengetahuan",
              display_order: 1,
              is_active: true,
            },
            {
              id: "component-skills",
              code: "skills",
              name: "Keterampilan",
              display_order: 2,
              is_active: true,
            },
          ]
        : [],
    })
  })
  await page.route("**/rest/v1/grading_settings*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withGradeData
        ? [
            {
              id: "setting-1",
              semester_id: "semester-1",
              kkm_mode: "single",
              single_kkm: 65,
            },
          ]
        : [],
    })
  })
  await page.route("**/rest/v1/subject_kkm_rules*", async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route("**/rest/v1/grade_entries*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withGradeData
        ? [1, 2, 3].flatMap((studentNumber) =>
            [
              ["outcome-1", 90],
              ["outcome-2", 70],
            ].map(([outcomeId, score], index) => ({
              id: `grade-${studentNumber}-${index + 1}`,
              student_id: `student-${studentNumber}`,
              class_id: "class-1",
              subject_id: "subject-1",
              learning_outcome_id: outcomeId,
              assessment_component_id: "component-knowledge",
              semester_id: "semester-1",
              grade_level: gradeLevel,
              score,
              created_at: "2026-09-02T00:00:00.000Z",
              updated_at: "2026-09-02T00:00:00.000Z",
            })),
          )
        : [],
    })
  })
  await page.route("**/rest/v1/report_descriptions*", async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route("**/rest/v1/attendance*", async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route("**/rest/v1/extracurriculars*", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        json: {
          id: "extra-1",
          school_id: "school-1",
          name: "Pramuka",
          is_active: true,
          created_at: "2026-09-03T00:00:00.000Z",
          updated_at: "2026-09-03T00:00:00.000Z",
        },
      })
      return
    }
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route("**/rest/v1/student_extracurriculars*", async (route) => {
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

  await expect(
    page.getByRole("heading", { name: "Data Siswa", exact: true }),
  ).toBeVisible()
}

async function openSubjects(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Mata Pelajaran" })
      .click()
  } else {
    await page.getByRole("button", { name: "Mata Pelajaran" }).click()
  }

  await expect(
    page.getByRole("heading", { name: "Mata Pelajaran", exact: true }),
  ).toBeVisible()
}

async function openAssignments(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Penugasan Guru" })
      .click()
  } else {
    await page.getByRole("button", { name: "Penugasan Guru" }).click()
  }

  await expect(
    page.getByRole("heading", { name: "Penugasan Guru", exact: true }),
  ).toBeVisible()
}

async function openLearningOutcomes(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "CP / Deskripsi" })
      .click()
  } else {
    await page.getByRole("button", { name: "CP / Deskripsi" }).click()
  }

  await expect(
    page.getByRole("heading", { name: "CP / Deskripsi", exact: true }),
  ).toBeVisible()
}

async function openGrades(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Input Nilai" })
      .click()
  } else {
    await page.getByRole("button", { name: "Input Nilai" }).click()
  }
  await expect(
    page.getByRole("heading", { name: "Nilai seluruh siswa" }),
  ).toBeVisible()
}

async function openAttendance(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Absensi" })
      .click()
  } else {
    await page.getByRole("button", { name: "Absensi" }).click()
  }
  await expect(
    page.getByRole("heading", { name: "Absensi seluruh siswa" }),
  ).toBeVisible()
}

async function openExtracurriculars(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Ekstrakurikuler" })
      .click()
  } else {
    await page.getByRole("button", { name: "Ekstrakurikuler" }).click()
  }
  await expect(
    page.getByRole("heading", { name: "Ekstrakurikuler siswa" }),
  ).toBeVisible()
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
  test(`Mata Pelajaran nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page)
    await openSubjects(page, viewport.width)

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(layout.scrollWidth).toBe(layout.clientWidth)
    await expect(page.getByLabel("Cari mata pelajaran")).toBeVisible()
    await expect(page.getByLabel("Filter jenis mata pelajaran")).toBeVisible()
    await expect(page.getByText("Belum ada mata pelajaran")).toBeVisible()

    await page
      .getByRole("button", { name: "Tambah Mata Pelajaran" })
      .first()
      .click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByLabel(/Nama Mata Pelajaran/)).toBeVisible()
    await expect(
      page.getByLabel(/Ini mata pelajaran muatan lokal/),
    ).toBeVisible()
  })
}

for (const viewport of settingsViewports) {
  test(`Penugasan Guru nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page)
    await openAssignments(page, viewport.width)

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(layout.scrollWidth).toBe(layout.clientWidth)
    await expect(page.getByLabel("Cari penugasan")).toBeVisible()
    await expect(page.getByLabel("Filter kelas")).toBeVisible()
    await expect(page.getByText("Belum ada penugasan")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Tambah Penugasan" }),
    ).toBeDisabled()
  })
}

for (const viewport of settingsViewports) {
  test(`CP dan Deskripsi nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page)
    await openLearningOutcomes(page, viewport.width)

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(layout.scrollWidth).toBe(layout.clientWidth)
    await expect(page.getByLabel("Cari CP")).toBeVisible()
    await expect(page.getByLabel("Filter mata pelajaran")).toBeVisible()
    await expect(page.getByText("Belum ada CP")).toBeVisible()
    await expect(page.getByText(/tidak mengarang rumus nilai/i)).toBeVisible()
  })
}

for (const viewport of settingsViewports) {
  test(`Input Nilai nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page, true, true)
    await openGrades(page, viewport.width)

    await expect(
      page.locator(
        'input[aria-label="Pengetahuan Bilangan dasar Ani"]:visible',
      ),
    ).toBeVisible()
    await expect(
      page.locator(
        'input[aria-label="Pengetahuan Bilangan dasar Budi"]:visible',
      ),
    ).toBeVisible()
    await expect(
      page.locator(
        'input[aria-label="Pengetahuan Bilangan dasar Citra"]:visible',
      ),
    ).toBeVisible()
    await page.getByRole("button", { name: "Keterampilan" }).click()
    await expect(
      page.locator(
        'input[aria-label="Keterampilan Bilangan dasar Ani"]:visible',
      ),
    ).toBeVisible()
    await page.getByRole("button", { name: "Pengetahuan" }).click()
    await expect(page.getByText("A: 89–100")).toBeVisible()
    await expect(page.getByText("B: 77–88")).toBeVisible()

    await page.locator("button:visible", { hasText: "Buat" }).first().click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByLabel("Deskripsi final")).toHaveValue(
      /perlu meningkatkan/,
    )

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(layout.scrollWidth).toBe(layout.clientWidth)
  })
}

for (const gradeLevel of [4, 5, 6]) {
  test(`Input Nilai kelas ${gradeLevel} memuat seluruh siswa dan dua komponen`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await openAuthenticatedDashboard(page, true, true, gradeLevel)
    await openGrades(page, 1280)

    await expect(page.getByLabel("Kelas")).toHaveValue("class-1")
    await expect(
      page.getByRole("option", {
        name: `Kelas ${gradeLevel}A · Kelas ${gradeLevel}`,
      }),
    ).toBeAttached()

    for (const studentName of ["Ani", "Budi", "Citra"]) {
      await expect(
        page.locator(
          `input[aria-label="Pengetahuan Bilangan dasar ${studentName}"]:visible`,
        ),
      ).toBeVisible()
    }

    await page.getByRole("button", { name: "Keterampilan" }).click()
    for (const studentName of ["Ani", "Budi", "Citra"]) {
      await expect(
        page.locator(
          `input[aria-label="Keterampilan Bilangan dasar ${studentName}"]:visible`,
        ),
      ).toBeVisible()
    }
  })
}

for (const viewport of settingsViewports) {
  test(`Absensi nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page, true, true)
    await openAttendance(page, viewport.width)

    for (const studentName of ["Ani", "Budi", "Citra"]) {
      await expect(
        page.locator(`input[aria-label="Sakit ${studentName}"]:visible`),
      ).toBeVisible()
      await expect(
        page.locator(`input[aria-label="Izin ${studentName}"]:visible`),
      ).toBeVisible()
      await expect(
        page.locator(
          `input[aria-label="Tanpa keterangan ${studentName}"]:visible`,
        ),
      ).toBeVisible()
    }

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(layout.scrollWidth).toBe(layout.clientWidth)
    await expect(
      page.getByRole("button", { name: "Simpan Absensi" }),
    ).toBeVisible()
  })
}

for (const viewport of settingsViewports) {
  test(`Ekstrakurikuler nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page, true, true)
    await openExtracurriculars(page, viewport.width)

    await page.getByLabel("Nama ekstrakurikuler").fill("Pramuka")
    await page.getByRole("button", { name: "Tambah" }).click()
    await expect(page.getByLabel("Pilih ekstrakurikuler")).toHaveValue(
      "extra-1",
    )
    await page.getByRole("checkbox", { name: /Ani/ }).check()
    await expect(page.getByLabel("Predikat Ani")).toBeVisible()
    await expect(page.getByLabel("Deskripsi Ani")).toBeVisible()

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(layout.scrollWidth).toBe(layout.clientWidth)
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
