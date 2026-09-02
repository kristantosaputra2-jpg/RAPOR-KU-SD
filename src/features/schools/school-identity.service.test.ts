import { describe, expect, it, vi } from "vitest"

import { getPublicSchoolIdentity } from "@/features/schools/school-identity.service"
import type { RapotKuSupabaseClient } from "@/lib/supabase/client"

function createClient(result: Readonly<{ data: unknown; error: unknown }>) {
  const maybeSingle = vi.fn().mockResolvedValue(result)
  const select = vi.fn().mockReturnValue({ maybeSingle })
  const from = vi.fn().mockReturnValue({ select })

  return {
    client: { from } as unknown as RapotKuSupabaseClient,
    from,
    select,
  }
}

describe("public school identity service", () => {
  it("membaca hanya nama dan logo publik sekolah", async () => {
    const { client, from, select } = createClient({
      data: {
        school_name: "SD Negeri Tumbang Kawei",
        logo_url: null,
      },
      error: null,
    })

    await expect(getPublicSchoolIdentity(client)).resolves.toEqual({
      schoolName: "SD Negeri Tumbang Kawei",
      logoUrl: null,
    })
    expect(from).toHaveBeenCalledWith("public_school_identity")
    expect(select).toHaveBeenCalledWith("school_name,logo_url")
  })

  it("mengembalikan null jika identitas belum disiapkan", async () => {
    const { client } = createClient({ data: null, error: null })

    await expect(getPublicSchoolIdentity(client)).resolves.toBeNull()
  })

  it("tidak menampilkan error database mentah", async () => {
    const { client } = createClient({
      data: null,
      error: new Error("relation detail"),
    })

    await expect(getPublicSchoolIdentity(client)).rejects.toThrow(
      "Identitas sekolah belum dapat dimuat.",
    )
  })
})
