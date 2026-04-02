"use client";

import AppShell from "@/components/layouts/app-shell";
import OnboardingModal from "@/components/onboarding-modal";
import type { Organization } from "@/lib/db/organizations";
import { ArrowRight, Calendar, Grid3X3, Search, Sparkles, Trash2 } from "lucide-react";
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
  owner_id?: string;
};

type DashboardEvent = {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  all_day: boolean;
  event_type: "event" | "reminder" | "task";
  workspace_id?: string;
  note_id?: string;
  workspaces?: { owner_name: string };
};

type Folder = {
  id: string;
  name: string;
  color: string;
};

type UserSession = {
  userId: string;
  role: "founder" | "intern";
  ownerName: string;
  organizations: Organization[];
  invitation_code?: string;
};

const getColorClass = (color?: string) => {
  switch (color) {
    case "red":
      return "bg-red-200";
    case "blue":
      return "bg-blue-200";
    case "green":
      return "bg-green-200";
    case "yellow":
      return "bg-yellow-200";
    case "purple":
      return "bg-purple-200";
    case "pink":
      return "bg-pink-200";
    case "orange":
      return "bg-orange-200";
    case "teal":
      return "bg-teal-200";
    case "indigo":
      return "bg-indigo-200";
    case "cyan":
      return "bg-cyan-200";
    default:
      return "bg-stone-300";
  }
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgSlug = searchParams.get("org");

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewDensity, setViewDensity] = useState<2 | 3 | 4>(2);
  const [sortBy, setSortBy] = useState<"name" | "date">("name");
  const [events, setEvents] = useState<DashboardEvent[]>([]);

  async function checkSession() {
    try {
      const res = await fetch(`/api/auth/session${orgSlug ? `?org=${orgSlug}` : ""}`);
      if (!res.ok) {
        router.push(`/login${orgSlug ? `?org=${orgSlug}` : ""}`);
        return;
      }

      const data = await res.json();
      setSession(data.user);
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
        setWorkspaces(Array.isArray(data) ? data : []);
        setShowOnboarding((data || []).length === 0);
      }

      if (fRes.ok) {
        const data = await fRes.json();
        setFolders(Array.isArray(data) ? data : []);
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
    if (!session) return;

    const currentOrg =
      session.organizations?.find((o: Organization) => o.slug === orgSlug) || session.organizations?.[0];

    if (currentOrg) fetchWorkspaces(currentOrg.id);
  }, [session, orgSlug]);

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      try {
        const res = await fetch("/api/calendar/organization");
        if (!res.ok) return;

        const data = (await res.json()) as DashboardEvent[];
        if (active) {
          setEvents(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load dashboard events:", err);
        if (active) setEvents([]);
      }
    }

    loadEvents();

    return () => {
      active = false;
    };
  }, []);

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
    if (!name || !session) return;

    try {
      setCreating(true);

      const currentOrg =
        session.organizations?.find((o: Organization) => o.slug === orgSlug) || session.organizations?.[0];
      if (!currentOrg) {
        alert("No organization found");
        return;
      }

      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerName: name, role: session.role, ownerId: currentOrg.id }),
      });

      if (res.ok) {
        await fetchWorkspaces(currentOrg.id);
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
          if (currentOrg) await fetchWorkspaces(currentOrg.id);
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

  let filteredWorkspaces = workspaces;
  if (searchQuery) {
    filteredWorkspaces = filteredWorkspaces.filter((ws) =>
      ws.owner_name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }

  filteredWorkspaces = [...filteredWorkspaces].sort((a, b) => {
    if (sortBy === "name") {
      return a.owner_name.localeCompare(b.owner_name);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const folderMap = new Map(folders.map((folder) => [folder.id, folder.name]));
  const upcomingEvents = [...events]
    .filter((event) => new Date(event.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5);

  return (
    <AppShell>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(253,224,71,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),_transparent_22%),linear-gradient(to_bottom,_rgba(0,0,0,0.02),_transparent_38%)]" />
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-foreground/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-12 space-y-10">
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-black uppercase tracking-[0.35em] border-brutal bg-background">
                    <Sparkles className="h-3.5 w-3.5" />
                    Dashboard
                  </span>
                  <span className="px-3 py-1 text-xs font-black uppercase tracking-[0.3em] border-brutal bg-background">
                    {session.role}
                  </span>
                  <span className="px-3 py-1 text-xs font-black uppercase tracking-[0.3em] border-brutal bg-accent text-accent-foreground">
                    {session.ownerName}
                  </span>
                  {session.role === "founder" && session.organizations[0]?.invitation_code && (
                    <span className="px-3 py-1 text-xs font-black uppercase tracking-[0.25em] border-brutal bg-foreground text-background">
                      Invite: {session.organizations[0].invitation_code}
                    </span>
                  )}
                </div>
                <div className="text-sm font-black uppercase tracking-[0.35em] opacity-60">
                  Search workspaces and jump back in
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleCreateWorkspace()}
                  disabled={creating}
                  className="px-6 py-3 text-sm font-black uppercase border-brutal hover-brutal bg-accent text-accent-foreground disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create workspace"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const name = prompt("Folder Name:");
                    if (!name) return;
                    const color = prompt("Color (red, blue, green, etc):") || "stone";

                    const currentOrg =
                      session.organizations?.find((o: Organization) => o.slug === orgSlug) ||
                      session.organizations?.[0];
                    if (!currentOrg) return;

                    await fetch("/api/folders", {
                      method: "POST",
                      body: JSON.stringify({ name, orgId: currentOrg.id, color }),
                    });
                    fetchWorkspaces(currentOrg.id);
                  }}
                  className="px-6 py-3 text-sm font-black uppercase border-brutal hover-brutal bg-background"
                >
                  New folder
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-6 py-3 text-sm font-black uppercase border-brutal hover-brutal bg-background"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex-1 space-y-3">
                <label htmlFor="workspace-search" className="text-sm font-black uppercase tracking-[0.35em]">
                  Search workspaces
                </label>
                <div className="flex items-center gap-3 border-brutal bg-background px-4 py-4 shadow-brutal">
                  <Search className="h-4 w-4 shrink-0 opacity-60" />
                  <input
                    id="workspace-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by workspace name..."
                    className="w-full bg-transparent text-base md:text-lg font-bold uppercase placeholder:text-muted-foreground placeholder:font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-3">
                  <label htmlFor="workspace-sort" className="text-sm font-black uppercase tracking-[0.35em] block">
                    Sort
                  </label>
                  <select
                    id="workspace-sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "name" | "date")}
                    className="border-brutal px-4 py-4 text-sm font-black uppercase bg-background focus:outline-none focus:shadow-brutal"
                  >
                    <option value="name">Name</option>
                    <option value="date">Date</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <div className="text-sm font-black uppercase tracking-[0.35em] block">Density</div>
                  <div className="flex border-brutal overflow-hidden shadow-brutal">
                    {[2, 3, 4].map((cols) => (
                      <button
                        key={cols}
                        type="button"
                        onClick={() => setViewDensity(cols as 2 | 3 | 4)}
                        className={`px-4 py-4 text-sm font-black uppercase transition-colors ${
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

            {searchQuery && (
              <div className="text-sm font-bold uppercase opacity-70">
                Showing {filteredWorkspaces.length} of {workspaces.length} workspaces
              </div>
            )}
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Link
              href="/dashboard/tasks"
              className="group border-brutal-thick shadow-brutal bg-card p-5 md:p-6 flex items-center justify-between gap-4 transition-all hover:-translate-y-1 hover:shadow-brutal-xl"
            >
              <div className="space-y-1">
                <div className="text-xs font-black uppercase tracking-[0.35em] opacity-60">Tasks</div>
                <div className="text-2xl font-black uppercase leading-none">My Tasks</div>
                <p className="text-sm font-bold uppercase opacity-70">Jump straight to the task board.</p>
              </div>
              <div className="inline-flex h-12 w-12 items-center justify-center border-brutal bg-accent text-accent-foreground group-hover:translate-x-1 transition-transform">
                <ArrowRight className="h-5 w-5" />
              </div>
            </Link>

            <Link
              href="/calendar"
              className="group border-brutal-thick shadow-brutal bg-card p-5 md:p-6 flex items-center justify-between gap-4 transition-all hover:-translate-y-1 hover:shadow-brutal-xl"
            >
              <div className="space-y-1">
                <div className="text-xs font-black uppercase tracking-[0.35em] opacity-60">Calendar</div>
                <div className="text-2xl font-black uppercase leading-none">Upcoming events</div>
                <p className="text-sm font-bold uppercase opacity-70">
                  {upcomingEvents.length} upcoming event{upcomingEvents.length === 1 ? "" : "s"} ready to view.
                </p>
              </div>
              <div className="inline-flex h-12 w-12 items-center justify-center border-brutal bg-background group-hover:translate-x-1 transition-transform">
                <Calendar className="h-5 w-5" />
              </div>
            </Link>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="text-xs font-black uppercase tracking-[0.35em] opacity-60">Workspace library</div>
              <div className="text-sm font-bold uppercase opacity-60">
                {filteredWorkspaces.length} visible of {workspaces.length}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {["alpha", "beta", "gamma", "delta"].map((key) => (
                  <div
                    key={`workspace-skeleton-${key}`}
                    className="border-brutal-thick bg-card p-8 space-y-6 animate-pulse"
                  >
                    <div className="h-4 w-28 bg-muted" />
                    <div className="h-10 w-4/5 bg-muted" />
                    <div className="h-4 w-full bg-muted" />
                    <div className="h-4 w-3/4 bg-muted" />
                    <div className="h-12 w-full bg-muted" />
                  </div>
                ))}
              </div>
            ) : filteredWorkspaces.length === 0 ? (
              <div className="border-brutal-thick shadow-brutal-xl bg-card p-10 md:p-14 relative overflow-hidden">
                <div className="absolute -right-10 top-10 h-32 w-32 rounded-full bg-accent/20 blur-3xl" />
                <div className="relative max-w-2xl space-y-6">
                  <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-black uppercase tracking-[0.3em] border-brutal bg-muted">
                    <Grid3X3 className="h-3.5 w-3.5" />
                    Empty workspace library
                  </span>
                  <h3 className="text-4xl md:text-6xl font-black uppercase leading-none">
                    {searchQuery.trim() ? "No matching workspaces" : "No workspaces yet"}
                  </h3>
                  <p className="max-w-xl text-base md:text-lg font-bold uppercase leading-7 opacity-75">
                    {searchQuery.trim()
                      ? "Try a different search term or clear the filter to see everything again."
                      : "Create your first workspace, then turn it into a habit by adding notes and folder structure."}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button
                      type="button"
                      onClick={() => handleCreateWorkspace()}
                      disabled={creating}
                      className="px-8 py-4 text-base font-black uppercase border-brutal hover-brutal bg-accent text-accent-foreground disabled:opacity-50"
                    >
                      {creating ? "Creating..." : "Create workspace"}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const name = prompt("Folder Name:");
                        if (!name) return;
                        const color = prompt("Color (red, blue, green, etc):") || "stone";

                        const currentOrg =
                          session.organizations?.find((o: Organization) => o.slug === orgSlug) ||
                          session.organizations?.[0];
                        if (!currentOrg) return;

                        await fetch("/api/folders", {
                          method: "POST",
                          body: JSON.stringify({ name, orgId: currentOrg.id, color }),
                        });
                        fetchWorkspaces(currentOrg.id);
                      }}
                      className="px-8 py-4 text-base font-black uppercase border-brutal hover-brutal bg-background"
                    >
                      New folder
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 ${viewDensity === 2 ? "md:grid-cols-2" : viewDensity === 3 ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"} gap-6`}
              >
                {filteredWorkspaces.map((ws) => {
                  const isRestricted = session.role === "intern" && ws.role === "founder";
                  const folderName = ws.folder_id ? folderMap.get(ws.folder_id) : null;

                  return (
                    <article
                      key={ws.id}
                      className="group relative overflow-hidden border-brutal-thick bg-card shadow-brutal transition-all hover:-translate-y-1 hover:shadow-brutal-xl"
                    >
                      <div className={`absolute top-0 left-0 h-full w-2 ${getColorClass(ws.color)}`} />
                      <div className="p-6 md:p-8 pl-8 md:pl-10 space-y-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              {isRestricted && <span className="text-foreground">Lock</span>}
                              <h3 className="text-2xl md:text-3xl font-black uppercase leading-tight">
                                {ws.owner_name}
                              </h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-3 py-1 text-[11px] font-black uppercase tracking-[0.25em] border-brutal ${
                                  ws.role === "founder"
                                    ? "bg-accent text-accent-foreground"
                                    : "bg-foreground text-background"
                                }`}
                              >
                                {ws.role}
                              </span>
                              <span className="px-3 py-1 text-[11px] font-black uppercase tracking-[0.25em] border-brutal bg-background">
                                {new Date(ws.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`h-3 w-3 rounded-full ${getColorClass(ws.color)} ring-2 ring-foreground/20`}
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.25em] opacity-60">
                          <span>ID: {ws.id.slice(0, 8)}...</span>
                          {folderName && <span>Folder: {folderName}</span>}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <select
                            className="bg-background border-brutal-sm text-xs font-bold uppercase px-3 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            defaultValue={ws.folder_id || ""}
                            disabled={session.role !== "founder"}
                            title={session.role !== "founder" ? "Only the founder can organize this workspace." : ""}
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
                            <option value="">No folder</option>
                            {folders.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name}
                              </option>
                            ))}
                          </select>

                          <select
                            className="bg-background border-brutal-sm text-xs font-bold uppercase px-3 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            defaultValue={ws.color || "stone"}
                            disabled={session.role !== "founder"}
                            title={session.role !== "founder" ? "Only the founder can organize this workspace." : ""}
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
                            <option value="stone">Gray</option>
                            <option value="red">Red</option>
                            <option value="blue">Blue</option>
                            <option value="green">Green</option>
                            <option value="yellow">Yellow</option>
                            <option value="purple">Purple</option>
                            <option value="pink">Pink</option>
                            <option value="orange">Orange</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-4 border-t-4 border-foreground">
                          <Link
                            href={isRestricted ? "#" : `/workspace/${ws.id}`}
                            onClick={(e) => {
                              if (isRestricted) {
                                e.preventDefault();
                                alert("You do not have permission to enter a founder-restricted workspace.");
                              }
                            }}
                            className="inline-flex items-center gap-2 text-sm font-black uppercase transition-transform group-hover:translate-x-1"
                          >
                            Open workspace
                            <ArrowRight className="h-4 w-4" />
                          </Link>

                          {!isRestricted && (session.role === "founder" || session.userId === ws.owner_id) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteWorkspace(ws.id);
                              }}
                              className="inline-flex items-center gap-2 text-xs font-black uppercase text-destructive hover:underline"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      <OnboardingModal isOpen={showOnboarding} onSubmit={handleCreateWorkspace} />
    </AppShell>
  );
}
