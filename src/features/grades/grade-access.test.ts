import { describe, expect, it } from "vitest"

import { getGradeClassOptions, getGradeSubjectOptions } from "./grade-access"

const classes = [
  { id: "class-1", homeroom_teacher_id: "teacher-1" },
  { id: "class-2", homeroom_teacher_id: "teacher-2" },
]

const subjects = [
  { id: "math", is_active: true },
  { id: "science", is_active: true },
  { id: "inactive", is_active: false },
]

const assignments = [
  {
    class_id: "class-1",
    subject_id: "math",
    is_active: true,
  },
  {
    class_id: "class-2",
    subject_id: "science",
    is_active: false,
  },
]

describe("grade access options", () => {
  it("allows a homeroom teacher to use every visible class and active subject", () => {
    expect(
      getGradeClassOptions("homeroom_teacher", classes, assignments).map(
        (item) => item.id,
      ),
    ).toEqual(["class-1", "class-2"])
    expect(
      getGradeSubjectOptions(
        "homeroom_teacher",
        "class-1",
        "teacher-1",
        "teacher-1",
        subjects,
        assignments,
      ).map((item) => item.id),
    ).toEqual(["math", "science"])
  })

  it("limits a dual-duty homeroom teacher to assignments outside their own class", () => {
    expect(
      getGradeSubjectOptions(
        "homeroom_teacher",
        "class-2",
        "teacher-2",
        "teacher-1",
        subjects,
        [
          {
            class_id: "class-2",
            subject_id: "science",
            is_active: true,
          },
        ],
      ).map((item) => item.id),
    ).toEqual(["science"])
  })

  it("limits a subject teacher to active assignments", () => {
    expect(
      getGradeClassOptions("subject_teacher", classes, assignments).map(
        (item) => item.id,
      ),
    ).toEqual(["class-1"])
    expect(
      getGradeSubjectOptions(
        "subject_teacher",
        "class-1",
        "teacher-1",
        "teacher-1",
        subjects,
        assignments,
      ).map((item) => item.id),
    ).toEqual(["math"])
    expect(
      getGradeSubjectOptions(
        "subject_teacher",
        "class-2",
        "teacher-2",
        "teacher-1",
        subjects,
        assignments,
      ),
    ).toEqual([])
  })

  it("allows Admin to use every class and active subject", () => {
    expect(getGradeClassOptions("admin", classes, assignments)).toHaveLength(2)
    expect(
      getGradeSubjectOptions(
        "admin",
        "class-1",
        "teacher-1",
        null,
        subjects,
        assignments,
      ).map((item) => item.id),
    ).toEqual(["math", "science"])
  })
})
