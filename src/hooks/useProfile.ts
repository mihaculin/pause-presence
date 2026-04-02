import { useUser } from '@clerk/clerk-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabaseClient } from './useSupabase'
import type { UpdateTables } from '@/types/database'

/**
 * Fetches the current user's profile from Supabase.
 * Returns null (not an error) if the profile hasn't been created yet
 * by the Clerk webhook — e.g. during the brief gap after first sign-up.
 */
export function useProfile() {
  const { user } = useUser()
  const supabase = useSupabaseClient()

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Mutation to update the current user's profile.
 * Automatically invalidates the profile cache on success.
 */
export function useUpdateProfile() {
  const { user } = useUser()
  const supabase = useSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: UpdateTables<'users'>) => {
      if (!user?.id) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('clerk_id', user.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    },
  })
}
