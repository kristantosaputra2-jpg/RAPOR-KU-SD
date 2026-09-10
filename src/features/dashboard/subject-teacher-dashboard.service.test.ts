import { describe, expect, it } from "vitest"

import { buildSubjectTeacherAssignmentSummaries } from "./subject-teacher-dashboard.service"

describe("buildSubjectTeacherAssignmentSummaries", () => {
  it("menggabungkan dan mengurutkan hanya penugasan yang memiliki referensi lengkap", () => {
    const result = buildSubjectTeacherAssignmentSummaries(
      [
        { id: "assignment-2", class_id: "class-2", subject_id: "subject-1" },
        { id: "assignment-1", class_id: "class-1", subject_id: "subject-2" },
        { id: "invalid", class_id: "missing", subject_id: "subject-1" },
      ],
      [
        { id: "class-2", name: "Kelas 5A", grade_level: 5 },
        { id: "class-1", name: "Kelas 2A", grade_level: 2 },
      ],
      [
        { id: "subject-1", name: "Matematika" },
        { id: "subject-2", name: "Bahasa Indonesia" },
      ],
    )

    expect(result).toEqual([
      {
        id: "assignment-1",
        classId: "class-1",
        className: "Kelas 2A",
        gradeLevel: 2,
        subjectId: "subject-2",
        subjectName: "Bahasa Indonesia",
      },
      {
        id: "assignment-2",
        classId: "class-2",
        className: "Kelas 5A",
        gradeLevel: 5,
        subjectId: "subject-1",
        subjectName: "Matematika",
      },
    ])
  })
})
