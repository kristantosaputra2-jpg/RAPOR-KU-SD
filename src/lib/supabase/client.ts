import { createClient } from "@supabase/supabase-js"

import { readSupabaseConfig } from "@/config/env"

export type RapotKuSupabaseClient = ReturnType<typeof createClient>

let supabaseClient: RapotKuSupabaseClient | undefined

export function getSupabaseClient(): RapotKuSupabaseClient {
  if (!supabaseClient) {
    const config = readSupabaseConfig({
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env
        .VITE_SUPABASE_PUBLISHABLE_KEY,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    })

    supabaseClient = createClient(config.url, config.publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  }

  return supabaseClient
}
