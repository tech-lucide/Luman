"use client";

import { createSupabaseClient } from "@/lib/supabase/client";
import { ArrowLeft, Building2, User } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgSlug = searchParams.get("org");
  const registered = searchParams.get("registered");

  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get organization name from session storage
    const storedOrgName = sessionStorage.getItem("selected_org_name");
    if (storedOrgName) {
      setOrgName(storedOrgName);
    } else if (!orgSlug) {
      // No organization selected, redirect to org login
      router.push("/org-login");
    }
  }, [orgSlug, router]);

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);

    console.log("=== GOOGLE SIGN-IN STARTED ===");
    console.log("Organization Slug:", orgSlug);
    console.log("Window Origin:", window.location.origin);
    console.log("Redirect URL:", `${window.location.origin}/auth/callback?org=${orgSlug}`);

    try {
      const supabase = createSupabaseClient();

      console.log("Supabase client created. Setting org cookie...");

      // Store org slug in a cookie that expires in 10 minutes
      document.cookie = `sb_org_slug=${orgSlug}; path=/; max-age=600; SameSite=Lax`;

      // Sign in with Google OAuth
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      console.log("OAuth response:", { url: data?.url, error: authError });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      }
      // If successful, user will be redirected to Google
    } catch (err) {
      console.error("=== EXCEPTION IN OAUTH ===");
      console.error("Exception:", err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-16">
      <div className="w-full max-w-2xl space-y-12">
        {/* Header */}
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="p-6 border-brutal-thick bg-accent">
              <User className="h-16 w-16 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-black uppercase leading-none">
                WELCOME
                <br />
                BACK
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-xl font-bold uppercase border-l-4 border-foreground pl-6 flex-1">
              STEP 2: SIGN IN TO {orgName.toUpperCase() || "YOUR ACCOUNT"}
            </p>
            <Link
              href="/org-login"
              className="px-4 py-2 text-sm font-black uppercase border-brutal hover-brutal bg-background flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              CHANGE ORG
            </Link>
          </div>
        </div>

        {/* Organization Badge */}
        {orgName && (
          <div className="border-brutal bg-muted p-6 flex items-center gap-4">
            <Building2 className="h-8 w-8" />
            <div>
              <p className="text-sm font-black uppercase opacity-70">ORGANIZATION</p>
              <p className="text-lg font-black uppercase">{orgName}</p>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="border-brutal-thick shadow-brutal-lg bg-card p-12 space-y-8">
          {registered && (
            <div className="px-6 py-4 text-sm font-black uppercase border-brutal bg-accent text-accent-foreground">
              ACCOUNT CREATED! PLEASE SIGN IN WITH GOOGLE
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-lg font-bold uppercase">SIGN IN WITH YOUR GOOGLE ACCOUNT</p>
              <p className="text-sm font-bold uppercase opacity-70">ONE CLICK TO ACCESS YOUR WORKSPACE</p>
            </div>

            {error && (
              <div className="px-6 py-4 text-sm font-black uppercase border-brutal bg-destructive text-destructive-foreground">
                {error.toUpperCase()}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full px-8 py-6 text-xl font-black uppercase border-brutal shadow-brutal hover-brutal bg-white text-black disabled:opacity-50 flex items-center justify-center gap-4"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" aria-labelledby="google-icon-title">
                <title id="google-icon-title">Google Icon</title>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? "SIGNING IN..." : "SIGN IN WITH GOOGLE"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-lg font-bold uppercase space-y-2">
          <p>
            DON'T HAVE AN ACCOUNT?{" "}
            <Link
              href={`/register${orgSlug ? `?org=${orgSlug}` : ""}`}
              className="underline decoration-4 underline-offset-8 hover:bg-accent hover:text-accent-foreground px-2"
            >
              SIGN UP
            </Link>
          </p>
          <p className="text-sm opacity-70">
            HAVE AN INVITE CODE?{" "}
            <Link
              href="/join"
              className="underline decoration-2 underline-offset-4 hover:bg-accent hover:text-accent-foreground px-1"
            >
              JOIN ORGANIZATION
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
