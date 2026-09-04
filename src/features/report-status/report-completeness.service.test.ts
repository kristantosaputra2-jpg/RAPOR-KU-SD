import { describe, expect, it, vi } from "vitest"

import { saveCompletionConfirmations } from "./report-completeness.service"

describe("saveCompletionConfirmations", () => {
  it("menyimpan konfirmasi seluruh siswa dalam satu permintaan", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const from = vi.fn().mockReturnValue({ upsert })

    await saveCompletionConfirmations(
      "user-1",
      "class-1",
      "semester-1",
      [
        {
          studentId: "student-1",
          extracurricularConfirmedEmpty: true,
          achievementConfirmedEmpty: false,
        },
        {
          studentId: "student-2",
          extracurricularConfirmedEmpty: false,
          achievementConfirmedEmpty: true,
        },
      ],
      { from } as never,
    )

    expect(from).toHaveBeenCalledWith("report_completion_confirmations")
    expect(upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          student_id: "student-1",
          extracurricular_confirmed_empty: true,
        }),
      ]),
      { onConflict: "student_id,class_id,semester_id" },
    )
  })
})
