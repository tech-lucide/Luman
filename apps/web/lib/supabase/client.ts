import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Supabase Client] ERROR: Missing environment variables!");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
