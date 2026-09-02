import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { readSupabaseConfig } from "@/config/env"
import type { Database } from "@/types/database.types"

export type RapotKuSupabaseClient = SupabaseClient<Database>

let supabaseClient: RapotKuSupabaseClient | undefined

export function getSupabaseClient(): RapotKuSupabaseClient {
  if (!supabaseClient) {
    const config = readSupabaseConfig({
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env
        .VITE_SUPABASE_PUBLISHABLE_KEY,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    })

    supabaseClient = createClient<Database>(config.url, config.publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  }

  return supabaseClient
}
