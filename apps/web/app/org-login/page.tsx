"use client";

import { ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OrgLoginPage() {
  const router = useRouter();
  const [orgSlug, setOrgSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Convert organization name to slug format
      const slug = orgSlug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Verify organization exists
      const res = await fetch(`/api/auth/org/${slug}`);
      const data = await res.json();

      if (res.ok && data.exists) {
        // Store organization info in session storage
        sessionStorage.setItem("selected_org_slug", data.slug);
        sessionStorage.setItem("selected_org_name", data.name);

        // Redirect to individual login
        router.push(`/login?org=${data.slug}`);
      } else {
        setError("Organization not found. Please check the name and try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
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
              <Building2 className="h-16 w-16 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-black uppercase leading-none">
                WELCOME TO
                <br />
                LUMAN
              </h1>
            </div>
          </div>
          <p className="text-xl font-bold uppercase border-l-4 border-foreground pl-6">
            STEP 1: SELECT YOUR ORGANIZATION
          </p>
        </div>

        {/* Card */}
        <div className="border-brutal-thick shadow-brutal-lg bg-card p-12 space-y-8">
          <form onSubmit={handleContinue} className="space-y-8">
            <div className="space-y-3">
              <label htmlFor="orgSlug" className="block text-sm font-black uppercase tracking-wider">
                ORGANIZATION NAME
              </label>
              <input
                id="orgSlug"
                type="text"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value.trim())}
                placeholder="ENTER YOUR ORGANIZATION NAME"
                required
                className="w-full border-brutal px-6 py-4 text-lg font-bold uppercase bg-background placeholder:text-muted-foreground placeholder:font-bold focus:outline-none focus:shadow-brutal"
              />
              <p className="text-sm font-bold uppercase opacity-70">
                ENTER THE ORGANIZATION NAME PROVIDED BY YOUR ADMIN
              </p>
            </div>

            {error && (
              <div className="px-6 py-4 text-sm font-black uppercase border-brutal bg-destructive text-destructive-foreground">
                {error.toUpperCase()}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-6 text-xl font-black uppercase border-brutal shadow-brutal hover-brutal bg-accent text-accent-foreground disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? "CHECKING..." : "CONTINUE"}
              <ArrowRight className="h-6 w-6" />
            </button>
          </form>

          <div className="pt-8 border-t-4 border-foreground">
            <p className="text-sm font-black uppercase mb-4">DON'T HAVE AN ORGANIZATION?</p>
            <Link
              href="/org-register"
              className="block w-full px-8 py-6 text-xl font-black uppercase border-brutal shadow-brutal hover-brutal bg-foreground text-background text-center"
            >
              CREATE ORGANIZATION
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm font-bold uppercase opacity-70">
          <p>SECURE TWO-STEP AUTHENTICATION</p>
        </div>
      </div>
    </div>
  );
}
