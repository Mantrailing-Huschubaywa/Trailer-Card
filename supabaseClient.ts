import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Please check your environment variables.");
  // Fallback to dummy values to prevent crash, but operations will fail.
  // In a real app, you might want to throw an error or handle this more gracefully.
  // For development, ensure these are loaded (e.g., via a bundler's env config).
  // For Playcode, these would be directly available from the runtime environment.
}

export const supabase = createClient(supabaseUrl || 'https://dummy.supabase.co', supabaseAnonKey || 'dummy_key');
