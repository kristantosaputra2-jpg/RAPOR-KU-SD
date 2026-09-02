import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AcademicPeriodsPage } from "@/features/academic-periods/academic-periods-page"

const academicPeriodMocks = vi.hoisted(() => ({
  getAcademicPeriods: vi.fn(),
  createAcademicYear: vi.fn(),
  activateAcademicYear: vi.fn(),
  createSemester: vi.fn(),
  activateSemester: vi.fn(),
}))

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

const year = {
  id: "year-1",
  school_id: "school-1",
  name: "2026/2027",
  is_active: true,
  created_at: "2026-09-02T00:00:00Z",
  updated_at: "2026-09-02T00:00:00Z",
}

const semester = {
  id: "semester-1",
  academic_year_id: "year-1",
  number: 1,
  is_active: true,
  created_at: "2026-09-02T00:00:00Z",
  updated_at: "2026-09-02T00:00:00Z",
}

const emptyPeriods = {
  schoolId: "school-1",
  academicYears: [],
  semesters: [],
}

function renderPage() {
  return render(
    <AcademicPeriodsPage
      userId="admin-1"
      userName="Admin Sekolah"
      schoolName="SD Negeri Tumbang Kawei"
      onBack={vi.fn()}
      onLogout={vi.fn().mockResolvedValue(undefined)}
    />,
  )
}

describe("AcademicPeriodsPage", () => {
  beforeEach(() => {
    Object.values(academicPeriodMocks).forEach((mock) => mock.mockReset())
    academicPeriodMocks.getAcademicPeriods.mockResolvedValue(emptyPeriods)
    academicPeriodMocks.activateAcademicYear.mockResolvedValue(undefined)
    academicPeriodMocks.activateSemester.mockResolvedValue(undefined)
  })

  it("menampilkan empty state tahun ajaran tanpa data rekaan", async () => {
    renderPage()

    expect(
      await screen.findByRole("heading", { name: "Tahun Ajaran & Semester" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Belum ada tahun ajaran")).toBeInTheDocument()
    expect(screen.getByText("Belum dipilih")).toBeInTheDocument()
  })

  it("menampilkan tahun ajaran dan semester aktif", async () => {
    academicPeriodMocks.getAcademicPeriods.mockResolvedValue({
      schoolId: "school-1",
      academicYears: [year],
      semesters: [semester],
    })
    renderPage()

    expect((await screen.findAllByText("2026/2027")).length).toBeGreaterThan(0)
    expect(screen.getAllByText("Semester 1").length).toBeGreaterThan(0)
    expect(screen.getByText("Sedang aktif")).toBeInTheDocument()
  })

  it("menambahkan tahun ajaran lalu memberi arahan aktivasi", async () => {
    const user = userEvent.setup()
    academicPeriodMocks.createAcademicYear.mockResolvedValue({
      ...year,
      is_active: false,
    })
    academicPeriodMocks.getAcademicPeriods
      .mockResolvedValueOnce(emptyPeriods)
      .mockResolvedValueOnce({
        schoolId: "school-1",
        academicYears: [{ ...year, is_active: false }],
        semesters: [],
      })
    renderPage()

    await user.type(
      await screen.findByLabelText("Nama tahun ajaran"),
      "2026/2027",
    )
    await user.click(screen.getByRole("button", { name: "Tambah" }))

    await waitFor(() => {
      expect(academicPeriodMocks.createAcademicYear).toHaveBeenCalledWith(
        "admin-1",
        "school-1",
        "2026/2027",
      )
    })
    expect(
      await screen.findByText(/ditambahkan. Aktifkan saat siap digunakan/),
    ).toBeInTheDocument()
  })

  it("menambahkan Semester 1 pada tahun ajaran terpilih", async () => {
    const user = userEvent.setup()
    academicPeriodMocks.getAcademicPeriods.mockResolvedValue({
      schoolId: "school-1",
      academicYears: [year],
      semesters: [],
    })
    academicPeriodMocks.createSemester.mockResolvedValue({
      ...semester,
      is_active: false,
    })
    renderPage()

    await user.click(
      await screen.findByRole("button", { name: "Tambahkan Semester 1" }),
    )

    await waitFor(() => {
      expect(academicPeriodMocks.createSemester).toHaveBeenCalledWith(
        "admin-1",
        "year-1",
        1,
      )
    })
  })

  it("menampilkan pesan aman ketika tahun ajaran gagal disimpan", async () => {
    const user = userEvent.setup()
    academicPeriodMocks.createAcademicYear.mockRejectedValue(
      new Error(
        "Tahun ajaran belum dapat disimpan. Periksa koneksi internet lalu coba lagi.",
      ),
    )
    renderPage()

    await user.type(
      await screen.findByLabelText("Nama tahun ajaran"),
      "2026/2027",
    )
    await user.click(screen.getByRole("button", { name: "Tambah" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Tahun ajaran belum dapat disimpan. Periksa koneksi internet lalu coba lagi.",
    )
  })
})
