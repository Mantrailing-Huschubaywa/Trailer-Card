// supabaseClient.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// WICHTIG: Ersetzen Sie diese Platzhalter durch Ihre tatsächlichen Supabase-Projekt-URL und den anon key.
// Diese finden Sie in Ihren Supabase-Projekteinstellungen unter "API".
const supabaseUrl = 'https://mezgqcstuiklixooqrfg.supabase.co'; // z.B. 'https://xyz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lemdxY3N0dWlrbGl4b29xcmZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjM2MzMsImV4cCI6MjA4MjkzOTYzM30.C-26VIXQWU8xiOszx-0wRM2BYOuCaWEFz1DLNgezpJo'; // Ein langer String

let supabaseInstance: SupabaseClient | null = null;

/**
 * Erstellt und gibt eine Supabase-Client-Instanz zurück.
 * Die Instanz wird nur einmal erstellt (Singleton-Muster).
 * Gibt `null` zurück, wenn die Konfiguration ungültig ist.
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  // Wichtige Prüfung, um den Absturz zu verhindern, falls die URL ungültig ist.
  if (!supabaseUrl || !supabaseUrl.startsWith('http') || !supabaseAnonKey) {
      console.error("Ungültige Supabase-URL oder fehlender Key. Bitte überprüfen Sie Ihre Konfiguration in supabaseClient.ts");
      return null;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
};