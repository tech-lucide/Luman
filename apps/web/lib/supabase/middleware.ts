import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
            maxAge: 345600,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    },
  );

  // This will refresh session if expired - essential for SSR
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in and tries to access public auth pages, redirect to dashboard
  const hasOrgParam = request.nextUrl.searchParams.has("org");
  if (
    user &&
    !hasOrgParam &&
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/register")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // If user is logged in and tries to access main landing pages, redirect to dashboard
  const landingPages = ["/", "/about", "/pricing", "/features", "/support"];
  if (user && landingPages.includes(request.nextUrl.pathname)) {
    let orgSlugToUse = request.nextUrl.searchParams.get("org");

    if (!orgSlugToUse) {
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organizations(slug)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      const orgObj = membership?.organizations as any;
      if (orgObj?.slug) {
        orgSlugToUse = orgObj.slug;
      }
    }

    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    if (orgSlugToUse) {
      url.searchParams.set("org", orgSlugToUse);
    }
    return NextResponse.redirect(url);
  }

  return response;
}
