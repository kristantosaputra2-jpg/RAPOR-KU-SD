import { describe, expect, it, vi } from "vitest"

import {
  HOMEROOM_NOTE_MAX_LENGTH,
  HomeroomNoteError,
  saveHomeroomNotes,
  validateHomeroomNote,
} from "./homeroom-note.service"

describe("validateHomeroomNote", () => {
  it("membersihkan spasi catatan", () => {
    expect(validateHomeroomNote("  Terus rajin belajar.  ")).toBe(
      "Terus rajin belajar.",
    )
  })

  it("menerima catatan tepat pada batas panjang", () => {
    expect(
      validateHomeroomNote("a".repeat(HOMEROOM_NOTE_MAX_LENGTH)),
    ).toHaveLength(HOMEROOM_NOTE_MAX_LENGTH)
  })

  it("menolak catatan yang terlalu panjang", () => {
    expect(() =>
      validateHomeroomNote("a".repeat(HOMEROOM_NOTE_MAX_LENGTH + 1)),
    ).toThrow(HomeroomNoteError)
  })
})

describe("saveHomeroomNotes", () => {
  it("menyimpan catatan seluruh siswa dalam satu permintaan", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const from = vi.fn().mockReturnValue({ upsert })

    await saveHomeroomNotes(
      "user-1",
      "class-1",
      "semester-1",
      [
        { studentId: "student-1", note: "Rajin belajar" },
        { studentId: "student-2", note: "Tingkatkan ketelitian" },
      ],
      { from } as never,
    )

    expect(from).toHaveBeenCalledWith("homeroom_notes")
    expect(upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          student_id: "student-1",
          note: "Rajin belajar",
        }),
      ]),
      { onConflict: "student_id,class_id,semester_id" },
    )
  })
})
