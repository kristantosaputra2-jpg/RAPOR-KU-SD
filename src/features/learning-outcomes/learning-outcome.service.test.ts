import { describe, expect, it, vi } from "vitest"

import {
  createLearningOutcome,
  getLearningOutcomes,
  LearningOutcomeError,
  normalizeLearningOutcomeInput,
  setLearningOutcomeActive,
  updateLearningOutcome,
} from "./learning-outcome.service"

const input = {
  subjectId: "subject-1",
  gradeLevel: 4,
  semesterId: "semester-1",
  code: " CP-1 ",
  title: " Mengenal bilangan ",
  description: " Memahami bilangan sampai seribu. ",
}
const outcome = {
  id: "outcome-1",
  subject_id: "subject-1",
  grade_level: 4,
  semester_id: "semester-1",
  code: "CP-1",
  title: "Mengenal bilangan",
  description: "Memahami bilangan sampai seribu.",
  is_active: true,
  created_at: "2026-09-03T00:00:00Z",
  updated_at: "2026-09-03T00:00:00Z",
}

function listClient(error: unknown = null) {
  const order = vi.fn().mockResolvedValue({ data: [outcome], error })
  const select = vi.fn().mockReturnValue({ order })
  return { from: vi.fn().mockReturnValue({ select }) }
}

function saveClient(data: unknown = outcome, error: unknown = null) {
  const single = vi.fn().mockResolvedValue({ data, error })
  const select = vi.fn().mockReturnValue({ single })
  const eq = vi.fn().mockReturnValue({ select })
  const chain = {
    insert: vi.fn().mockReturnValue({ select }),
    update: vi.fn().mockReturnValue({ eq }),
  }
  return { client: { from: vi.fn().mockReturnValue(chain) }, chain }
}

describe("learning outcome service", () => {
  it("normalizes the generic CP fields", () => {
    expect(normalizeLearningOutcomeInput(input)).toEqual({
      subject_id: "subject-1",
      grade_level: 4,
      semester_id: "semester-1",
      code: "CP-1",
      title: "Mengenal bilangan",
      description: "Memahami bilangan sampai seribu.",
    })
  })

  it("validates scope and content", () => {
    expect(() =>
      normalizeLearningOutcomeInput({ ...input, subjectId: "" }),
    ).toThrow("Pilih mata pelajaran")
    expect(() =>
      normalizeLearningOutcomeInput({ ...input, gradeLevel: 7 }),
    ).toThrow("kelas 1 sampai 6")
    expect(() =>
      normalizeLearningOutcomeInput({ ...input, semesterId: "" }),
    ).toThrow("Pilih semester")
    expect(() =>
      normalizeLearningOutcomeInput({ ...input, description: "" }),
    ).toThrow("Deskripsi CP wajib")
  })

  it("loads CP", async () => {
    await expect(getLearningOutcomes(listClient() as never)).resolves.toEqual([
      outcome,
    ])
  })

  it("returns a friendly load error", async () => {
    await expect(
      getLearningOutcomes(listClient({ message: "offline" }) as never),
    ).rejects.toBeInstanceOf(LearningOutcomeError)
  })

  it("creates CP with audit fields", async () => {
    const { client, chain } = saveClient()
    await createLearningOutcome("admin-1", input, client as never)
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        created_by: "admin-1",
        updated_by: "admin-1",
        subject_id: "subject-1",
      }),
    )
  })

  it("keeps scope unchanged when editing content", async () => {
    const { client, chain } = saveClient()
    await updateLearningOutcome("admin-1", "outcome-1", input, client as never)
    expect(chain.update).toHaveBeenCalledWith({
      code: "CP-1",
      title: "Mengenal bilangan",
      description: "Memahami bilangan sampai seribu.",
      updated_by: "admin-1",
    })
  })

  it("changes status without deleting CP", async () => {
    const { client, chain } = saveClient({ ...outcome, is_active: false })
    await setLearningOutcomeActive(
      "admin-1",
      "outcome-1",
      false,
      client as never,
    )
    expect(chain.update).toHaveBeenCalledWith({
      is_active: false,
      updated_by: "admin-1",
    })
  })
})
