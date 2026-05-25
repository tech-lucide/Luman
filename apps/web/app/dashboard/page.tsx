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
      <div className="relative min-h-screen bg-[#FDFBF7] dark:bg-zinc-950 overflow-hidden">
        {/* Technical grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-70 pointer-events-none" />

        {/* Ambient Glows */}
        <div className="pointer-events-none absolute top-12 left-1/4 h-96 w-96 rounded-full bg-[#FBBF24]/10 blur-[120px] dark:opacity-20" />
        <div className="pointer-events-none absolute bottom-24 right-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px] dark:opacity-20" />

        <div className="relative mx-auto max-w-7xl px-8 py-12 md:py-16 space-y-12">
          {/* Header Banner */}
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-black uppercase tracking-[0.25em] border-[3px] border-black bg-[#FBBF24] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-full">
                    <Sparkles className="h-4 w-4" />
                    DASHBOARD
                  </span>
                  <span className="px-3.5 py-1.5 text-xs font-black uppercase tracking-widest border-[3px] border-black bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-full">
                    {session.role}
                  </span>
                  <span className="px-3.5 py-1.5 text-xs font-black uppercase tracking-widest border-[3px] border-black bg-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-full">
                    {session.ownerName}
                  </span>
                  {session.role === "founder" && session.organizations[0]?.invitation_code && (
                    <span className="px-3.5 py-1.5 text-xs font-black uppercase tracking-widest border-[3px] border-black bg-[#A7F3D0] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-full">
                      INVITE: {session.organizations[0].invitation_code}
                    </span>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wide text-black">
                  Welcome to Luman
                </h1>
                <div className="text-xs font-black uppercase tracking-[0.25em] text-stone-500">
                  Manage your team, notes, and workspaces beautifully.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleCreateWorkspace()}
                  disabled={creating}
                  className="px-6 py-3.5 text-sm font-black uppercase border-[3px] border-black rounded-full bg-[#FBBF24] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
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
                  className="px-6 py-3.5 text-sm font-black uppercase border-[3px] border-black rounded-full bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  New folder
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-6 py-3.5 text-sm font-black uppercase border-[3px] border-black rounded-full bg-stone-100 hover:bg-stone-200 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Redesigned Search & Sort bar */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between bg-white border-[3px] border-black p-6 rounded-[24px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mt-8">
              <div className="flex-1 flex items-center gap-3 bg-stone-50 border-[3px] border-black rounded-full px-5 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Search className="h-5 w-5 shrink-0 text-stone-500" />
                <input
                  id="workspace-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="FILTER BY WORKSPACE NAME..."
                  className="w-full bg-transparent text-sm font-bold uppercase placeholder:text-stone-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-4">
                <label htmlFor="workspace-sort" className="text-xs font-black uppercase tracking-widest text-stone-500">
                  SORT BY
                </label>
                <select
                  id="workspace-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "name" | "date")}
                  className="border-[3px] border-black rounded-full px-5 py-3 text-xs font-black uppercase bg-white cursor-pointer hover:bg-stone-50 focus:outline-none"
                >
                  <option value="name">NAME (A-Z)</option>
                  <option value="date">DATE CREATED</option>
                </select>
              </div>
            </div>

            {searchQuery && (
              <div className="text-xs font-black uppercase tracking-wider opacity-60 pl-2">
                Showing {filteredWorkspaces.length} of {workspaces.length} workspaces
              </div>
            )}
          </section>

          {/* Quick Action Widget Cards */}
          <section className="grid gap-6 md:grid-cols-2">
            <Link
              href="/dashboard/tasks"
              className="group relative overflow-hidden border-[3px] border-black rounded-[24px] bg-[#FBBF24] p-8 flex flex-col justify-between gap-6 transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-black"
            >
              <div className="space-y-2">
                <div className="inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-black text-[#FBBF24] rounded-full">
                  TASKS & BOARD
                </div>
                <h3 className="text-3xl font-black uppercase leading-none mt-2">
                  My Tasks
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-black/75">
                  Organize, assign, and track all your workflow tasks in one place.
                </p>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm font-black uppercase tracking-widest group-hover:underline">
                  GO TO BOARD &rarr;
                </span>
                <div className="inline-flex h-12 w-12 items-center justify-center border-[3px] border-black bg-white rounded-full text-black group-hover:translate-x-1 transition-transform shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>
            </Link>

            <Link
              href="/calendar"
              className="group relative overflow-hidden border-[3px] border-black rounded-[24px] bg-[#A7F3D0] p-8 flex flex-col justify-between gap-6 transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-black"
            >
              <div className="space-y-2">
                <div className="inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-black text-[#A7F3D0] rounded-full">
                  CALENDAR & SCHEDULE
                </div>
                <h3 className="text-3xl font-black uppercase leading-none mt-2">
                  Upcoming Events
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-black/75">
                  {upcomingEvents.length} active schedule event{upcomingEvents.length === 1 ? "" : "s"} waiting for your attention.
                </p>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm font-black uppercase tracking-widest group-hover:underline">
                  VIEW CALENDAR &rarr;
                </span>
                <div className="inline-flex h-12 w-12 items-center justify-center border-[3px] border-black bg-white rounded-full text-black group-hover:translate-x-1 transition-transform shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
            </Link>
          </section>

          {/* Workspaces Section */}
          <section className="space-y-6 pt-6">
            <div className="flex items-center justify-between gap-4 border-b-2 border-dashed border-stone-300 pb-4">
              <span className="text-xs font-black uppercase tracking-[0.35em] text-stone-500">
                WORKSPACE LIBRARY
              </span>
              <span className="text-xs font-black uppercase text-stone-500">
                {filteredWorkspaces.length} VISIBLE OF {workspaces.length}
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {["alpha", "beta", "gamma"].map((key) => (
                  <div
                    key={`workspace-skeleton-${key}`}
                    className="border-[3px] border-black bg-white rounded-[24px] p-8 space-y-6 animate-pulse shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="h-4 w-28 bg-stone-200 rounded" />
                    <div className="h-10 w-4/5 bg-stone-200 rounded" />
                    <div className="h-4 w-full bg-stone-200 rounded" />
                    <div className="h-12 w-full bg-stone-200 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredWorkspaces.length === 0 ? (
              <div className="border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-10 md:p-14 rounded-[24px] relative overflow-hidden">
                <div className="relative max-w-2xl space-y-6">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-black uppercase border-[3px] border-black bg-stone-100 rounded-full">
                    <Grid3X3 className="h-4 w-4" />
                    EMPTY WORKSPACE LIBRARY
                  </span>
                  <h3 className="text-4xl md:text-5xl font-black uppercase leading-none">
                    {searchQuery.trim() ? "No matching workspaces" : "No workspaces yet"}
                  </h3>
                  <p className="max-w-xl text-sm font-bold uppercase leading-relaxed text-stone-500">
                    {searchQuery.trim()
                      ? "Try a different search term or clear the filter to see everything again."
                      : "Create your first workspace, then turn it into a habit by adding notes and folder structure."}
                  </p>
                  <div className="flex flex-wrap gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => handleCreateWorkspace()}
                      disabled={creating}
                      className="px-8 py-4 text-sm font-black uppercase border-[3px] border-black rounded-full bg-[#FBBF24] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
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
                      className="px-8 py-4 text-sm font-black uppercase border-[3px] border-black rounded-full bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                    >
                      New folder
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredWorkspaces.map((ws) => {
                  const isRestricted = session.role === "intern" && ws.role === "founder";
                  const folderName = ws.folder_id ? folderMap.get(ws.folder_id) : null;

                  return (
                    <article
                      key={ws.id}
                      className="group relative overflow-hidden border-[3px] border-black bg-white rounded-[24px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all flex flex-col justify-between min-h-[300px] p-6 md:p-8"
                    >
                      <div className="space-y-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border-2 border-black rounded-full ${
                                  ws.role === "founder"
                                    ? "bg-[#FED7AA] text-black"
                                    : "bg-black text-white"
                                }`}
                              >
                                {ws.role}
                              </span>
                              {folderName && (
                                <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border-2 border-black rounded-full bg-stone-100 text-black">
                                  {folderName}
                                </span>
                              )}
                            </div>
                            <h3 className="text-2xl font-black uppercase leading-tight mt-2 text-stone-900 group-hover:text-[#FBBF24] transition-colors">
                              {ws.owner_name}
                            </h3>
                          </div>

                          <div
                            className={`h-6 w-6 rounded-full border-2 border-black ${getColorClass(ws.color)} shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                          />
                        </div>



                        <div className="grid gap-3 grid-cols-2">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Folder</label>
                            <select
                              className="bg-stone-50 border-2 border-black rounded-xl text-[11px] font-black uppercase px-2.5 py-2.5 cursor-pointer focus:outline-none focus:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
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
                              <option value="">None</option>
                              {folders.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Accent</label>
                            <select
                              className="bg-stone-50 border-2 border-black rounded-xl text-[11px] font-black uppercase px-2.5 py-2.5 cursor-pointer focus:outline-none focus:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
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
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-5 border-t-2 border-stone-200 mt-6">
                        <Link
                          href={isRestricted ? "#" : `/workspace/${ws.id}`}
                          onClick={(e) => {
                            if (isRestricted) {
                              e.preventDefault();
                              alert("You do not have permission to enter a founder-restricted workspace.");
                            }
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-black hover:underline"
                        >
                          OPEN WORKSPACE
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>

                        {!isRestricted && (session.role === "founder" || session.userId === ws.owner_id) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteWorkspace(ws.id);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-red-600 hover:text-red-700 hover:underline"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            DELETE
                          </button>
                        )}
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
