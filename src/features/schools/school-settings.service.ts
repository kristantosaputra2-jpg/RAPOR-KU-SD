import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"
import type { Database, Tables } from "@/types/database.types"

const schoolColumns =
  "id,school_name,npsn,address,village,district,city,province,postal_code,email,principal_name,principal_nip,logo_url,updated_at"

export type SchoolSettings = Pick<
  Tables<"schools">,
  | "id"
  | "school_name"
  | "npsn"
  | "address"
  | "village"
  | "district"
  | "city"
  | "province"
  | "postal_code"
  | "email"
  | "principal_name"
  | "principal_nip"
  | "logo_url"
  | "updated_at"
>

export type SchoolSettingsInput = Readonly<{
  schoolName: string
  npsn: string
  address: string
  village: string
  district: string
  city: string
  province: string
  postalCode: string
  email: string
  principalName: string
  principalNip: string
  logoUrl?: string | null
}>

export class SchoolSettingsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SchoolSettingsError"
  }
}

function optionalText(value: string | null | undefined): string | null {
  const trimmedValue = value?.trim() ?? ""
  return trimmedValue || null
}

function validateSchoolSettings(input: SchoolSettingsInput) {
  const schoolName = input.schoolName.trim()

  if (!schoolName) {
    throw new SchoolSettingsError("Nama sekolah wajib diisi.")
  }

  if (schoolName.length > 160) {
    throw new SchoolSettingsError("Nama sekolah maksimal 160 karakter.")
  }

  const email = optionalText(input.email)

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new SchoolSettingsError("Format email sekolah belum sesuai.")
  }

  return {
    school_name: schoolName,
    npsn: optionalText(input.npsn),
    address: optionalText(input.address),
    village: optionalText(input.village),
    district: optionalText(input.district),
    city: optionalText(input.city),
    province: optionalText(input.province),
    postal_code: optionalText(input.postalCode),
    email,
    principal_name: optionalText(input.principalName),
    principal_nip: optionalText(input.principalNip),
    logo_url: optionalText(input.logoUrl),
  }
}

export async function getSchoolSettings(
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<SchoolSettings | null> {
  const { data, error } = await client
    .from("schools")
    .select(schoolColumns)
    .eq("singleton_key", true)
    .maybeSingle()

  if (error) {
    throw new SchoolSettingsError(
      "Pengaturan sekolah belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  }

  return data
}

export async function saveSchoolSettings(
  userId: string,
  input: SchoolSettingsInput,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<SchoolSettings> {
  const values = validateSchoolSettings(input)
  const existingSettings = await getSchoolSettings(client)

  if (existingSettings) {
    const update: Database["public"]["Tables"]["schools"]["Update"] = {
      ...values,
      updated_by: userId,
    }
    const { data, error } = await client
      .from("schools")
      .update(update)
      .eq("id", existingSettings.id)
      .select(schoolColumns)
      .single()

    if (error || !data) {
      throw new SchoolSettingsError(
        "Pengaturan sekolah belum dapat disimpan. Periksa koneksi internet lalu coba lagi.",
      )
    }

    return data
  }

  const insert: Database["public"]["Tables"]["schools"]["Insert"] = {
    ...values,
    singleton_key: true,
    created_by: userId,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("schools")
    .insert(insert)
    .select(schoolColumns)
    .single()

  if (error || !data) {
    throw new SchoolSettingsError(
      "Pengaturan sekolah belum dapat disimpan. Periksa koneksi internet lalu coba lagi.",
    )
  }

  return data
}
