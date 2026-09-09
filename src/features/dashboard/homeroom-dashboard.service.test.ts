import { describe, expect, it } from "vitest"

import { buildHomeroomClassSummaries } from "./homeroom-dashboard.service"

describe("buildHomeroomClassSummaries", () => {
  it("menghitung hanya siswa aktif pada kelas wali yang sesuai", () => {
    const result = buildHomeroomClassSummaries(
      [
        { id: "class-1", name: "Kelas 4A", grade_level: 4 },
        { id: "class-2", name: "Kelas 5A", grade_level: 5 },
      ],
      [
        { class_id: "class-1", student_id: "student-1" },
        { class_id: "class-1", student_id: "student-inactive" },
        { class_id: "class-2", student_id: "student-2" },
      ],
      new Set(["student-1", "student-2"]),
    )

    expect(result).toEqual([
      { id: "class-1", name: "Kelas 4A", gradeLevel: 4, studentCount: 1 },
      { id: "class-2", name: "Kelas 5A", gradeLevel: 5, studentCount: 1 },
    ])
  })
})
