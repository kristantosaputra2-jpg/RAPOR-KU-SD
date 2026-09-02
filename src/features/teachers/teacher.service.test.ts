import { describe, expect, it, vi } from "vitest"

import {
  createTeacher,
  getTeachers,
  normalizeTeacherInput,
  setTeacherActive,
  TeacherError,
  updateTeacher,
  type TeacherInput,
} from "@/features/teachers/teacher.service"
import type { RapotKuSupabaseClient } from "@/lib/supabase/client"

const input: TeacherInput = {
  fullName: "  Ibu Rina  ",
  nip: " 19800101 ",
  nuptk: " 12345678 ",
  email: " RINA@EXAMPLE.COM ",
  role: "homeroom_teacher",
}

const savedTeacher = {
  id: "teacher-1",
  user_id: null,
  full_name: "Ibu Rina",
  nip: "19800101",
  nuptk: "12345678",
  email: "rina@example.com",
  role: "homeroom_teacher" as const,
  is_active: true,
  created_at: "2026-09-02T00:00:00.000Z",
  updated_at: "2026-09-02T00:00:00.000Z",
}

describe("teacher service", () => {
  it("membersihkan data guru sebelum disimpan", () => {
    expect(normalizeTeacherInput(input)).toEqual({
      full_name: "Ibu Rina",
      nip: "19800101",
      nuptk: "12345678",
      email: "rina@example.com",
      role: "homeroom_teacher",
    })
  })

  it("menolak email yang tidak valid", () => {
    expect(() =>
      normalizeTeacherInput({ ...input, email: "bukan-email" }),
    ).toThrow(new TeacherError("Masukkan alamat email yang valid."))
  })

  it("memuat daftar guru terurut", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [savedTeacher],
      error: null,
    })
    const select = vi.fn().mockReturnValue({ order })
    const from = vi.fn().mockReturnValue({ select })
    const client = { from } as unknown as RapotKuSupabaseClient

    await expect(getTeachers(client)).resolves.toEqual([savedTeacher])
    expect(from).toHaveBeenCalledWith("teacher_profiles")
    expect(order).toHaveBeenCalledWith("full_name", { ascending: true })
  })

  it("menambahkan guru dengan jejak Admin", async () => {
    const single = vi.fn().mockResolvedValue({
      data: savedTeacher,
      error: null,
    })
    const resultSelect = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select: resultSelect })
    const from = vi.fn().mockReturnValue({ insert })
    const client = { from } as unknown as RapotKuSupabaseClient

    await expect(createTeacher("admin-1", input, client)).resolves.toEqual(
      savedTeacher,
    )
    expect(insert).toHaveBeenCalledWith({
      full_name: "Ibu Rina",
      nip: "19800101",
      nuptk: "12345678",
      email: "rina@example.com",
      role: "homeroom_teacher",
      created_by: "admin-1",
      updated_by: "admin-1",
    })
  })

  it("memberi pesan jelas jika email sudah digunakan", async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: {
        code: "23505",
        message: "teacher_profiles_email_unique_idx",
      },
    })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    const client = {
      from: vi.fn().mockReturnValue({ insert }),
    } as unknown as RapotKuSupabaseClient

    await expect(createTeacher("admin-1", input, client)).rejects.toEqual(
      new TeacherError("Email tersebut sudah digunakan oleh guru lain."),
    )
  })

  it("memperbarui data guru tanpa mengubah identitas akun", async () => {
    const single = vi.fn().mockResolvedValue({
      data: savedTeacher,
      error: null,
    })
    const select = vi.fn().mockReturnValue({ single })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const client = {
      from: vi.fn().mockReturnValue({ update }),
    } as unknown as RapotKuSupabaseClient

    await updateTeacher("admin-1", "teacher-1", input, client)

    expect(update).toHaveBeenCalledWith({
      full_name: "Ibu Rina",
      nip: "19800101",
      nuptk: "12345678",
      email: "rina@example.com",
      role: "homeroom_teacher",
      updated_by: "admin-1",
    })
    expect(eq).toHaveBeenCalledWith("id", "teacher-1")
  })

  it("menonaktifkan guru tanpa menghapus datanya", async () => {
    const inactiveTeacher = { ...savedTeacher, is_active: false }
    const single = vi.fn().mockResolvedValue({
      data: inactiveTeacher,
      error: null,
    })
    const select = vi.fn().mockReturnValue({ single })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const client = {
      from: vi.fn().mockReturnValue({ update }),
    } as unknown as RapotKuSupabaseClient

    await expect(
      setTeacherActive("admin-1", "teacher-1", false, client),
    ).resolves.toEqual(inactiveTeacher)
    expect(update).toHaveBeenCalledWith({
      is_active: false,
      updated_by: "admin-1",
    })
  })
})
