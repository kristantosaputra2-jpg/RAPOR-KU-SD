import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SubjectTeacherDashboard } from "./subject-teacher-dashboard"

const dashboardMocks = vi.hoisted(() => ({
  getSubjectTeacherDashboardData: vi.fn(),
}))

vi.mock("./subject-teacher-dashboard.service", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("./subject-teacher-dashboard.service")>()
  return { ...original, ...dashboardMocks }
})

const props = {
  userId: "user-1",
  userName: "Budi Santoso",
  schoolName: "SD Negeri Tumbang Kawei",
  onLogout: vi.fn(),
  onOpenGrades: vi.fn(),
  onOpenLearningOutcomes: vi.fn(),
}

describe("SubjectTeacherDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dashboardMocks.getSubjectTeacherDashboardData.mockResolvedValue({
      academicYear: "2026/2027",
      semester: 1,
      assignments: [
        {
          id: "assignment-1",
          classId: "class-1",
          className: "Kelas 4A",
          gradeLevel: 4,
          subjectId: "subject-1",
          subjectName: "Matematika",
        },
      ],
      classCount: 1,
      subjectCount: 1,
    })
  })

  it("menampilkan periode dan penugasan milik guru", async () => {
    render(<SubjectTeacherDashboard {...props} />)

    expect(
      await screen.findByText("Selamat datang, Budi Santoso"),
    ).toBeInTheDocument()
    expect(screen.getByText("Matematika")).toBeInTheDocument()
    expect(screen.getByText("Kelas 4A")).toBeInTheDocument()
    expect(screen.getByText("2026/2027, Semester 1")).toBeInTheDocument()
  })

  it("membuka Input Nilai dari kartu utama", async () => {
    const user = userEvent.setup()
    render(<SubjectTeacherDashboard {...props} />)

    await screen.findByText("Matematika")
    await user.click(
      screen.getAllByRole("button", { name: /Input Nilai/ }).at(-1)!,
    )

    expect(props.onOpenGrades).toHaveBeenCalledOnce()
  })

  it("menampilkan empty state ketika belum memiliki penugasan", async () => {
    dashboardMocks.getSubjectTeacherDashboardData.mockResolvedValue({
      academicYear: "2026/2027",
      semester: 1,
      assignments: [],
      classCount: 0,
      subjectCount: 0,
    })

    render(<SubjectTeacherDashboard {...props} />)

    expect(
      await screen.findByRole("heading", {
        name: "Penugasan belum tersedia",
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Hubungi Admin/)).toBeInTheDocument()
  })

  it("menampilkan pesan aman ketika data gagal dimuat", async () => {
    dashboardMocks.getSubjectTeacherDashboardData.mockRejectedValue(
      new Error(
        "Dashboard belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
      ),
    )

    render(<SubjectTeacherDashboard {...props} />)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Dashboard belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  })
})
