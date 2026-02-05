"use client";

import { Building2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OrgRegisterPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName }),
      });

      const data = await res.json();

      if (res.ok) {
        // Store organization info
        sessionStorage.setItem("selected_org_slug", data.slug);
        sessionStorage.setItem("selected_org_name", data.name);
        sessionStorage.setItem("new_org_id", data.id);

        // Redirect to individual registration
        router.push(`/register?org=${data.slug}&new=true`);
      } else {
        setError(data.error || "Failed to create organization");
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
                CREATE YOUR
                <br />
                ORGANIZATION
              </h1>
            </div>
          </div>
          <p className="text-xl font-bold uppercase border-l-4 border-foreground pl-6">START YOUR JOURNEY WITH LUMAN</p>
        </div>

        {/* Card */}
        <div className="border-brutal-thick shadow-brutal-lg bg-card p-12 space-y-8">
          <form onSubmit={handleCreate} className="space-y-8">
            <div className="space-y-3">
              <label htmlFor="orgName" className="block text-sm font-black uppercase tracking-wider">
                ORGANIZATION NAME
              </label>
              <input
                id="orgName"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="ENTER YOUR ORGANIZATION NAME"
                required
                minLength={3}
                className="w-full border-brutal px-6 py-4 text-lg font-bold uppercase bg-background placeholder:text-muted-foreground placeholder:font-bold focus:outline-none focus:shadow-brutal"
              />
              <p className="text-sm font-bold uppercase opacity-70">THIS WILL BE YOUR ORGANIZATION'S DISPLAY NAME</p>
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
              <Plus className="h-6 w-6" />
              {loading ? "CREATING..." : "CREATE ORGANIZATION"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-lg font-bold uppercase">
          <p>
            ALREADY HAVE AN ORGANIZATION?{" "}
            <Link
              href="/org-login"
              className="underline decoration-4 underline-offset-8 hover:bg-accent hover:text-accent-foreground px-2"
            >
              SIGN IN
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
