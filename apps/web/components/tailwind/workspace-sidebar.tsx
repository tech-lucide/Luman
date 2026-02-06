"use client";

import { createSupabaseClient } from "@/lib/supabase/client";
import { ChevronDown, ChevronRight, Folder, FolderOpen } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
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

export function WorkspaceSidebar() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceId = params?.workspaceId as string;
  const orgSlug =
    searchParams.get("org") || (typeof window !== "undefined" ? sessionStorage.getItem("selected_org_slug") : null);

  const [folders, setFolders] = useState<WorkspaceFolder[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <aside className="w-[300px] border-r-4 border-foreground bg-background p-6 flex flex-col min-h-screen overflow-y-auto">
      <div className="space-y-8">
        <h2 className="text-2xl font-black uppercase border-b-4 border-foreground pb-4 break-words">
          {orgSlug || "MENU"}
        </h2>

        <nav className="space-y-6">
          <div className="space-y-2">
            <Link
              href={`/dashboard?org=${orgSlug || ""}`}
              className="block px-4 py-2 font-black uppercase text-lg hover:bg-accent border-brutal transition-transform hover:-translate-y-1"
            >
              DASHBOARD
            </Link>
          </div>

          {loading ? (
            <div className="text-sm opacity-50 font-bold px-4">LOADING...</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-4 pb-2 border-b-2 border-dashed border-foreground/30">
                <span className="text-xs font-black uppercase tracking-widest opacity-70">WORKSPACES</span>
              </div>

              {folders.map((folder) => {
                const folderWorkspaces = workspaces.filter((w) => w.folder_id === folder.id);
                const isOpen = openFolders[folder.id];

                return (
                  <div key={folder.id} className="space-y-1 mb-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleFolder(folder.id)}
                        className="flex-1 flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase hover:bg-accent/50 group transition-all border-brutal-sm bg-gradient-to-r from-background to-accent/10 hover:shadow-brutal"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4 transition-transform" />
                          ) : (
                            <ChevronRight className="h-4 w-4 transition-transform" />
                          )}
                          {isOpen ? <FolderOpen className="h-5 w-5" /> : <Folder className="h-5 w-5" />}
                          <span className={`${getFolderTextColor(folder.color)} font-black tracking-wide`}>
                            {folder.name}
                          </span>
                        </div>
                        <span className="text-xs opacity-50 font-mono bg-foreground/5 px-2 py-1 rounded border border-foreground/10">
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
                        className="p-3 border-brutal-sm hover:bg-red-200 text-red-600 transition-colors h-full flex items-center justify-center bg-background"
                        title="Delete Folder"
                      >
                        <svg
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    </div>

                    {isOpen && (
                      <div className="ml-6 pl-4 border-l-4 border-accent/30 space-y-1.5 py-2">
                        {folderWorkspaces.length === 0 ? (
                          <div className="px-4 py-3 text-xs opacity-50 italic border-brutal-sm bg-muted/30 text-center">
                            📂 Empty folder
                          </div>
                        ) : (
                          folderWorkspaces.map((w) => (
                            <Link
                              key={w.id}
                              href={`/workspace/${w.id}`}
                              className={`block px-4 py-2.5 text-sm font-bold uppercase truncate border-brutal-sm hover:bg-accent hover:-translate-x-1 transition-all group ${workspaceId === w.id ? "bg-accent text-accent-foreground shadow-brutal" : "bg-background hover:shadow-md"}`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`h-3 w-3 rounded-full ${getColorClass(w.color)} ring-2 ring-foreground/20 group-hover:ring-foreground/40 transition-all`}
                                />
                                <span className="flex-1">{w.owner_name}</span>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {unfolderedWorkspaces.map((w) => (
                <Link
                  key={w.id}
                  href={`/workspace/${w.id}`}
                  className={`block ml-0 px-4 py-2.5 text-sm font-bold uppercase truncate border-brutal-sm hover:bg-accent hover:-translate-x-1 transition-all group ${workspaceId === w.id ? "bg-accent text-accent-foreground shadow-brutal" : "bg-background hover:shadow-md"}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${getColorClass(w.color)} ring-2 ring-foreground/20 group-hover:ring-foreground/40 transition-all`}
                    />
                    <span className="flex-1">{w.owner_name}</span>
                  </div>
                </Link>
              ))}

              {folders.length === 0 && workspaces.length === 0 && (
                <div className="px-4 text-xs opacity-50 uppercase">NO WORKSPACES</div>
              )}
            </div>
          )}

          <div className="space-y-2 mt-8">
            <div className="text-xs font-black uppercase tracking-widest mb-4 opacity-50 px-4">ORGANIZATION</div>
            <Link
              href="/calendar"
              className="block px-4 py-2 text-sm font-black uppercase border-brutal hover-brutal bg-background"
            >
              ALL EVENTS
            </Link>
            <Link
              href="/dashboard/tasks"
              className="block px-4 py-2 text-sm font-black uppercase border-brutal hover-brutal bg-background"
            >
              MY TASKS
            </Link>
          </div>
        </nav>
      </div>
    </aside>
  );
}
