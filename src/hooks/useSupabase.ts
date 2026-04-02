import { useMemo } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

/**
 * Returns a Supabase client that automatically injects the Clerk JWT
 * on every request, enabling Row Level Security policies to identify
 * the current user via `(auth.jwt() ->> 'sub') = clerk_id`.
 *
 * Requires a "supabase" JWT template configured in the Clerk dashboard.
 * See supabase/config.toml for full setup instructions.
 */
export function useSupabaseClient() {
  const { getToken } = useAuth()

  return useMemo(
    () =>
      createClient<Database>(supabaseUrl, supabaseAnonKey, {
        global: {
          fetch: async (url, options = {}) => {
            const clerkToken = await getToken({ template: 'supabase' })
            const headers = new Headers(options?.headers)
            if (clerkToken) {
              headers.set('Authorization', `Bearer ${clerkToken}`)
            }
            return fetch(url, { ...options, headers })
          },
        },
      }),
    [getToken]
  )
}
