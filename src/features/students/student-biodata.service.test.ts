import { describe, expect, it, vi } from "vitest"

import {
  emptyStudentBiodataInput,
  normalizeStudentBiodataInput,
  uploadStudentPhoto,
  validateStudentPhoto,
} from "./student-biodata.service"
import type { RapotKuSupabaseClient } from "@/lib/supabase/client"

describe("student biodata service", () => {
  it("menormalkan field keluarga kosong menjadi null", () => {
    expect(
      normalizeStudentBiodataInput({
        ...emptyStudentBiodataInput,
        fatherName: "  Budi Santoso  ",
      }),
    ).toMatchObject({
      father_name: "Budi Santoso",
      mother_name: null,
      guardian_name: null,
    })
  })

  it("menolak nomor telepon yang tidak valid", () => {
    expect(() =>
      normalizeStudentBiodataInput({
        ...emptyStudentBiodataInput,
        fatherPhone: "nomor rahasia",
      }),
    ).toThrow("Nomor telepon ayah hanya boleh berisi angka dan tanda telepon.")
  })

  it("membatasi foto ke JPG atau PNG maksimal 2 MB", () => {
    expect(() =>
      validateStudentPhoto(
        new File(["foto"], "foto.webp", { type: "image/webp" }),
      ),
    ).toThrow("Foto harus berformat JPG atau PNG.")

    expect(() =>
      validateStudentPhoto(
        new File([new Uint8Array(2 * 1024 * 1024 + 1)], "foto.jpg", {
          type: "image/jpeg",
        }),
      ),
    ).toThrow("Ukuran foto maksimal 2 MB.")
  })

  it("mengunggah foto ke lokasi tetap milik siswa", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null })
    const from = vi.fn().mockReturnValue({ upload })
    const client = {
      storage: { from },
    } as unknown as RapotKuSupabaseClient
    const file = new File(["foto"], "foto.jpg", { type: "image/jpeg" })

    await expect(uploadStudentPhoto("student-1", file, client)).resolves.toBe(
      "student-1/photo",
    )
    expect(from).toHaveBeenCalledWith("student-photos")
    expect(upload).toHaveBeenCalledWith(
      "student-1/photo",
      file,
      expect.objectContaining({ upsert: true, contentType: "image/jpeg" }),
    )
  })
})
