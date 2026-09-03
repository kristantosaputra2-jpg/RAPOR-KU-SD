import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AssignmentPage } from "./assignment-page"

const {
  getTeacherAssignments,
  getClasses,
  getSubjects,
  getTeachers,
  getAcademicPeriods,
} = vi.hoisted(() => ({
  getTeacherAssignments: vi.fn(),
  getClasses: vi.fn(),
  getSubjects: vi.fn(),
  getTeachers: vi.fn(),
  getAcademicPeriods: vi.fn(),
}))

vi.mock("@/features/assignments/assignment.service", () => ({
  getTeacherAssignments: (...args: unknown[]) => getTeacherAssignments(...args),
  createTeacherAssignment: vi.fn(),
  updateTeacherAssignment: vi.fn(),
  setTeacherAssignmentActive: vi.fn(),
}))
vi.mock("@/features/classes/class.service", () => ({
  getClasses: (...args: unknown[]) => getClasses(...args),
}))
vi.mock("@/features/subjects/subject.service", () => ({
  getSubjects: (...args: unknown[]) => getSubjects(...args),
}))
vi.mock("@/features/teachers/teacher.service", () => ({
  getTeachers: (...args: unknown[]) => getTeachers(...args),
}))
vi.mock("@/features/academic-periods/academic-periods.service", () => ({
  getAcademicPeriods: (...args: unknown[]) => getAcademicPeriods(...args),
}))

describe("AssignmentPage", () => {
  beforeEach(() => {
    getTeacherAssignments.mockResolvedValue([])
    getClasses.mockResolvedValue([])
    getSubjects.mockResolvedValue([])
    getTeachers.mockResolvedValue([])
    getAcademicPeriods.mockResolvedValue({
      schoolId: "school-1",
      academicYears: [],
      semesters: [],
    })
  })

  it("shows an understandable empty state and prerequisite guidance", async () => {
    render(
      <AssignmentPage
        userId="admin-1"
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onBack={vi.fn()}
        onLogout={vi.fn()}
      />,
    )
    expect(
      await screen.findByRole("heading", { name: "Belum ada penugasan" }),
    ).toBeVisible()
    expect(screen.getByText(/Siapkan minimal satu kelas/)).toBeVisible()
    expect(
      screen.getByRole("button", { name: "Tambah Penugasan" }),
    ).toBeDisabled()
  })

  it("returns to the dashboard", async () => {
    const onBack = vi.fn()
    const user = userEvent.setup()
    render(
      <AssignmentPage
        userId="admin-1"
        userName="Admin Sekolah"
        onBack={onBack}
        onLogout={vi.fn()}
      />,
    )
    await screen.findByRole("heading", { name: "Belum ada penugasan" })
    await user.click(screen.getByRole("button", { name: "Dashboard" }))
    expect(onBack).toHaveBeenCalledOnce()
  })
})
