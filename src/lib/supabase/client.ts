import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://placeholder-project.supabase.co"
);

export function createClient() {
  if (!isSupabaseConfigured) {
    // Fallback dummy client if credentials aren't set in .env.local yet
    return createSupabaseClient(
      supabaseUrl || "https://placeholder-project.supabase.co",
      supabaseAnonKey || "placeholder-anon-key"
    );
  }

  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}

export const supabase = createClient();
