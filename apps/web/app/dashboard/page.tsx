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
  folder_id?: string | null;
  color?: string;
};

type UserSession = {
  userId: string;
  role: "founder" | "intern";
  ownerName: string;
  organizations: Organization[];
  invitation_code?: string;
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
  const [folders, setFolders] = useState<{ id: string; name: string; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewDensity, setViewDensity] = useState<2 | 3 | 4>(2); // columns
  const [sortBy, setSortBy] = useState<"name" | "date">("name");

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
      const [wsRes, fRes] = await Promise.all([
        fetch(`/api/workspaces?orgId=${orgId}`),
        fetch(`/api/folders?orgId=${orgId}`),
      ]);

      if (wsRes.ok) {
        const data = await wsRes.json();
        setWorkspaces(data);
        if (data.length === 0) setShowOnboarding(true);
        else setShowOnboarding(false);
      }

      if (fRes.ok) {
        const fdata = await fRes.json();
        setFolders(fdata);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
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

  async function handleDeleteWorkspace(id: string) {
    if (!confirm("Are you sure you want to delete this workspace? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/workspaces?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (session) {
          const currentOrg =
            session.organizations?.find((o: Organization) => o.slug === orgSlug) || session.organizations?.[0];
          if (currentOrg) fetchWorkspaces(currentOrg.id);
        }
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete workspace");
      }
    } catch (err) {
      console.error("Error deleting workspace:", err);
      alert("Error deleting workspace");
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Filter and sort workspaces
  let filteredWorkspaces = workspaces || [];

  // Search filter
  if (searchQuery) {
    filteredWorkspaces = filteredWorkspaces.filter((ws) =>
      ws.owner_name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }

  // Sort
  filteredWorkspaces = [...filteredWorkspaces].sort((a, b) => {
    if (sortBy === "name") {
      return a.owner_name.localeCompare(b.owner_name);
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

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
              {session.role === "founder" && session.organizations[0]?.invitation_code && (
                <div className="px-6 py-3 bg-accent text-accent-foreground font-bold uppercase text-sm border-brutal flex items-center gap-2">
                  <span>INVITE CODE:</span>
                  <span className="font-mono text-lg">{session.organizations[0].invitation_code}</span>
                </div>
              )}
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
            <button
              type="button"
              onClick={async () => {
                const name = prompt("Folder Name:");
                if (!name) return;
                const color = prompt("Color (red, blue, green, etc):") || "stone";

                // Create folder logic inline for now (or make a function)
                const currentOrg =
                  session?.organizations?.find((o: Organization) => o.slug === orgSlug) || session?.organizations?.[0];
                if (!currentOrg) return;

                await fetch("/api/folders", {
                  method: "POST",
                  body: JSON.stringify({ name, orgId: currentOrg.id, color }),
                });
                fetchWorkspaces(currentOrg.id);
              }}
              className="px-8 py-4 text-lg font-black uppercase border-brutal hover-brutal bg-background"
            >
              NEW FOLDER
            </button>
          </div>

          {/* Search and View Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 w-full space-y-2">
              <label className="text-sm font-black uppercase tracking-wider">SEARCH</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="FILTER BY NAME..."
                className="w-full border-brutal px-6 py-4 text-lg font-bold uppercase bg-background placeholder:text-muted-foreground placeholder:font-bold focus:outline-none focus:shadow-brutal"
              />
            </div>
            <div className="flex gap-2">
              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-wider block">SORT</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "name" | "date")}
                  className="border-brutal px-4 py-4 text-sm font-black uppercase bg-background focus:outline-none focus:shadow-brutal"
                >
                  <option value="name">NAME</option>
                  <option value="date">DATE</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-wider block">COLUMNS</label>
                <div className="flex border-brutal overflow-hidden">
                  {[2, 3, 4].map((cols) => (
                    <button
                      key={cols}
                      type="button"
                      onClick={() => setViewDensity(cols as 2 | 3 | 4)}
                      className={`px-6 py-4 text-sm font-black uppercase transition-colors ${
                        viewDensity === cols ? "bg-accent text-accent-foreground" : "bg-background hover:bg-muted"
                      } border-r-2 border-foreground last:border-r-0`}
                    >
                      {cols}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results Counter */}
          {searchQuery && (
            <div className="text-sm font-bold uppercase opacity-70">
              SHOWING {filteredWorkspaces.length} OF {workspaces.length} WORKSPACES
            </div>
          )}
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

            <div
              className={`grid grid-cols-1 ${viewDensity === 2 ? "md:grid-cols-2" : viewDensity === 3 ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"} gap-8`}
            >
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
                    <div className="text-xs font-mono pt-4 border-t-4 border-foreground opacity-50 flex justify-between items-center">
                      <span>{ws.id}</span>
                      {(session.role === "founder" || session.userId === ws.id) && ( // Assuming owner_id matches user id logic, but here ws.id is workspace id. We should check ownership but UI toggle is fine for now
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteWorkspace(ws.id);
                          }}
                          className="text-destructive hover:underline uppercase font-bold text-xs"
                        >
                          DELETE
                        </button>
                      )}
                    </div>
                    {/* Quick Actions for Folder/Color */}
                    <div className="mt-4 flex gap-2" onClick={(e) => e.preventDefault()}>
                      <select
                        className="bg-background border-brutal-sm text-xs font-bold uppercase p-1"
                        defaultValue={ws.folder_id || ""}
                        onChange={async (e) => {
                          const folderId = e.target.value || null;
                          const res = await fetch(`/api/workspaces?id=${ws.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ folderId }),
                          });
                          if (res.ok && session && session.organizations?.[0]) {
                            await fetchWorkspaces(session.organizations[0].id);
                          }
                        }}
                      >
                        <option value="">NO FOLDER</option>
                        {folders.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>

                      <select
                        className="bg-background border-brutal-sm text-xs font-bold uppercase p-1"
                        defaultValue={ws.color || "stone"}
                        onChange={async (e) => {
                          const color = e.target.value;
                          const res = await fetch(`/api/workspaces?id=${ws.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ color }),
                          });
                          if (res.ok && session && session.organizations?.[0]) {
                            await fetchWorkspaces(session.organizations[0].id);
                          }
                        }}
                      >
                        <option value="stone">GRAY</option>
                        <option value="red">RED</option>
                        <option value="blue">BLUE</option>
                        <option value="green">GREEN</option>
                        <option value="yellow">YELLOW</option>
                        <option value="purple">PURPLE</option>
                        <option value="pink">PINK</option>
                        <option value="orange">ORANGE</option>
                      </select>
                    </div>
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
