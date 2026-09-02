import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"

export type SchoolIdentity = Readonly<{
  schoolName: string
  logoUrl: string | null
}>

export async function getPublicSchoolIdentity(
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<SchoolIdentity | null> {
  const { data, error } = await client
    .from("public_school_identity")
    .select("school_name,logo_url")
    .maybeSingle()

  if (error) {
    throw new Error("Identitas sekolah belum dapat dimuat.")
  }

  if (!data?.school_name) {
    return null
  }

  return {
    schoolName: data.school_name,
    logoUrl: data.logo_url,
  }
}
