import { describe, expect, it, vi } from "vitest"

import {
  getSchoolSettings,
  saveSchoolSettings,
  SchoolSettingsError,
  type SchoolSettingsInput,
} from "@/features/schools/school-settings.service"
import type { RapotKuSupabaseClient } from "@/lib/supabase/client"

const input: SchoolSettingsInput = {
  schoolName: "  Sekolah Dasar Contoh  ",
  npsn: " 12345678 ",
  address: " Jalan Pendidikan ",
  village: " Desa Contoh ",
  district: " Kecamatan Contoh ",
  city: " Kabupaten Contoh ",
  province: " Kalimantan Tengah ",
  postalCode: " 73111 ",
  email: " sekolah@example.com ",
  principalName: " Kepala Sekolah ",
  principalNip: " 1234567890 ",
  logoUrl: null,
}

function createSelectClient(
  result: Readonly<{ data: unknown; error: unknown }>,
) {
  const maybeSingle = vi.fn().mockResolvedValue(result)
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })

  return {
    client: { from } as unknown as RapotKuSupabaseClient,
    from,
    select,
    eq,
    maybeSingle,
  }
}

describe("school settings service", () => {
  it("mengembalikan null ketika sekolah belum dikonfigurasi", async () => {
    const { client } = createSelectClient({ data: null, error: null })

    await expect(getSchoolSettings(client)).resolves.toBeNull()
  })

  it("menolak nama sekolah kosong sebelum mengirim perubahan", async () => {
    const { client, from } = createSelectClient({ data: null, error: null })

    await expect(
      saveSchoolSettings("admin-1", { ...input, schoolName: "  " }, client),
    ).rejects.toEqual(new SchoolSettingsError("Nama sekolah wajib diisi."))
    expect(from).not.toHaveBeenCalled()
  })

  it("menyimpan konfigurasi baru dengan audit Admin", async () => {
    const savedSchool = {
      id: "school-1",
      school_name: "Sekolah Dasar Contoh",
      npsn: "12345678",
      address: "Jalan Pendidikan",
      village: "Desa Contoh",
      district: "Kecamatan Contoh",
      city: "Kabupaten Contoh",
      province: "Kalimantan Tengah",
      postal_code: "73111",
      email: "sekolah@example.com",
      principal_name: "Kepala Sekolah",
      principal_nip: "1234567890",
      logo_url: null,
      updated_at: "2026-09-02T00:00:00.000Z",
    }
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const existingEq = vi.fn().mockReturnValue({ maybeSingle })
    const existingSelect = vi.fn().mockReturnValue({ eq: existingEq })
    const single = vi.fn().mockResolvedValue({ data: savedSchool, error: null })
    const resultSelect = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select: resultSelect })
    const from = vi
      .fn()
      .mockReturnValueOnce({ select: existingSelect })
      .mockReturnValueOnce({ insert })
    const client = { from } as unknown as RapotKuSupabaseClient

    await expect(saveSchoolSettings("admin-1", input, client)).resolves.toEqual(
      savedSchool,
    )
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        school_name: "Sekolah Dasar Contoh",
        npsn: "12345678",
        singleton_key: true,
        created_by: "admin-1",
        updated_by: "admin-1",
      }),
    )
  })

  it("memperbarui konfigurasi yang sudah ada", async () => {
    const existingSchool = {
      id: "school-1",
      school_name: "Sekolah Lama",
    }
    const savedSchool = {
      ...existingSchool,
      school_name: "Sekolah Dasar Contoh",
    }
    const maybeSingle = vi.fn().mockResolvedValue({
      data: existingSchool,
      error: null,
    })
    const existingEq = vi.fn().mockReturnValue({ maybeSingle })
    const existingSelect = vi.fn().mockReturnValue({ eq: existingEq })
    const single = vi.fn().mockResolvedValue({ data: savedSchool, error: null })
    const resultSelect = vi.fn().mockReturnValue({ single })
    const updateEq = vi.fn().mockReturnValue({ select: resultSelect })
    const update = vi.fn().mockReturnValue({ eq: updateEq })
    const from = vi
      .fn()
      .mockReturnValueOnce({ select: existingSelect })
      .mockReturnValueOnce({ update })
    const client = { from } as unknown as RapotKuSupabaseClient

    await saveSchoolSettings("admin-1", input, client)

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        school_name: "Sekolah Dasar Contoh",
        updated_by: "admin-1",
      }),
    )
    expect(updateEq).toHaveBeenCalledWith("id", "school-1")
  })
})
