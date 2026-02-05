"use client";

import AppShell from "@/components/layouts/app-shell";
import OnboardingModal from "@/components/onboarding-modal";
import type { Organization } from "@/lib/db/organizations";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Workspace = {
  id: string;
  owner_name: string;
  role: string;
  created_at: string;
};

type UserSession = {
  userId: string;
  role: "founder" | "intern";
  ownerName: string;
  organizations: Organization[];
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgSlug = searchParams.get("org");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);

  async function checkSession() {
    try {
      console.log("[Dashboard] Checking session for org:", orgSlug);
      const res = await fetch(`/api/auth/session${orgSlug ? `?org=${orgSlug}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        console.log("[Dashboard] Session data received:", data);
        setSession(data.user);
      } else {
        console.error("[Dashboard] Session check failed Status:", res.status);
        router.push(`/login${orgSlug ? `?org=${orgSlug}` : ""}`);
      }
    } catch (err) {
      console.error("Session check failed:", err);
      router.push(`/login${orgSlug ? `?org=${orgSlug}` : ""}`);
    }
  }

  async function fetchWorkspaces(orgId: string) {
    try {
      const res = await fetch(`/api/workspaces?orgId=${orgId}`);
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data);
        if (data.length === 0) {
          setShowOnboarding(true);
        } else {
          setShowOnboarding(false);
        }
      }
    } catch (err) {
      console.error("Failed to fetch workspaces:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkSession();
  }, [orgSlug]);

  useEffect(() => {
    if (session) {
      const currentOrg =
        session.organizations?.find((o: Organization) => o.slug === orgSlug) || session.organizations?.[0];

      if (currentOrg) {
        fetchWorkspaces(currentOrg.id);
      }
    }
  }, [session, orgSlug]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  async function handleCreateWorkspace(nameToCreate?: string) {
    const name = nameToCreate || prompt("Enter workspace owner name:");
    if (!name) return;

    const role = session?.role || "founder"; // Inherit session role

    try {
      setCreating(true);

      const currentOrg =
        session?.organizations?.find((o: Organization) => o.slug === orgSlug) || session?.organizations?.[0];

      if (!currentOrg) {
        alert("No organization found");
        return;
      }

      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerName: name, role, ownerId: currentOrg.id }),
      });

      if (res.ok) {
        fetchWorkspaces(currentOrg.id);
        setShowOnboarding(false);
      } else {
        const errorData = await res.json();
        alert(`Failed to create workspace: ${errorData.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error creating workspace:", err);
      alert("Error creating workspace");
    } finally {
      setCreating(false);
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show all workspaces without filtering by current session role
  const filteredWorkspaces = workspaces || [];

  return (
    <AppShell>
      <div className="p-8 md:p-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-8 mb-16">
          <div className="space-y-6">
            <h1 className="font-black uppercase leading-none border-l-8 border-foreground pl-6">
              WORK
              <br />
              SPACES
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <div className="px-6 py-3 bg-foreground text-background font-bold uppercase text-sm border-brutal">
                {session.ownerName}
              </div>
              <div
                className={`px-6 py-3 font-black uppercase text-sm border-brutal ${
                  session.role === "founder" ? "bg-accent text-accent-foreground" : "bg-foreground text-background"
                }`}
              >
                {session.role}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleLogout}
              className="px-8 py-4 text-lg font-black uppercase border-brutal hover-brutal bg-background"
            >
              LOGOUT
            </button>
            <button
              type="button"
              onClick={() => handleCreateWorkspace()}
              disabled={creating}
              className="px-8 py-4 text-lg font-black uppercase border-brutal hover-brutal bg-accent text-accent-foreground disabled:opacity-50"
            >
              {creating ? "CREATING..." : "CREATE WORKSPACE"}
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-lg font-bold uppercase">LOADING...</div>
        ) : (
          <>
            {(!filteredWorkspaces || filteredWorkspaces.length === 0) && (
              <div className="border-brutal-thick p-12 bg-muted">
                <div className="max-w-2xl space-y-6">
                  <h3 className="text-4xl font-black uppercase">NO WORKSPACES</h3>
                  <p className="text-xl font-bold uppercase border-l-4 border-foreground pl-6">
                    {session.role === "intern" ? "NO INTERN WORKSPACES FOUND" : "CREATE YOUR FIRST WORKSPACE"}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredWorkspaces?.map((ws) => (
                <Link
                  key={ws.id}
                  href={`/workspace/${ws.id}`}
                  className="border-brutal shadow-brutal hover-brutal bg-card p-8"
                >
                  <div className="space-y-6">
                    <div className="text-3xl font-black uppercase leading-tight">{ws.owner_name}</div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold uppercase">ROLE:</span>
                      <span
                        className={`px-4 py-2 font-black uppercase text-sm border-brutal ${
                          ws.role === "founder" ? "bg-accent text-accent-foreground" : "bg-foreground text-background"
                        }`}
                      >
                        {ws.role}
                      </span>
                    </div>
                    <div className="text-xs font-mono pt-4 border-t-4 border-foreground opacity-50">{ws.id}</div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <OnboardingModal isOpen={showOnboarding} onSubmit={handleCreateWorkspace} />
    </AppShell>
  );
}
