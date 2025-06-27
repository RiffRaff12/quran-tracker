import { createClient } from '@supabase/supabase-js'

// Mock supabase client for offline-first app
// Since this app is designed to work offline, we create a mock client
// that doesn't require environment variables

const mockSupabaseUrl = 'https://mock.supabase.co'
const mockSupabaseAnonKey = 'mock-anon-key'

export const supabase = createClient(mockSupabaseUrl, mockSupabaseAnonKey)

// Override auth methods to work offline
supabase.auth = {
  ...supabase.auth,
  signOut: async () => ({ error: null }),
  getSession: async () => ({ data: { session: null }, error: null }),
  getUser: async () => ({ data: { user: null }, error: null }),
} as any; 