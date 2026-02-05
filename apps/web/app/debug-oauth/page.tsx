"use client";

import { createSupabaseClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function DebugOAuthPage() {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const supabase = createSupabaseClient();

    setConfig({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      expectedRedirectUri: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
      appCallbackUrl: `${window.location.origin}/auth/callback`,
    });
  }, []);

  async function testOAuth() {
    const supabase = createSupabaseClient();

    console.log("Starting OAuth with redirect to:", `${window.location.origin}/auth/callback?org=test-company`);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?org=test-company`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("OAuth error:", error);
    } else {
      console.log("OAuth data:", data);
    }
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-black uppercase">OAuth Debug</h1>

        <div className="border-brutal-thick p-8 bg-card space-y-6">
          <h2 className="text-2xl font-black uppercase">Configuration</h2>

          {config && (
            <div className="space-y-4 font-mono text-sm">
              <div className="space-y-2">
                <p className="font-bold">Supabase URL:</p>
                <p className="bg-muted p-4 border-brutal">{config.supabaseUrl}</p>
              </div>

              <div className="space-y-2">
                <p className="font-bold">Site URL:</p>
                <p className="bg-muted p-4 border-brutal">{config.siteUrl}</p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-accent">
                  Expected Google Redirect URI (add this to Google Cloud Console):
                </p>
                <p className="bg-accent/10 p-4 border-brutal border-accent text-accent font-bold">
                  {config.expectedRedirectUri}
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-bold">App Callback URL:</p>
                <p className="bg-muted p-4 border-brutal">{config.appCallbackUrl}</p>
              </div>
            </div>
          )}

          <div className="pt-6 border-t-4 border-foreground">
            <h3 className="text-xl font-black uppercase mb-4">Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 font-bold">
              <li>Copy the "Expected Google Redirect URI" above</li>
              <li>Go to Google Cloud Console → APIs & Services → Credentials</li>
              <li>Click your OAuth 2.0 Client ID</li>
              <li>Under "Authorized redirect URIs", make sure you have EXACTLY that URI</li>
              <li>Save changes in Google Cloud Console</li>
              <li>Wait 5 minutes for changes to propagate</li>
              <li>Click the test button below</li>
            </ol>
          </div>

          <button
            onClick={testOAuth}
            className="w-full px-8 py-6 text-xl font-black uppercase border-brutal shadow-brutal hover-brutal bg-accent text-accent-foreground"
          >
            Test OAuth
          </button>
        </div>

        <div className="border-brutal-thick p-8 bg-card space-y-4">
          <h2 className="text-2xl font-black uppercase">Troubleshooting</h2>

          <div className="space-y-4">
            <div className="bg-destructive/10 border-brutal border-destructive p-4">
              <p className="font-black uppercase text-destructive mb-2">Common Mistake:</p>
              <p className="font-bold">
                ❌ DON'T use: <code className="bg-background px-2 py-1">http://localhost:3000/auth/callback</code>
              </p>
            </div>

            <div className="bg-accent/10 border-brutal border-accent p-4">
              <p className="font-black uppercase text-accent mb-2">Correct:</p>
              <p className="font-bold">
                ✅ DO use: <code className="bg-background px-2 py-1">{config?.expectedRedirectUri}</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
