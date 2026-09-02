import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ClassPage } from "@/features/classes/class-page"

const classMocks = vi.hoisted(() => ({
  getClasses: vi.fn(),
  createClass: vi.fn(),
  updateClass: vi.fn(),
}))

const academicPeriodMocks = vi.hoisted(() => ({
  getAcademicPeriods: vi.fn(),
}))

const teacherMocks = vi.hoisted(() => ({
  getTeachers: vi.fn(),
}))

vi.mock("@/features/classes/class.service", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/features/classes/class.service")>()
  return { ...original, ...classMocks }
})

vi.mock(
  "@/features/academic-periods/academic-periods.service",
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import("@/features/academic-periods/academic-periods.service")
      >()
    return { ...original, ...academicPeriodMocks }
  },
)

vi.mock("@/features/teachers/teacher.service", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/features/teachers/teacher.service")>()
  return { ...original, ...teacherMocks }
})

const periods = {
  schoolId: "school-1",
  academicYears: [
    {
      id: "year-1",
      school_id: "school-1",
      name: "2026/2027",
      is_active: true,
      created_at: "2026-09-02T00:00:00.000Z",
      updated_at: "2026-09-02T00:00:00.000Z",
    },
  ],
  semesters: [
    {
      id: "semester-1",
      academic_year_id: "year-1",
      number: 1,
      is_active: true,
      created_at: "2026-09-02T00:00:00.000Z",
      updated_at: "2026-09-02T00:00:00.000Z",
    },
  ],
}

const teacher = {
  id: "teacher-1",
  user_id: null,
  full_name: "Ibu Rina",
  nip: null,
  nuptk: null,
  email: "rina@example.com",
  role: "homeroom_teacher" as const,
  is_active: true,
  created_at: "2026-09-02T00:00:00.000Z",
  updated_at: "2026-09-02T00:00:00.000Z",
}

const schoolClass = {
  id: "class-1",
  academic_year_id: "year-1",
  semester_id: "semester-1",
  grade_level: 4,
  name: "4A",
  homeroom_teacher_id: "teacher-1",
  template_group: "upper_primary" as const,
  created_at: "2026-09-02T00:00:00.000Z",
  updated_at: "2026-09-02T00:00:00.000Z",
}

function renderPage(onOpenAcademicPeriods = vi.fn()) {
  return render(
    <ClassPage
      userId="admin-1"
      userName="Admin Sekolah"
      schoolName="SD Negeri Tumbang Kawei"
      onBack={vi.fn()}
      onLogout={vi.fn()}
      onOpenAcademicPeriods={onOpenAcademicPeriods}
    />,
  )
}

describe("ClassPage", () => {
  beforeEach(() => {
    classMocks.getClasses.mockReset()
    classMocks.createClass.mockReset()
    classMocks.updateClass.mockReset()
    academicPeriodMocks.getAcademicPeriods.mockReset()
    teacherMocks.getTeachers.mockReset()
    classMocks.getClasses.mockResolvedValue([])
    academicPeriodMocks.getAcademicPeriods.mockResolvedValue(periods)
    teacherMocks.getTeachers.mockResolvedValue([teacher])
  })

  it("menampilkan empty state kelas", async () => {
    renderPage()

    expect(await screen.findByText("Belum ada data kelas")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Tambah Kelas" })).toBeEnabled()
  })

  it("mengarahkan Admin mengatur periode ketika semester belum ada", async () => {
    const user = userEvent.setup()
    const onOpenAcademicPeriods = vi.fn()
    academicPeriodMocks.getAcademicPeriods.mockResolvedValue({
      schoolId: "school-1",
      academicYears: [],
      semesters: [],
    })
    renderPage(onOpenAcademicPeriods)

    await user.click(
      await screen.findByRole("button", { name: "Atur Tahun & Semester" }),
    )
    expect(onOpenAcademicPeriods).toHaveBeenCalledOnce()
  })

  it("menambahkan kelas dengan template yang ditentukan otomatis", async () => {
    const user = userEvent.setup()
    classMocks.createClass.mockResolvedValue(schoolClass)
    renderPage()

    await user.click(
      await screen.findByRole("button", { name: "Tambah Kelas" }),
    )
    await user.selectOptions(screen.getByLabelText(/Tingkat Kelas/), "4")
    await user.type(screen.getByLabelText(/Nama Rombel/), "4A")
    await user.selectOptions(screen.getByLabelText(/Wali Kelas/), "teacher-1")
    expect(screen.getByText(/Kelas Tinggi · upper_primary/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Simpan Kelas" }))

    await waitFor(() => {
      expect(classMocks.createClass).toHaveBeenCalledWith("admin-1", {
        academicYearId: "year-1",
        semesterId: "semester-1",
        gradeLevel: 4,
        name: "4A",
        homeroomTeacherId: "teacher-1",
      })
    })
    expect(
      await screen.findByText("Kelas berhasil ditambahkan."),
    ).toBeInTheDocument()
  })

  it("menampilkan periode dan wali kelas pada kartu", async () => {
    classMocks.getClasses.mockResolvedValue([schoolClass])
    renderPage()

    expect(
      (await screen.findAllByText("2026/2027 · Semester 1")).length,
    ).toBeGreaterThan(0)
    expect(screen.getByText("Ibu Rina")).toBeInTheDocument()
    expect(screen.getByText("Kelas Tinggi")).toBeInTheDocument()
  })
})
