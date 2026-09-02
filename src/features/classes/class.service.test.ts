import { describe, expect, it, vi } from "vitest"

import {
  ClassError,
  createClass,
  getClasses,
  getClassTemplateGroup,
  normalizeClassInput,
  updateClass,
  type ClassInput,
} from "@/features/classes/class.service"
import type { RapotKuSupabaseClient } from "@/lib/supabase/client"

const input: ClassInput = {
  academicYearId: "year-1",
  semesterId: "semester-1",
  gradeLevel: 4,
  name: " 4A ",
  homeroomTeacherId: "teacher-1",
}

const savedClass = {
  id: "class-1",
  academic_year_id: "year-1",
  semester_id: "semester-1",
  grade_level: 4,
  name: "4A",
  homeroom_teacher_id: "teacher-1",
  template_group: "upper_primary" as const,
  created_at: "2026-09-02T00:00:00.000Z",
  updated_at: "2026-09-02T00:00:00.000Z",
}

describe("class service", () => {
  it("menentukan kelompok template dari tingkat kelas", () => {
    expect(getClassTemplateGroup(1)).toBe("lower_primary")
    expect(getClassTemplateGroup(3)).toBe("lower_primary")
    expect(getClassTemplateGroup(4)).toBe("upper_primary")
    expect(getClassTemplateGroup(6)).toBe("upper_primary")
  })

  it("menolak tingkat di luar kelas 1 sampai 6", () => {
    expect(() => getClassTemplateGroup(7)).toThrow(
      new ClassError("Tingkat kelas harus antara 1 sampai 6."),
    )
  })

  it("membersihkan data kelas dan membolehkan wali belum ditentukan", () => {
    expect(normalizeClassInput({ ...input, homeroomTeacherId: "" })).toEqual({
      academic_year_id: "year-1",
      semester_id: "semester-1",
      grade_level: 4,
      name: "4A",
      homeroom_teacher_id: null,
    })
  })

  it("memuat daftar kelas tanpa mengambil kolom yang tidak diperlukan", async () => {
    const order = vi.fn().mockResolvedValue({ data: [savedClass], error: null })
    const select = vi.fn().mockReturnValue({ order })
    const from = vi.fn().mockReturnValue({ select })
    const client = { from } as unknown as RapotKuSupabaseClient

    await expect(getClasses(client)).resolves.toEqual([savedClass])
    expect(from).toHaveBeenCalledWith("classes")
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false })
  })

  it("menambah kelas dengan jejak Admin", async () => {
    const single = vi.fn().mockResolvedValue({ data: savedClass, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    const client = {
      from: vi.fn().mockReturnValue({ insert }),
    } as unknown as RapotKuSupabaseClient

    await expect(createClass("admin-1", input, client)).resolves.toEqual(
      savedClass,
    )
    expect(insert).toHaveBeenCalledWith({
      academic_year_id: "year-1",
      semester_id: "semester-1",
      grade_level: 4,
      name: "4A",
      homeroom_teacher_id: "teacher-1",
      created_by: "admin-1",
      updated_by: "admin-1",
    })
  })

  it("memperbarui kelas tanpa mengubah audit pembuat", async () => {
    const single = vi.fn().mockResolvedValue({ data: savedClass, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const client = {
      from: vi.fn().mockReturnValue({ update }),
    } as unknown as RapotKuSupabaseClient

    await updateClass("admin-1", "class-1", input, client)

    expect(update).toHaveBeenCalledWith({
      academic_year_id: "year-1",
      semester_id: "semester-1",
      grade_level: 4,
      name: "4A",
      homeroom_teacher_id: "teacher-1",
      updated_by: "admin-1",
    })
    expect(eq).toHaveBeenCalledWith("id", "class-1")
  })
})
