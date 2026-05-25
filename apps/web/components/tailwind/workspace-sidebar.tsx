"use client";

import { createSupabaseClient } from "@/lib/supabase/client";
import { ChevronDown, ChevronRight, FileText, Folder, FolderOpen, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type WorkspaceFolder = {
  id: string;
  name: string;
  color: string;
};

type Workspace = {
  id: string;
  owner_name: string;
  folder_id: string | null;
  color: string;
};

type Note = {
  id: string;
  title: string;
  created_at: string;
};

export function WorkspaceSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const workspaceId = typeof params?.workspaceId === "string" ? params.workspaceId : undefined;
  const noteId = typeof params?.noteId === "string" ? params.noteId : undefined;
  const orgSlug =
    searchParams.get("org") || (typeof window !== "undefined" ? sessionStorage.getItem("selected_org_slug") : null);
  const isWorkspaceView = Boolean(workspaceId) && pathname?.startsWith("/workspace/");

  const [folders, setFolders] = useState<WorkspaceFolder[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(false);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createSupabaseClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          console.error("Sidebar: No authenticated user found", userError);
          return;
        }

        let currentOrgId = null;
        if (orgSlug) {
          const { data: org } = await supabase.from("organizations").select("id").eq("slug", orgSlug).single();
          currentOrgId = org?.id;
        } else {
          const { data: membership } = await supabase
            .from("organization_members")
            .select("organization_id")
            .eq("user_id", userData.user.id)
            .limit(1)
            .single();
          currentOrgId = membership?.organization_id;
        }

        if (!currentOrgId) return;

        // Fetch Folders
        const { data: foldersData } = await supabase
          .from("workspace_folders")
          .select("*")
          .eq("organization_id", currentOrgId)
          .order("created_at", { ascending: true });
        if (foldersData) setFolders(foldersData);

        // Fetch Workspaces
        const { data: workspacesData } = await supabase
          .from("workspaces")
          .select("*")
          .or(`organization_id.eq.${currentOrgId},and(organization_id.is.null,owner_id.eq.${userData.user.id})`)
          .order("created_at", { ascending: true });
        if (workspacesData) setWorkspaces(workspacesData);
      } catch (err) {
        console.error("Sidebar fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Set up Realtime Subscription
    const supabase = createSupabaseClient();
    const channel = supabase
      .channel("sidebar-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "workspaces" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "workspace_folders" }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgSlug]);

  useEffect(() => {
    if (!isWorkspaceView || !workspaceId) {
      setNotes([]);
      setNotesLoading(false);
      return;
    }

    let active = true;

    async function fetchNotes() {
      try {
        setNotesLoading(true);
        const res = await fetch(`/api/notes?workspaceId=${workspaceId}`);
        const data = await res.json();

        if (active) {
          setNotes(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Sidebar notes fetch error:", err);
        if (active) setNotes([]);
      } finally {
        if (active) setNotesLoading(false);
      }
    }

    fetchNotes();

    return () => {
      active = false;
    };
  }, [isWorkspaceView, workspaceId]);

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // Group workspaces
  const unfolderedWorkspaces = workspaces.filter((w) => !w.folder_id);

  // Pastel color mapping for workspace dots
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

  // Pastel text colors for folder names
  const getFolderTextColor = (color?: string) => {
    switch (color) {
      case "red":
        return "text-red-600";
      case "blue":
        return "text-blue-600";
      case "green":
        return "text-green-600";
      case "yellow":
        return "text-yellow-700";
      case "purple":
        return "text-purple-600";
      case "pink":
        return "text-pink-600";
      case "orange":
        return "text-orange-600";
      case "teal":
        return "text-teal-600";
      case "indigo":
        return "text-indigo-600";
      case "cyan":
        return "text-cyan-600";
      default:
        return "";
    }
  };

  const currentWorkspace = workspaceId ? workspaces.find((w) => w.id === workspaceId) : null;
  const dashboardHref = orgSlug ? `/dashboard?org=${orgSlug}` : "/dashboard";

  if (isWorkspaceView && workspaceId) {
    return (
      <aside className="w-[300px] h-full min-h-0 border-r-4 border-foreground bg-background flex flex-col overflow-hidden">
        <div className="shrink-0 p-6 pb-4 space-y-4 border-b-4 border-foreground bg-[#FDFBF7]">
          <Link
            href={dashboardHref}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-black uppercase border-brutal hover-brutal bg-background w-full justify-center"
          >
            <span>&larr; All workspaces</span>
          </Link>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/calendar"
              className="flex items-center justify-center gap-1.5 px-2 py-2 text-[10px] sm:text-[11px] font-black uppercase border-brutal bg-background hover:bg-accent transition-transform hover:-translate-y-0.5"
            >
              ALL EVENTS
            </Link>
            <Link
              href="/dashboard/tasks"
              className="flex items-center justify-center gap-1.5 px-2 py-2 text-[10px] sm:text-[11px] font-black uppercase border-brutal bg-background hover:bg-accent transition-transform hover:-translate-y-0.5"
            >
              MY TASKS
            </Link>
          </div>

          <div className="inline-flex max-w-full items-center px-3 py-1.5 text-xs font-black uppercase tracking-widest border-brutal bg-accent text-accent-foreground w-full justify-center">
            <span className="truncate">{currentWorkspace?.owner_name || "Workspace"}</span>
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-between px-6 py-4">
          <span className="text-xs font-black uppercase tracking-[0.3em] opacity-70">Notes</span>
          <Link
            href={`/workspace/${workspaceId}/new`}
            className="inline-flex items-center justify-center h-9 w-9 border-brutal hover-brutal bg-background"
            aria-label="Create new note"
            title="Create new note"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {notesLoading ? (
            <div className="px-2 text-sm font-bold uppercase opacity-60">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="px-3 py-4 text-sm font-bold text-center uppercase opacity-60 border-brutal-sm bg-muted/30">
              No notes yet &mdash; hit + to create one
            </div>
          ) : (
            <div className="space-y-2">
              {notes.map((note) => {
                const isActive = noteId === note.id;

                return (
                  <Link
                    key={note.id}
                    href={`/workspace/${workspaceId}/note/${note.id}`}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-bold border-brutal-sm transition-all ${
                      isActive
                        ? "bg-accent text-accent-foreground shadow-brutal"
                        : "bg-background hover:bg-muted/40 hover:shadow-md"
                    }`}
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate flex-1">{note.title}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[300px] h-full min-h-0 border-r-4 border-foreground bg-[#FDFBF7] p-6 flex flex-col overflow-y-auto">
      <div className="space-y-8">
        <h2 className="text-2xl font-black uppercase border-b-4 border-foreground pb-4 break-words">
          {orgSlug || "MENU"}
        </h2>

        <nav className="space-y-6">
          <div className="space-y-3">
            <Link
              href={`/dashboard?org=${orgSlug || ""}`}
              className="block px-4 py-2.5 font-black uppercase text-center text-lg bg-[#FBBF24] hover:bg-[#FBBF24]/90 border-brutal shadow-brutal transition-transform hover:-translate-y-1"
            >
              DASHBOARD
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/calendar"
                className="flex items-center justify-center gap-1.5 px-2 py-2 text-[10px] sm:text-[11px] font-black uppercase border-brutal bg-background hover:bg-accent transition-transform hover:-translate-y-0.5"
              >
                ALL EVENTS
              </Link>
              <Link
                href="/dashboard/tasks"
                className="flex items-center justify-center gap-1.5 px-2 py-2 text-[10px] sm:text-[11px] font-black uppercase border-brutal bg-background hover:bg-accent transition-transform hover:-translate-y-0.5"
              >
                MY TASKS
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-xs opacity-50 font-black px-4 tracking-widest animate-pulse">LOADING...</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-3 pb-2 border-b-2 border-dashed border-foreground/30">
                <span className="text-xs font-black uppercase tracking-widest opacity-60">WORKSPACES</span>
              </div>

              {folders.map((folder) => {
                const folderWorkspaces = workspaces.filter((w) => w.folder_id === folder.id);
                const isOpen = openFolders[folder.id];

                return (
                  <div 
                    key={folder.id} 
                    className="border-2 border-black rounded-[18px] bg-white p-2 text-stone-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all space-y-1 relative"
                  >
                    {/* Folder row */}
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => toggleFolder(folder.id)}
                        className="flex-1 flex items-center gap-2 px-2.5 py-2 text-xs font-black uppercase rounded-lg hover:bg-stone-50 transition-all text-left"
                      >
                        <div className={`h-4.5 w-4.5 rounded-full border border-black ${getColorClass(folder.color)} flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
                          {isOpen ? (
                            <ChevronDown className="h-3 w-3 text-black" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-black" />
                          )}
                        </div>
                        <span className={`${getFolderTextColor(folder.color)} font-black tracking-wide truncate`}>
                          {folder.name}
                        </span>
                        <span className="text-[9px] font-mono bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded ml-auto">
                          {folderWorkspaces.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm("Delete this folder?")) return;

                          const supabase = createSupabaseClient();
                          const { error } = await supabase.from("workspace_folders").delete().eq("id", folder.id);
                          if (error) {
                            console.error("Error deleting folder:", error);
                            alert("Failed to delete folder. It might not be empty.");
                          }
                        }}
                        className="p-2 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Folder"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Folder sub-workspaces */}
                    {isOpen && (
                      <div className="pl-2 pr-1 pb-1 space-y-1.5 border-t border-dashed border-stone-100 pt-2 mt-1">
                        {folderWorkspaces.length === 0 ? (
                          <div className="px-3 py-2 text-[10px] font-bold text-center uppercase text-stone-400 bg-stone-50 rounded-lg border border-stone-200 border-dashed">
                            Empty folder
                          </div>
                        ) : (
                          folderWorkspaces.map((w) => (
                            <Link
                              key={w.id}
                              href={`/workspace/${w.id}`}
                              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-black uppercase rounded-lg border-2 border-black transition-all ${workspaceId === w.id ? "bg-[#FBBF24] text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]" : "bg-white hover:bg-stone-50 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-stone-700"}`}
                            >
                              <div
                                className={`h-2.5 w-2.5 rounded-full border border-black shrink-0 ${getColorClass(w.color)}`}
                              />
                              <span className="truncate flex-1">{w.owner_name}</span>
                            </Link>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="space-y-2 pt-2">
                {unfolderedWorkspaces.map((w) => (
                  <Link
                    key={w.id}
                    href={`/workspace/${w.id}`}
                    className={`flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase rounded-full border-2 border-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] ${workspaceId === w.id ? "bg-[#FBBF24] text-black" : "bg-white text-stone-800 hover:bg-stone-50"}`}
                  >
                    <div
                      className={`h-3 w-3 rounded-full border border-black shrink-0 ${getColorClass(w.color)} shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}
                    />
                    <span className="flex-1 truncate">{w.owner_name}</span>
                  </Link>
                ))}
              </div>

              {folders.length === 0 && workspaces.length === 0 && (
                <div className="px-4 text-[10px] font-black uppercase opacity-50 tracking-widest text-center py-4 border-2 border-dashed border-stone-200 rounded-[18px]">
                  No workspaces
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}
