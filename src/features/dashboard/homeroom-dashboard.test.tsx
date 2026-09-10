import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { HomeroomDashboard } from "./homeroom-dashboard"

const dashboardMocks = vi.hoisted(() => ({
  getHomeroomDashboardData: vi.fn(),
}))

vi.mock("./homeroom-dashboard.service", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("./homeroom-dashboard.service")>()
  return { ...original, ...dashboardMocks }
})

const props = {
  userId: "user-1",
  userName: "Rina Wulandari",
  schoolName: "SD Negeri Tumbang Kawei",
  onLogout: vi.fn(),
  onOpenStudents: vi.fn(),
  onOpenAttendance: vi.fn(),
  onOpenExtracurriculars: vi.fn(),
  onOpenAchievements: vi.fn(),
  onOpenHomeroomNotes: vi.fn(),
  onOpenReportCompleteness: vi.fn(),
  onOpenLeger: vi.fn(),
  onOpenReports: vi.fn(),
}

describe("HomeroomDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dashboardMocks.getHomeroomDashboardData.mockResolvedValue({
      academicYear: "2026/2027",
      semester: 1,
      classes: [
        { id: "class-1", name: "Kelas 4A", gradeLevel: 4, studentCount: 3 },
      ],
      studentCount: 3,
    })
  })

  it("menampilkan kelas, siswa, dan pekerjaan wali kelas", async () => {
    render(<HomeroomDashboard {...props} />)

    expect(
      await screen.findByText("Selamat datang, Rina Wulandari"),
    ).toBeInTheDocument()
    expect(screen.getByText("Kelas 4A")).toBeInTheDocument()
    expect(screen.getByText("2026/2027, Semester 1")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(
      screen.getAllByRole("button", { name: /Pantau Kelengkapan/ }).length,
    ).toBeGreaterThan(0)
  })

  it("membuka pekerjaan dari kartu utama", async () => {
    const user = userEvent.setup()
    render(<HomeroomDashboard {...props} />)

    await screen.findByText("Kelas 4A")
    await user.click(
      screen.getAllByRole("button", { name: /Catatan Wali Kelas/ }).at(-1)!,
    )

    expect(props.onOpenHomeroomNotes).toHaveBeenCalledOnce()
  })

  it("menampilkan empty state ketika wali kelas belum ditugaskan", async () => {
    dashboardMocks.getHomeroomDashboardData.mockResolvedValue({
      academicYear: "2026/2027",
      semester: 1,
      classes: [],
      studentCount: 0,
    })

    render(<HomeroomDashboard {...props} />)

    expect(
      await screen.findByRole("heading", { name: "Kelas belum ditugaskan" }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Hubungi Admin/)).toBeInTheDocument()
  })

  it("menampilkan pesan aman ketika data gagal dimuat", async () => {
    dashboardMocks.getHomeroomDashboardData.mockRejectedValue(
      new Error(
        "Dashboard belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
      ),
    )

    render(<HomeroomDashboard {...props} />)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Dashboard belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  })
})
