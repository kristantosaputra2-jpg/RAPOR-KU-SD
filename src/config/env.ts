export type SupabaseEnvironment = Readonly<{
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_PUBLISHABLE_KEY?: string
  VITE_SUPABASE_ANON_KEY?: string
}>

export type SupabaseConfig = Readonly<{
  url: string
  publishableKey: string
}>

function readLegacyJwtRole(key: string): string | undefined {
  const payload = key.split(".")[1]

  if (!payload) {
    return undefined
  }

  try {
    const normalizedPayload = payload.replaceAll("-", "+").replaceAll("_", "/")
    const paddedPayload = normalizedPayload.padEnd(
      Math.ceil(normalizedPayload.length / 4) * 4,
      "=",
    )
    const decodedPayload: unknown = JSON.parse(atob(paddedPayload))

    if (
      typeof decodedPayload === "object" &&
      decodedPayload !== null &&
      "role" in decodedPayload &&
      typeof decodedPayload.role === "string"
    ) {
      return decodedPayload.role
    }
  } catch {
    return undefined
  }

  return undefined
}

function validatePublicKey(key: string): void {
  if (key.startsWith("sb_secret_")) {
    throw new Error("Secret key Supabase tidak boleh digunakan di frontend.")
  }

  const legacyRole = readLegacyJwtRole(key)

  if (legacyRole && legacyRole !== "anon") {
    throw new Error(
      "Service-role key Supabase tidak boleh digunakan di frontend.",
    )
  }
}

export function readSupabaseConfig(env: SupabaseEnvironment): SupabaseConfig {
  const url = env.VITE_SUPABASE_URL?.trim()
  const publishableKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    env.VITE_SUPABASE_ANON_KEY?.trim()

  if (!url) {
    throw new Error("VITE_SUPABASE_URL belum dikonfigurasi.")
  }

  let parsedUrl: URL

  try {
    parsedUrl = new URL(url)
  } catch {
    throw new Error("VITE_SUPABASE_URL tidak valid.")
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error("VITE_SUPABASE_URL harus menggunakan HTTP atau HTTPS.")
  }

  if (!publishableKey) {
    throw new Error("VITE_SUPABASE_PUBLISHABLE_KEY belum dikonfigurasi.")
  }

  validatePublicKey(publishableKey)

  return { url: parsedUrl.toString().replace(/\/$/, ""), publishableKey }
}
