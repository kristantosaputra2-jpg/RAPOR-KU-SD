import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { StudentPage } from "@/features/students/student-page"

const studentMocks = vi.hoisted(() => ({
  getStudents: vi.fn(),
  getClassMemberships: vi.fn(),
  createStudent: vi.fn(),
  updateStudent: vi.fn(),
  setStudentActive: vi.fn(),
  assignStudentToClass: vi.fn(),
  removeStudentFromClass: vi.fn(),
}))
const classMocks = vi.hoisted(() => ({ getClasses: vi.fn() }))
const periodMocks = vi.hoisted(() => ({ getAcademicPeriods: vi.fn() }))

vi.mock("@/features/students/student.service", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/features/students/student.service")>()
  return { ...original, ...studentMocks }
})
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
    return { ...original, ...periodMocks }
  },
)

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

const schoolClass = {
  id: "class-1",
  academic_year_id: "year-1",
  semester_id: "semester-1",
  grade_level: 4,
  name: "4A",
  homeroom_teacher_id: null,
  template_group: "upper_primary" as const,
  created_at: "2026-09-02T00:00:00.000Z",
  updated_at: "2026-09-02T00:00:00.000Z",
}

const student = {
  id: "student-1",
  full_name: "Budi Santoso",
  nis: "001",
  nisn: null,
  gender: "male" as const,
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
}

function renderPage(
  onOpenAcademicPeriods = vi.fn(),
  userRole: "admin" | "homeroom_teacher" = "admin",
) {
  return render(
    <StudentPage
      userId="admin-1"
      userName="Admin Sekolah"
      userRole={userRole}
      schoolName="SD Negeri Tumbang Kawei"
      onBack={vi.fn()}
      onLogout={vi.fn()}
      onOpenAcademicPeriods={onOpenAcademicPeriods}
      onOpenImport={vi.fn()}
    />,
  )
}

describe("StudentPage", () => {
  beforeEach(() => {
    Object.values(studentMocks).forEach((mock) => mock.mockReset())
    classMocks.getClasses.mockReset()
    periodMocks.getAcademicPeriods.mockReset()
    studentMocks.getStudents.mockResolvedValue([])
    studentMocks.getClassMemberships.mockResolvedValue([])
    classMocks.getClasses.mockResolvedValue([schoolClass])
    periodMocks.getAcademicPeriods.mockResolvedValue(periods)
  })

  it("menampilkan empty state siswa", async () => {
    renderPage()

    expect(await screen.findByText("Belum ada data siswa")).toBeInTheDocument()
    expect(screen.getByLabelText("Cari siswa")).toBeVisible()
    expect(screen.getByLabelText("Filter kelas")).toBeVisible()
  })

  it("menampilkan seluruh field identitas rapor pada formulir", async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(
      (await screen.findAllByRole("button", { name: "Tambah Siswa" }))[0],
    )

    expect(screen.getByLabelText(/Nama Lengkap/)).toBeVisible()
    expect(screen.getByLabelText(/^NIS \*/)).toBeVisible()
    expect(screen.getByLabelText(/NISN/)).toBeVisible()
    expect(screen.getByLabelText(/Jenis Kelamin/)).toBeVisible()
    expect(screen.getByLabelText("Nama Ayah")).toBeVisible()
    expect(screen.getByLabelText("Nama Ibu")).toBeVisible()
    expect(screen.getByLabelText(/Nama Wali/)).toBeVisible()
  })

  it("menambah siswa dan menempatkannya ke kelas aktif", async () => {
    const user = userEvent.setup()
    const membership = {
      id: "member-1",
      student_id: student.id,
      class_id: schoolClass.id,
      semester_id: "semester-1",
      created_at: "2026-09-02T00:00:00.000Z",
      updated_at: "2026-09-02T00:00:00.000Z",
    }
    studentMocks.createStudent.mockResolvedValue(student)
    studentMocks.assignStudentToClass.mockResolvedValue(membership)
    renderPage()

    await user.click(
      (await screen.findAllByRole("button", { name: "Tambah Siswa" }))[0],
    )
    await user.type(screen.getByLabelText(/Nama Lengkap/), "Budi Santoso")
    await user.type(screen.getByLabelText(/^NIS \*/), "001")
    await user.selectOptions(
      screen.getByLabelText("Kelas Semester Aktif"),
      "class-1",
    )
    await user.click(screen.getByRole("button", { name: "Simpan Siswa" }))

    await waitFor(() => {
      expect(studentMocks.createStudent).toHaveBeenCalledWith(
        "admin-1",
        expect.objectContaining({ fullName: "Budi Santoso", nis: "001" }),
      )
      expect(studentMocks.assignStudentToClass).toHaveBeenCalledWith(
        "admin-1",
        "student-1",
        "class-1",
        "semester-1",
        undefined,
      )
    })
    expect(await screen.findByText("Siswa berhasil ditambahkan.")).toBeVisible()
  })

  it("menampilkan kelas siswa pada semester aktif", async () => {
    studentMocks.getStudents.mockResolvedValue([student])
    studentMocks.getClassMemberships.mockResolvedValue([
      {
        id: "member-1",
        student_id: student.id,
        class_id: schoolClass.id,
        semester_id: "semester-1",
        created_at: "2026-09-02T00:00:00.000Z",
        updated_at: "2026-09-02T00:00:00.000Z",
      },
    ])
    renderPage()

    expect(await screen.findByText("Budi Santoso")).toBeVisible()
    expect(screen.getAllByText("4A").length).toBeGreaterThan(0)
    expect(screen.getByText("Belum ada")).toBeVisible()
  })

  it("membatasi Wali Kelas pada pengisian biodata siswa", async () => {
    studentMocks.getStudents.mockResolvedValue([student])
    renderPage(vi.fn(), "homeroom_teacher")

    expect(await screen.findByText("Budi Santoso")).toBeVisible()
    expect(screen.getByRole("button", { name: "Biodata" })).toBeVisible()
    expect(
      screen.queryByRole("button", { name: "Tambah Siswa" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Nonaktifkan Budi/ }),
    ).not.toBeInTheDocument()
  })
})
