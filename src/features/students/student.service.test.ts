import { describe, expect, it, vi } from "vitest"

import {
  assignStudentToClass,
  createStudent,
  normalizeStudentInput,
  removeStudentFromClass,
  type StudentInput,
} from "@/features/students/student.service"
import type { RapotKuSupabaseClient } from "@/lib/supabase/client"

const input: StudentInput = {
  fullName: "  Budi Santoso  ",
  nis: " 001/SD ",
  nisn: "0012345678",
  gender: "male",
  birthPlace: "Kasongan",
  birthDate: "2016-04-12",
  religion: "",
  address: "Tumbang Kawei",
  fatherName: "Ayah Budi",
  motherName: "Ibu Budi",
  guardianName: "",
}

const savedStudent = {
  id: "student-1",
  full_name: "Budi Santoso",
  nis: "001/SD",
  nisn: "0012345678",
  gender: "male" as const,
  birth_place: "Kasongan",
  birth_date: "2016-04-12",
  religion: null,
  address: "Tumbang Kawei",
  father_name: "Ayah Budi",
  mother_name: "Ibu Budi",
  guardian_name: null,
  is_active: true,
  created_at: "2026-09-02T00:00:00.000Z",
  updated_at: "2026-09-02T00:00:00.000Z",
}

describe("student service", () => {
  it("menormalkan input dan mengizinkan siswa tanpa NISN", () => {
    expect(normalizeStudentInput({ ...input, nisn: "" })).toMatchObject({
      full_name: "Budi Santoso",
      nis: "001/SD",
      nisn: null,
      religion: null,
      guardian_name: null,
    })
  })

  it("menolak NISN yang bukan 10 angka", () => {
    expect(() => normalizeStudentInput({ ...input, nisn: "123" })).toThrow(
      "NISN harus terdiri dari 10 angka.",
    )
  })

  it("menolak tanggal lahir pada masa depan", () => {
    expect(() =>
      normalizeStudentInput({ ...input, birthDate: "2999-01-01" }),
    ).toThrow("Tanggal lahir tidak boleh melebihi hari ini.")
  })

  it("menambah siswa dengan jejak Admin", async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: savedStudent, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    const client = {
      from: vi.fn().mockReturnValue({ insert }),
    } as unknown as RapotKuSupabaseClient

    await expect(createStudent("admin-1", input, client)).resolves.toEqual(
      savedStudent,
    )
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: "Budi Santoso",
        nis: "001/SD",
        created_by: "admin-1",
        updated_by: "admin-1",
      }),
    )
  })

  it("menempatkan siswa baru ke kelas semester aktif", async () => {
    const membership = {
      id: "member-1",
      student_id: "student-1",
      class_id: "class-1",
      semester_id: "semester-1",
      created_at: "2026-09-02T00:00:00.000Z",
      updated_at: "2026-09-02T00:00:00.000Z",
    }
    const single = vi.fn().mockResolvedValue({ data: membership, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    const client = {
      from: vi.fn().mockReturnValue({ insert }),
    } as unknown as RapotKuSupabaseClient

    await assignStudentToClass(
      "admin-1",
      "student-1",
      "class-1",
      "semester-1",
      undefined,
      client,
    )

    expect(insert).toHaveBeenCalledWith({
      student_id: "student-1",
      class_id: "class-1",
      semester_id: "semester-1",
      created_by: "admin-1",
      updated_by: "admin-1",
    })
  })

  it("menghapus penempatan kelas tanpa menghapus siswa", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const deleteRow = vi.fn().mockReturnValue({ eq })
    const client = {
      from: vi.fn().mockReturnValue({ delete: deleteRow }),
    } as unknown as RapotKuSupabaseClient

    await expect(
      removeStudentFromClass("member-1", client),
    ).resolves.toBeUndefined()
    expect(eq).toHaveBeenCalledWith("id", "member-1")
  })
})
