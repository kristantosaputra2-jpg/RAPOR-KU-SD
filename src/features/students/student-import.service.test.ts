import { describe, expect, it, vi } from "vitest"

import { importStudentsToClass } from "@/features/students/student-import.service"
import type { NormalizedStudentInput } from "@/features/students/student.service"
import type { RapotKuSupabaseClient } from "@/lib/supabase/client"

const student: NormalizedStudentInput = {
  full_name: "Budi Santoso",
  nis: "001",
  nisn: null,
  gender: "male",
  birth_place: null,
  birth_date: null,
  religion: null,
  address: null,
  father_name: null,
  mother_name: null,
  guardian_name: null,
}

describe("student import service", () => {
  it("mengirim satu batch ke fungsi database", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 1, error: null })
    const client = { rpc } as unknown as RapotKuSupabaseClient

    await expect(
      importStudentsToClass("class-1", "semester-1", [student], client),
    ).resolves.toBe(1)
    expect(rpc).toHaveBeenCalledWith("import_students_to_class", {
      p_class_id: "class-1",
      p_semester_id: "semester-1",
      p_students: [{ ...student }],
    })
  })

  it("menjelaskan bahwa seluruh import dibatalkan saat terjadi duplikat", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "23505" },
    })
    const client = { rpc } as unknown as RapotKuSupabaseClient

    await expect(
      importStudentsToClass("class-1", "semester-1", [student], client),
    ).rejects.toThrow("Import dibatalkan")
  })
})
