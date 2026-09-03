import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { LearningOutcomePage } from "./learning-outcome-page"

const mocks = vi.hoisted(() => ({
  getLearningOutcomes: vi.fn(),
  getSubjects: vi.fn(),
  getAcademicPeriods: vi.fn(),
}))

vi.mock("@/features/learning-outcomes/learning-outcome.service", () => ({
  getLearningOutcomes: mocks.getLearningOutcomes,
  createLearningOutcome: vi.fn(),
  updateLearningOutcome: vi.fn(),
  setLearningOutcomeActive: vi.fn(),
}))
vi.mock("@/features/subjects/subject.service", () => ({
  getSubjects: mocks.getSubjects,
}))
vi.mock("@/features/academic-periods/academic-periods.service", () => ({
  getAcademicPeriods: mocks.getAcademicPeriods,
}))

describe("LearningOutcomePage", () => {
  beforeEach(() => {
    mocks.getLearningOutcomes.mockResolvedValue([])
    mocks.getSubjects.mockResolvedValue([])
    mocks.getAcademicPeriods.mockResolvedValue({
      schoolId: "school-1",
      academicYears: [],
      semesters: [],
    })
  })

  it("shows the empty state and protects unresolved grading rules", async () => {
    render(
      <LearningOutcomePage
        userId="admin-1"
        userName="Admin"
        onBack={vi.fn()}
        onLogout={vi.fn()}
      />,
    )
    expect(
      await screen.findByRole("heading", { name: "Belum ada CP" }),
    ).toBeVisible()
    expect(screen.getByText(/tidak mengarang rumus nilai/i)).toBeVisible()
    expect(screen.getByRole("button", { name: "Tambah CP" })).toBeDisabled()
  })
})
