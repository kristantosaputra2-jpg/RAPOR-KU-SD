import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { StudentImportPage } from "@/features/students/student-import-page"

const studentMocks = vi.hoisted(() => ({ getStudents: vi.fn() }))
const classMocks = vi.hoisted(() => ({ getClasses: vi.fn() }))
const periodMocks = vi.hoisted(() => ({ getAcademicPeriods: vi.fn() }))
const parserMocks = vi.hoisted(() => ({ parseStudentWorkbook: vi.fn() }))
const importMocks = vi.hoisted(() => ({ importStudentsToClass: vi.fn() }))

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
vi.mock("@/features/students/student-import.parser", () => parserMocks)
vi.mock("@/features/students/student-import.service", () => importMocks)

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

describe("StudentImportPage", () => {
  beforeEach(() => {
    studentMocks.getStudents.mockReset().mockResolvedValue([])
    classMocks.getClasses.mockReset().mockResolvedValue([schoolClass])
    periodMocks.getAcademicPeriods.mockReset().mockResolvedValue({
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
    })
    parserMocks.parseStudentWorkbook.mockReset().mockResolvedValue({
      fileName: "siswa-4a.xlsx",
      headers: ["Nama Siswa", "NIS", "NISN", "JK", "Tanggal Lahir"],
      rows: [["Budi Santoso", "001", "0012345678", "L", "12/04/2016"]],
    })
    importMocks.importStudentsToClass.mockReset().mockResolvedValue(1)
  })

  it("mewajibkan preview dan konfirmasi sebelum menyimpan satu batch", async () => {
    const user = userEvent.setup()
    render(
      <StudentImportPage
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onBack={vi.fn()}
        onLogout={vi.fn()}
      />,
    )

    await screen.findByRole("option", { name: "4A" })
    await user.selectOptions(
      screen.getByLabelText("Kelas Semester Aktif"),
      "class-1",
    )
    await user.upload(
      screen.getByLabelText("Pilih file Excel siswa"),
      new File(["xlsx"], "siswa-4a.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    )

    expect(await screen.findByText("1 baris ditemukan")).toBeVisible()
    expect(screen.getByLabelText("Kolom untuk Nama Lengkap")).toHaveValue("0")
    await user.click(
      screen.getByRole("button", { name: "Periksa dan Preview Data" }),
    )

    expect(await screen.findByText("Siap diimport")).toBeVisible()
    expect(importMocks.importStudentsToClass).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Import 1 Siswa" }))
    expect(
      screen.getByRole("dialog", { name: "Import siswa sekarang?" }),
    ).toBeVisible()
    expect(importMocks.importStudentsToClass).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Ya, Import" }))
    await waitFor(() => {
      expect(importMocks.importStudentsToClass).toHaveBeenCalledWith(
        "class-1",
        "semester-1",
        [expect.objectContaining({ full_name: "Budi Santoso", nis: "001" })],
      )
    })
    expect(await screen.findByText("Import selesai")).toBeVisible()
  })
})
