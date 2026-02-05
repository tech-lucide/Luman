import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        const cookie = cookieStore.get(name);
        if (name.includes("auth-token")) {
          console.log(`[Supabase Cookies] GET ${name}: ${cookie ? "FOUND" : "NOT FOUND"}`);
        }
        return cookie?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          if (name.includes("auth-token")) {
            console.log(`[Supabase Cookies] SET ${name}`);
          }
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Handled elsewhere
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          if (name.includes("auth-token")) {
            console.log(`[Supabase Cookies] REMOVE ${name}`);
          }
          cookieStore.set({ name, value: "", ...options });
        } catch (error) {
          // Handled elsewhere
        }
      },
    },
  });
}
