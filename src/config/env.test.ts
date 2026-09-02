import { describe, expect, it } from "vitest"

import { readSupabaseConfig } from "./env"

function createLegacyKey(role: string): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const payload = btoa(JSON.stringify({ role }))

  return `${header}.${payload}.signature`
}

describe("readSupabaseConfig", () => {
  it("reads the modern publishable key", () => {
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: "https://example.supabase.co/",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      }),
    ).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_example",
    })
  })

  it("keeps temporary compatibility with a legacy anon key", () => {
    const anonKey = createLegacyKey("anon")

    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: "http://127.0.0.1:54321",
        VITE_SUPABASE_ANON_KEY: anonKey,
      }).publishableKey,
    ).toBe(anonKey)
  })

  it("rejects a modern secret key", () => {
    expect(() =>
      readSupabaseConfig({
        VITE_SUPABASE_URL: "https://example.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_secret_example",
      }),
    ).toThrow("Secret key Supabase tidak boleh digunakan di frontend.")
  })

  it("rejects a legacy service-role key", () => {
    expect(() =>
      readSupabaseConfig({
        VITE_SUPABASE_URL: "https://example.supabase.co",
        VITE_SUPABASE_ANON_KEY: createLegacyKey("service_role"),
      }),
    ).toThrow("Service-role key Supabase tidak boleh digunakan di frontend.")
  })

  it("requires a valid URL and public key", () => {
    expect(() => readSupabaseConfig({})).toThrow(
      "VITE_SUPABASE_URL belum dikonfigurasi.",
    )
    expect(() =>
      readSupabaseConfig({
        VITE_SUPABASE_URL: "not-a-url",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      }),
    ).toThrow("VITE_SUPABASE_URL tidak valid.")
  })
})
