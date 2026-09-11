import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ReportSettingsPage } from "./report-settings-page"

const mocks = vi.hoisted(() => ({
  getAcademicPeriods: vi.fn(),
  getActiveAcademicPeriod: vi.fn(),
  getSubjects: vi.fn(),
  getReportGradingSettings: vi.fn(),
  saveReportGradingSettings: vi.fn(),
}))

vi.mock("@/features/academic-periods/academic-periods.service", () => ({
  getAcademicPeriods: mocks.getAcademicPeriods,
  getActiveAcademicPeriod: mocks.getActiveAcademicPeriod,
}))

vi.mock("@/features/subjects/subject.service", () => ({
  getSubjects: mocks.getSubjects,
}))

vi.mock("@/features/grades/grading-settings.service", () => ({
  getReportGradingSettings: mocks.getReportGradingSettings,
  saveReportGradingSettings: mocks.saveReportGradingSettings,
}))

const activePeriod = {
  academicYear: { id: "year-1", name: "2026/2027" },
  semester: { id: "semester-1", number: 1 },
}

const subjects = [
  {
    id: "subject-1",
    name: "Matematika",
    code: "MAT",
    is_active: true,
  },
  {
    id: "subject-2",
    name: "Bahasa Indonesia",
    code: "BIN",
    is_active: true,
  },
]

function renderPage() {
  return render(
    <ReportSettingsPage
      onBack={vi.fn()}
      onLogout={vi.fn()}
      onOpenAcademicPeriods={vi.fn()}
      schoolName="SD Negeri Tumbang Kawei"
      userId="admin-1"
      userName="Admin Sekolah"
    />,
  )
}

describe("ReportSettingsPage", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset())
    mocks.getAcademicPeriods.mockResolvedValue({})
    mocks.getActiveAcademicPeriod.mockReturnValue(activePeriod)
    mocks.getSubjects.mockResolvedValue(subjects)
    mocks.getReportGradingSettings.mockResolvedValue({
      setting: {
        id: "setting-1",
        semester_id: "semester-1",
        kkm_mode: "single",
        single_kkm: 70,
      },
      subjectRules: [],
    })
    mocks.saveReportGradingSettings.mockResolvedValue(undefined)
  })

  it("menampilkan KKM semester aktif, predikat, dan format A4", async () => {
    renderPage()

    expect(await screen.findByDisplayValue("70")).toBeVisible()
    expect(screen.getByText("2026/2027 · Semester 1")).toBeVisible()
    expect(screen.getByText("A4 Portrait")).toBeVisible()
    expect(screen.getByText("A4 Landscape")).toBeVisible()
    expect(screen.getByLabelText("Rentang predikat")).toBeVisible()
  })

  it("menyimpan Multi KKM untuk seluruh mata pelajaran aktif", async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByDisplayValue("70")
    await user.click(screen.getByRole("button", { name: /Multi KKM/ }))
    await user.type(screen.getByLabelText("KKM Matematika"), "70")
    await user.type(screen.getByLabelText("KKM Bahasa Indonesia"), "75")
    await user.click(screen.getByRole("button", { name: "Simpan Pengaturan" }))

    await waitFor(() => {
      expect(mocks.saveReportGradingSettings).toHaveBeenCalledWith("admin-1", {
        semesterId: "semester-1",
        mode: "multi",
        singleKkm: 70,
        subjectKkms: [
          { subjectId: "subject-1", minimumMasteryScore: 70 },
          { subjectId: "subject-2", minimumMasteryScore: 75 },
        ],
      })
    })
    expect(
      await screen.findByText("Pengaturan rapor berhasil disimpan."),
    ).toBeVisible()
  })

  it("mengarahkan Admin memilih semester jika belum ada periode aktif", async () => {
    mocks.getActiveAcademicPeriod.mockReturnValue({
      academicYear: null,
      semester: null,
    })
    const onOpenAcademicPeriods = vi.fn()
    const user = userEvent.setup()

    render(
      <ReportSettingsPage
        onBack={vi.fn()}
        onLogout={vi.fn()}
        onOpenAcademicPeriods={onOpenAcademicPeriods}
        userId="admin-1"
        userName="Admin Sekolah"
      />,
    )

    await user.click(
      await screen.findByRole("button", { name: "Atur Tahun & Semester" }),
    )
    expect(onOpenAcademicPeriods).toHaveBeenCalledOnce()
  })
})
