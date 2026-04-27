import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client — stores session in cookies so server can read it
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)