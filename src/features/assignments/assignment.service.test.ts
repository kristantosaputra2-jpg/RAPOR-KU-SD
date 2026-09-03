import { describe, expect, it, vi } from "vitest"

import {
  AssignmentError,
  createTeacherAssignment,
  getTeacherAssignments,
  setTeacherAssignmentActive,
  updateTeacherAssignment,
  validateAssignmentInput,
} from "./assignment.service"

const assignment = {
  id: "assignment-1",
  teacher_id: "teacher-1",
  class_id: "class-1",
  subject_id: "subject-1",
  academic_year_id: "year-1",
  semester_id: "semester-1",
  is_active: true,
  created_at: "2026-09-03T00:00:00Z",
  updated_at: "2026-09-03T00:00:00Z",
}

const validInput = {
  teacherId: "teacher-1",
  classId: "class-1",
  subjectId: "subject-1",
  academicYearId: "year-1",
  semesterId: "semester-1",
}

function clientForList(error: unknown = null) {
  const order = vi.fn().mockResolvedValue({ data: [assignment], error })
  const select = vi.fn().mockReturnValue({ order })
  return { from: vi.fn().mockReturnValue({ select }) }
}

function clientForSave(data: unknown = assignment, error: unknown = null) {
  const single = vi.fn().mockResolvedValue({ data, error })
  const selected = { single }
  const eq = vi
    .fn()
    .mockReturnValue({ select: vi.fn().mockReturnValue(selected) })
  const chain = {
    insert: vi
      .fn()
      .mockReturnValue({ select: vi.fn().mockReturnValue(selected) }),
    update: vi.fn().mockReturnValue({ eq }),
  }
  return { client: { from: vi.fn().mockReturnValue(chain) }, chain }
}

describe("teacher assignment service", () => {
  it("requires every assignment scope", () => {
    expect(() =>
      validateAssignmentInput({ ...validInput, classId: "" }),
    ).toThrow("Pilih kelas.")
    expect(() =>
      validateAssignmentInput({ ...validInput, subjectId: "" }),
    ).toThrow("Pilih mata pelajaran.")
    expect(() =>
      validateAssignmentInput({ ...validInput, teacherId: "" }),
    ).toThrow("Pilih guru.")
  })

  it("loads assignments", async () => {
    await expect(
      getTeacherAssignments(clientForList() as never),
    ).resolves.toEqual([assignment])
  })

  it("returns a friendly load error", async () => {
    await expect(
      getTeacherAssignments(clientForList({ message: "offline" }) as never),
    ).rejects.toBeInstanceOf(AssignmentError)
  })

  it("creates an assignment with audit fields", async () => {
    const { client, chain } = clientForSave()
    await expect(
      createTeacherAssignment("admin-1", validInput, client as never),
    ).resolves.toEqual(assignment)
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        class_id: "class-1",
        subject_id: "subject-1",
        teacher_id: "teacher-1",
        created_by: "admin-1",
        updated_by: "admin-1",
      }),
    )
  })

  it("explains duplicate class and subject assignments", async () => {
    const { client } = clientForSave(null, { code: "23505" })
    await expect(
      createTeacherAssignment("admin-1", validInput, client as never),
    ).rejects.toThrow("sudah memiliki guru")
  })

  it("updates the teacher and status without changing assignment scope", async () => {
    const teacherSave = clientForSave()
    await updateTeacherAssignment(
      "admin-1",
      "assignment-1",
      "teacher-2",
      teacherSave.client as never,
    )
    expect(teacherSave.chain.update).toHaveBeenCalledWith({
      teacher_id: "teacher-2",
      updated_by: "admin-1",
    })

    const statusSave = clientForSave({ ...assignment, is_active: false })
    await setTeacherAssignmentActive(
      "admin-1",
      "assignment-1",
      false,
      statusSave.client as never,
    )
    expect(statusSave.chain.update).toHaveBeenCalledWith({
      is_active: false,
      updated_by: "admin-1",
    })
  })
})
