import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AdminDashboard } from "@/features/dashboard/admin-dashboard"

const academicPeriodMocks = vi.hoisted(() => ({
  getAcademicPeriods: vi.fn().mockResolvedValue({
    schoolId: "school-1",
    academicYears: [],
    semesters: [],
  }),
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

describe("AdminDashboard", () => {
  it("menampilkan ringkasan tanpa mengarang data sekolah", () => {
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={vi.fn()}
        onOpenSchoolSettings={vi.fn()}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={vi.fn()}
        onOpenClasses={vi.fn()}
        onOpenStudents={vi.fn()}
        onOpenSubjects={vi.fn()}
      />,
    )

    expect(
      screen.getByRole("heading", { name: "Ringkasan hari ini" }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText("SD Negeri Tumbang Kawei").length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText("Menunggu data")).toHaveLength(4)
    expect(
      screen.getByText("Pengaturan awal belum lengkap"),
    ).toBeInTheDocument()
  })

  it("membuka dan menutup menu pada tampilan mobile", async () => {
    const user = userEvent.setup()
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={vi.fn()}
        onOpenSchoolSettings={vi.fn()}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={vi.fn()}
        onOpenClasses={vi.fn()}
        onOpenStudents={vi.fn()}
        onOpenSubjects={vi.fn()}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Buka menu" }))
    expect(screen.getByLabelText("Menu Admin")).toBeInTheDocument()

    const closeButtons = screen.getAllByRole("button", { name: "Tutup menu" })
    await user.click(closeButtons.at(-1)!)
    expect(screen.queryByLabelText("Menu Admin")).not.toBeInTheDocument()
  })

  it("menampilkan pesan aman ketika logout gagal", async () => {
    const user = userEvent.setup()
    const onLogout = vi.fn().mockRejectedValue(new Error("network error"))
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={onLogout}
        onOpenSchoolSettings={vi.fn()}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={vi.fn()}
        onOpenClasses={vi.fn()}
        onOpenStudents={vi.fn()}
        onOpenSubjects={vi.fn()}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Keluar" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Belum dapat keluar. Periksa koneksi internet lalu coba lagi.",
    )
  })

  it("membuka pengaturan sekolah dari langkah pertama", async () => {
    const user = userEvent.setup()
    const onOpenSchoolSettings = vi.fn()
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={vi.fn()}
        onOpenSchoolSettings={onOpenSchoolSettings}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={vi.fn()}
        onOpenClasses={vi.fn()}
        onOpenStudents={vi.fn()}
        onOpenSubjects={vi.fn()}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Atur" }))

    expect(onOpenSchoolSettings).toHaveBeenCalledOnce()
  })

  it("membuka Data Guru dari navigasi", async () => {
    const user = userEvent.setup()
    const onOpenTeachers = vi.fn()
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={vi.fn()}
        onOpenSchoolSettings={vi.fn()}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={onOpenTeachers}
        onOpenClasses={vi.fn()}
        onOpenStudents={vi.fn()}
        onOpenSubjects={vi.fn()}
      />,
    )

    await user.click(screen.getAllByRole("button", { name: "Data Guru" })[0])

    expect(onOpenTeachers).toHaveBeenCalledOnce()
  })

  it("membuka Data Kelas dari navigasi", async () => {
    const user = userEvent.setup()
    const onOpenClasses = vi.fn()
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={vi.fn()}
        onOpenSchoolSettings={vi.fn()}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={vi.fn()}
        onOpenClasses={onOpenClasses}
        onOpenStudents={vi.fn()}
        onOpenSubjects={vi.fn()}
      />,
    )

    await user.click(screen.getAllByRole("button", { name: "Data Kelas" })[0])

    expect(onOpenClasses).toHaveBeenCalledOnce()
  })

  it("membuka Data Siswa dari navigasi", async () => {
    const user = userEvent.setup()
    const onOpenStudents = vi.fn()
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={vi.fn()}
        onOpenSchoolSettings={vi.fn()}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={vi.fn()}
        onOpenClasses={vi.fn()}
        onOpenStudents={onOpenStudents}
        onOpenSubjects={vi.fn()}
      />,
    )

    await user.click(screen.getAllByRole("button", { name: "Data Siswa" })[0])

    expect(onOpenStudents).toHaveBeenCalledOnce()
  })

  it("membuka Mata Pelajaran dari navigasi", async () => {
    const user = userEvent.setup()
    const onOpenSubjects = vi.fn()
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={vi.fn()}
        onOpenSchoolSettings={vi.fn()}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={vi.fn()}
        onOpenClasses={vi.fn()}
        onOpenStudents={vi.fn()}
        onOpenSubjects={onOpenSubjects}
      />,
    )

    await user.click(
      screen.getAllByRole("button", { name: "Mata Pelajaran" })[0],
    )

    expect(onOpenSubjects).toHaveBeenCalledOnce()
  })

  it("membuka Preview Rapor dari menu Laporan", async () => {
    const user = userEvent.setup()
    const onOpenReports = vi.fn()
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={vi.fn()}
        onOpenSchoolSettings={vi.fn()}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={vi.fn()}
        onOpenClasses={vi.fn()}
        onOpenStudents={vi.fn()}
        onOpenSubjects={vi.fn()}
        onOpenReports={onOpenReports}
      />,
    )

    await user.click(screen.getAllByRole("button", { name: "Laporan" })[0])

    expect(onOpenReports).toHaveBeenCalledOnce()
  })

  it("membuka Leger Kelas 1–3 dari navigasi", async () => {
    const user = userEvent.setup()
    const onOpenLeger = vi.fn()
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={vi.fn()}
        onOpenSchoolSettings={vi.fn()}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={vi.fn()}
        onOpenClasses={vi.fn()}
        onOpenStudents={vi.fn()}
        onOpenSubjects={vi.fn()}
        onOpenLeger={onOpenLeger}
      />,
    )

    await user.click(
      screen.getAllByRole("button", { name: "Leger Kelas 1–3" })[0],
    )

    expect(onOpenLeger).toHaveBeenCalledOnce()
  })
})
