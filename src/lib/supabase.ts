import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  )
}

/**
 * Public Supabase client — no auth token attached.
 * Use only for operations that don't require RLS (e.g. public reads).
 * For user-owned data, use the `useSupabaseClient()` hook instead.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
