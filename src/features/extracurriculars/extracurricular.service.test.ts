import { describe, expect, it, vi } from "vitest"
import {
  createExtracurricular,
  ExtracurricularError,
  normalizeExtracurricularName,
  saveStudentExtracurriculars,
} from "./extracurricular.service"

describe("extracurricular service", () => {
  it("membersihkan nama kegiatan", () =>
    expect(normalizeExtracurricularName("  Pramuka  ")).toBe("Pramuka"))
  it("menolak nama kosong", () =>
    expect(() => normalizeExtracurricularName(" ")).toThrow(
      ExtracurricularError,
    ))

  it("membuat master kegiatan untuk sekolah aktif", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "extra-1",
        school_id: "school-1",
        name: "Pramuka",
        is_active: true,
        created_at: "",
        updated_at: "",
      },
      error: null,
    })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    const from = vi.fn().mockReturnValue({ insert })
    await expect(
      createExtracurricular("user-1", "school-1", "Pramuka", { from } as never),
    ).resolves.toMatchObject({ name: "Pramuka" })
  })

  it("menolak penyimpanan tanpa siswa", async () => {
    await expect(
      saveStudentExtracurriculars(
        "user-1",
        {
          classId: "class-1",
          semesterId: "semester-1",
          extracurricularId: "extra-1",
        },
        [],
        {} as never,
      ),
    ).rejects.toThrow("minimal satu siswa")
  })
})
