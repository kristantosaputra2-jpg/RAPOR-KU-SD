import { describe, expect, it, vi } from "vitest"

import {
  AttendanceError,
  parseAttendanceDays,
  saveAttendance,
} from "./attendance.service"

describe("parseAttendanceDays", () => {
  it("menerima nol dan bilangan bulat positif", () => {
    expect(parseAttendanceDays("0")).toBe(0)
    expect(parseAttendanceDays("12")).toBe(12)
  })

  it.each(["-1", "1.5", "abc", ""])("menolak nilai %s", (value) => {
    expect(() => parseAttendanceDays(value)).toThrow(AttendanceError)
  })
})

describe("saveAttendance", () => {
  it("menyimpan seluruh siswa dalam satu permintaan", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const from = vi.fn().mockReturnValue({ upsert })

    await saveAttendance(
      "user-1",
      "class-1",
      "semester-1",
      [
        {
          studentId: "student-1",
          sickDays: 1,
          permittedDays: 2,
          absentDays: 0,
        },
        {
          studentId: "student-2",
          sickDays: 0,
          permittedDays: 0,
          absentDays: 1,
        },
      ],
      { from } as never,
    )

    expect(from).toHaveBeenCalledWith("attendance")
    expect(upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ student_id: "student-1", sick_days: 1 }),
        expect.objectContaining({ student_id: "student-2", absent_days: 1 }),
      ]),
      { onConflict: "student_id,class_id,semester_id" },
    )
  })

  it("menolak jumlah hari negatif sebelum mengirim data", async () => {
    await expect(
      saveAttendance(
        "user-1",
        "class-1",
        "semester-1",
        [
          {
            studentId: "student-1",
            sickDays: -1,
            permittedDays: 0,
            absentDays: 0,
          },
        ],
        {} as never,
      ),
    ).rejects.toThrow("0 atau lebih")
  })
})
