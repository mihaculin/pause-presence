// ─────────────────────────────────────────────────────────────────────────────
// PULZ — Supabase Database Types
// Keep in sync with supabase/migrations/001_initial_schema.sql
// ─────────────────────────────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerk_id: string
          email: string | null
          name: string | null
          age: number | null
          language: 'en' | 'ro'
          primary_challenge: 'binge' | 'emotional' | 'both' | null
          triggers: string[]
          goals: string[]
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          notification_prefs: {
            checkins: boolean
            episodes: boolean
            summary: boolean
          }
          onboarding_complete: boolean
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_id: string
          email?: string | null
          name?: string | null
          age?: number | null
          language?: 'en' | 'ro'
          primary_challenge?: 'binge' | 'emotional' | 'both' | null
          triggers?: string[]
          goals?: string[]
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          notification_prefs?: {
            checkins: boolean
            episodes: boolean
            summary: boolean
          }
          onboarding_complete?: boolean
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string | null
          name?: string | null
          age?: number | null
          language?: 'en' | 'ro'
          primary_challenge?: 'binge' | 'emotional' | 'both' | null
          triggers?: string[]
          goals?: string[]
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          notification_prefs?: {
            checkins: boolean
            episodes: boolean
            summary: boolean
          }
          onboarding_complete?: boolean
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      episodes: {
        Row: {
          id: string
          clerk_id: string
          episode_type: 'binge' | 'emotional' | 'urge' | 'prevented'
          mood_before: number | null
          mood_after: number | null
          triggered_by: string[]
          intensity: number | null
          notes: string | null
          duration_minutes: number | null
          was_prevented: boolean
          created_at: string
        }
        Insert: {
          id?: string
          clerk_id: string
          episode_type: 'binge' | 'emotional' | 'urge' | 'prevented'
          mood_before?: number | null
          mood_after?: number | null
          triggered_by?: string[]
          intensity?: number | null
          notes?: string | null
          duration_minutes?: number | null
          was_prevented?: boolean
          created_at?: string
        }
        Update: {
          episode_type?: 'binge' | 'emotional' | 'urge' | 'prevented'
          mood_before?: number | null
          mood_after?: number | null
          triggered_by?: string[]
          intensity?: number | null
          notes?: string | null
          duration_minutes?: number | null
          was_prevented?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'episodes_clerk_id_fkey'
            columns: ['clerk_id']
            referencedRelation: 'users'
            referencedColumns: ['clerk_id']
          }
        ]
      }
      devices: {
        Row: {
          id: string
          clerk_id: string
          device_type: 'garmin' | 'apple_watch' | 'fitbit' | 'other'
          device_identifier: string
          connected_at: string
          last_sync_at: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          clerk_id: string
          device_type: 'garmin' | 'apple_watch' | 'fitbit' | 'other'
          device_identifier: string
          connected_at?: string
          last_sync_at?: string | null
          is_active?: boolean
        }
        Update: {
          device_type?: 'garmin' | 'apple_watch' | 'fitbit' | 'other'
          device_identifier?: string
          last_sync_at?: string | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'devices_clerk_id_fkey'
            columns: ['clerk_id']
            referencedRelation: 'users'
            referencedColumns: ['clerk_id']
          }
        ]
      }
      biomarker_readings: {
        Row: {
          id: string
          clerk_id: string
          device_id: string | null
          bpm: number | null
          temperature: number | null
          sweat_level: number | null
          movement: number | null
          recorded_at: string
        }
        Insert: {
          id?: string
          clerk_id: string
          device_id?: string | null
          bpm?: number | null
          temperature?: number | null
          sweat_level?: number | null
          movement?: number | null
          recorded_at?: string
        }
        Update: {
          bpm?: number | null
          temperature?: number | null
          sweat_level?: number | null
          movement?: number | null
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'biomarker_readings_clerk_id_fkey'
            columns: ['clerk_id']
            referencedRelation: 'users'
            referencedColumns: ['clerk_id']
          },
          {
            foreignKeyName: 'biomarker_readings_device_id_fkey'
            columns: ['device_id']
            referencedRelation: 'devices'
            referencedColumns: ['id']
          }
        ]
      }
      user_baselines: {
        Row: {
          id: string
          clerk_id: string
          avg_resting_bpm: number | null
          bpm_std_dev: number | null
          bpm_episode_threshold: number | null
          avg_sweat_level: number | null
          sweat_std_dev: number | null
          sweat_episode_threshold: number | null
          avg_movement: number | null
          movement_std_dev: number | null
          movement_low_threshold: number | null
          sample_count: number
          sensitivity_factor: number
          is_calibrated: boolean
          last_trained_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_id: string
          avg_resting_bpm?: number | null
          bpm_std_dev?: number | null
          bpm_episode_threshold?: number | null
          avg_sweat_level?: number | null
          sweat_std_dev?: number | null
          sweat_episode_threshold?: number | null
          avg_movement?: number | null
          movement_std_dev?: number | null
          movement_low_threshold?: number | null
          sample_count?: number
          sensitivity_factor?: number
          is_calibrated?: boolean
          last_trained_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          avg_resting_bpm?: number | null
          bpm_std_dev?: number | null
          bpm_episode_threshold?: number | null
          avg_sweat_level?: number | null
          sweat_std_dev?: number | null
          sweat_episode_threshold?: number | null
          avg_movement?: number | null
          movement_std_dev?: number | null
          movement_low_threshold?: number | null
          sample_count?: number
          sensitivity_factor?: number
          is_calibrated?: boolean
          last_trained_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_baselines_clerk_id_fkey'
            columns: ['clerk_id']
            referencedRelation: 'users'
            referencedColumns: ['clerk_id']
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          clerk_id: string
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          status:
            | 'active'
            | 'canceled'
            | 'incomplete'
            | 'incomplete_expired'
            | 'past_due'
            | 'trialing'
            | 'unpaid'
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_id: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          status?: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          status?: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'subscriptions_clerk_id_fkey'
            columns: ['clerk_id']
            referencedRelation: 'users'
            referencedColumns: ['clerk_id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience type aliases
// ─────────────────────────────────────────────────────────────────────────────
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type UserProfile      = Tables<'users'>
export type Episode          = Tables<'episodes'>
export type Device           = Tables<'devices'>
export type BiomarkerReading = Tables<'biomarker_readings'>
export type UserBaseline     = Tables<'user_baselines'>
export type Subscription     = Tables<'subscriptions'>
