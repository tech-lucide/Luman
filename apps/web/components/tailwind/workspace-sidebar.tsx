"use client";

import { createSupabaseClient } from "@/lib/supabase/client";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Plus,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Home,
  ArrowLeft,
  Calendar,
  CheckSquare,
  Layers,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
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

interface WorkspaceSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function WorkspaceSidebar({ isCollapsed = false, onToggleCollapse }: WorkspaceSidebarProps) {
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
  const [user, setUser] = useState<any>(null);
  const [isWorkspacesExpanded, setIsWorkspacesExpanded] = useState(false);
  const [activeNoteStats, setActiveNoteStats] = useState<{
    headings: { text: string; level: number }[];
    wordCount: number;
    charCount: number;
    noteId: string;
  } | null>(null);

  useEffect(() => {
    setActiveNoteStats(null);
  }, [noteId]);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.noteId === noteId) {
        setActiveNoteStats(customEvent.detail);
      }
    };
    window.addEventListener("luman-note-editor-update", handleUpdate);
    return () => {
      window.removeEventListener("luman-note-editor-update", handleUpdate);
    };
  }, [noteId]);


  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createSupabaseClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          console.error("Sidebar: No authenticated user found", userError);
          return;
        }
        setUser(userData.user);

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

  const getWorkspaceCardStyle = (color?: string, isActive?: boolean) => {
    if (isActive) {
      return "bg-[#FBBF24] text-black border-black dark:border-stone-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]";
    }

    let hoverStyles = "";
    switch (color) {
      case "red":
        hoverStyles = "hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-500 hover:shadow-[3px_3px_0px_0px_rgba(239,68,68,1)]";
        break;
      case "blue":
        hoverStyles = "hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-500 hover:shadow-[3px_3px_0px_0px_rgba(59,130,246,1)]";
        break;
      case "green":
        hoverStyles = "hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-500 hover:shadow-[3px_3px_0px_0px_rgba(16,185,129,1)]";
        break;
      case "yellow":
        hoverStyles = "hover:bg-yellow-50 dark:hover:bg-yellow-950/20 hover:border-yellow-500 hover:shadow-[3px_3px_0px_0px_rgba(245,158,11,1)]";
        break;
      case "purple":
        hoverStyles = "hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-500 hover:shadow-[3px_3px_0px_0px_rgba(139,92,246,1)]";
        break;
      case "pink":
        hoverStyles = "hover:bg-pink-50 dark:hover:bg-pink-950/20 hover:border-pink-500 hover:shadow-[3px_3px_0px_0px_rgba(236,72,153,1)]";
        break;
      case "orange":
        hoverStyles = "hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-500 hover:shadow-[3px_3px_0px_0px_rgba(249,115,22,1)]";
        break;
      case "teal":
        hoverStyles = "hover:bg-teal-50 dark:hover:bg-teal-950/20 hover:border-teal-500 hover:shadow-[3px_3px_0px_0px_rgba(20,184,166,1)]";
        break;
      default:
        hoverStyles = "hover:bg-stone-50 dark:hover:bg-zinc-800 hover:border-stone-400 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]";
    }
    return `bg-white dark:bg-zinc-900 text-stone-800 dark:text-stone-100 border-black dark:border-stone-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] ${hoverStyles}`;
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
  const settingsHref = orgSlug ? `/settings?org=${orgSlug}` : "/settings";

  // Shared Collapse Button
  const renderCollapseButton = () => (
    <div className={cn("p-4 flex items-center shrink-0 border-b-[3px] border-black dark:border-stone-100", isCollapsed ? "justify-center" : "justify-between")}>
      {!isCollapsed && <span className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 select-none">Navigation</span>}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="p-1.5 border-[3px] border-black dark:border-stone-100 hover:bg-stone-50 dark:hover:bg-zinc-800 rounded-lg transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[1.5px] hover:translate-y-[1.5px] bg-white dark:bg-zinc-900 text-black dark:text-stone-100"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <PanelLeftOpen className="h-4.5 w-4.5" /> : <PanelLeftClose className="h-4.5 w-4.5" />}
      </button>
    </div>
  );

  if (isWorkspaceView && workspaceId) {
    return (
      <aside className="w-full h-full min-h-0 border-none bg-transparent flex flex-col overflow-hidden relative">
        {/* Technical dot-grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-60 pointer-events-none z-0" />

        {renderCollapseButton()}

        {/* Collapsed Workspace View */}
        {isCollapsed ? (
          <div className="relative z-10 flex-1 overflow-y-auto scrollbar-none py-6 flex flex-col items-center gap-6">
            {/* Back Button */}
            <div className="relative group">
              <Link
                href={dashboardHref}
                className="flex items-center justify-center h-11 w-11 border-[3px] border-black dark:border-stone-100 bg-white dark:bg-zinc-900 text-black dark:text-stone-100 rounded-full shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[1.5px] hover:translate-y-[1.5px] transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-black text-[#FBBF24] border-2 border-black dark:border-stone-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md whitespace-nowrap shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                ALL WORKSPACES
              </div>
            </div>

            {/* Quick Actions (Events / Tasks) */}
            <div className="flex flex-col gap-3">
              <div className="relative group">
                <Link
                  href="/calendar"
                  className="flex items-center justify-center h-11 w-11 border-[3px] border-black dark:border-stone-100 bg-white dark:bg-zinc-900 text-black dark:text-stone-100 rounded-full shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[1.5px] hover:translate-y-[1.5px] transition-all"
                >
                  <Calendar className="h-5 w-5" />
                </Link>
                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-black text-[#FBBF24] border-2 border-black dark:border-stone-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md whitespace-nowrap shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                  ALL EVENTS
                </div>
              </div>
              <div className="relative group">
                <Link
                  href="/dashboard/tasks"
                  className="flex items-center justify-center h-11 w-11 border-[3px] border-black dark:border-stone-100 bg-white dark:bg-zinc-900 text-black dark:text-stone-100 rounded-full shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[1.5px] hover:translate-y-[1.5px] transition-all"
                >
                  <CheckSquare className="h-5 w-5" />
                </Link>
                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-black text-[#FBBF24] border-2 border-black dark:border-stone-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md whitespace-nowrap shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,1)]">
                  MY TASKS
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="w-10 h-[2px] bg-stone-300 dark:bg-stone-700" />

            {/* Current Workspace Icon */}
            <div className="relative group">
              <div className={cn("flex items-center justify-center h-11 w-11 border-[3px] border-black dark:border-stone-100 rounded-full shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,1)] font-black text-black select-none", getColorClass(currentWorkspace?.color))}>
                {currentWorkspace?.owner_name?.[0].toUpperCase() || "W"}
              </div>
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-black text-[#FBBF24] border-2 border-black dark:border-stone-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md whitespace-nowrap shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                {currentWorkspace?.owner_name || "Workspace"}
              </div>
            </div>

            {/* Create Note Action */}
            <div className="relative group">
              <Link
                href={`/workspace/${workspaceId}/new`}
                className="flex items-center justify-center h-9 w-9 border-[3px] border-black rounded-full hover-brutal bg-white text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
              >
                <Plus className="h-4.5 w-4.5" />
              </Link>
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-black text-[#FBBF24] border-2 border-black dark:border-stone-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md whitespace-nowrap shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                NEW NOTE
              </div>
            </div>

            {/* Notes List (Icons only) */}
            <div className="flex flex-col gap-3.5 w-full items-center">
              {notes.map((note) => {
                const isActive = noteId === note.id;
                return (
                  <div key={note.id} className="relative group">
                    <Link
                      href={`/workspace/${workspaceId}/note/${note.id}`}
                      className={cn(
                        "flex items-center justify-center h-10 w-10 border-[3px] border-black dark:border-stone-100 rounded-full transition-all hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]",
                        isActive ? "bg-[#FBBF24] text-black" : "bg-white dark:bg-zinc-900 text-stone-800 dark:text-stone-100"
                      )}
                    >
                      <FileText className="h-4.5 w-4.5 shrink-0" />
                    </Link>
                    <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-black text-[#FBBF24] border-2 border-black dark:border-stone-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md whitespace-nowrap shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                      {note.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Expanded Workspace View */
          <>
            <div className="relative z-10 shrink-0 p-6 pb-4 space-y-4 border-b-4 border-foreground bg-[#FDFBF7] dark:bg-zinc-950">
              <Link
                href={dashboardHref}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase border-[3px] border-black dark:border-stone-100 rounded-full hover-brutal bg-white dark:bg-zinc-900 text-black dark:text-stone-100 w-full justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:shadow-none"
              >
                <span>&larr; All workspaces</span>
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/calendar"
                  className="flex items-center justify-center gap-1.5 px-2 py-2.5 text-[9px] sm:text-[10px] font-black uppercase border-[3px] border-black dark:border-stone-100 rounded-full bg-white dark:bg-zinc-900 text-black dark:text-stone-100 hover:bg-accent transition-transform hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:shadow-none"
                >
                  ALL EVENTS
                </Link>
                <Link
                  href="/dashboard/tasks"
                  className="flex items-center justify-center gap-1.5 px-2 py-2.5 text-[9px] sm:text-[10px] font-black uppercase border-[3px] border-black dark:border-stone-100 rounded-full bg-white dark:bg-zinc-900 text-black dark:text-stone-100 hover:bg-accent transition-transform hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:shadow-none"
                >
                  MY TASKS
                </Link>
              </div>

              <div className="inline-flex max-w-full items-center px-4 py-2 text-xs font-black uppercase tracking-widest border-[3px] border-black dark:border-stone-100 bg-[#FBBF24] text-black w-full justify-center rounded-full shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,1)] select-none">
                <span className="truncate">{currentWorkspace?.owner_name || "Workspace"}</span>
              </div>
            </div>

            <div className="relative z-10 shrink-0 flex items-center justify-between px-6 py-4 bg-transparent">
              <span className="text-xs font-black uppercase tracking-[0.3em] opacity-70">Notes</span>
              <Link
                href={`/workspace/${workspaceId}/new`}
                className="inline-flex items-center justify-center h-9 w-9 border-[3px] border-black rounded-full hover-brutal bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
                aria-label="Create new note"
                title="Create new note"
              >
                <Plus className="h-5 w-5" />
              </Link>
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-4">
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
                        className={cn(
                          "flex items-center gap-3 px-5 py-3.5 text-xs font-black uppercase rounded-[16px] border-[3px] transition-all hover:-translate-y-0.5",
                          isActive
                            ? "bg-[#FBBF24] text-black border-black dark:border-stone-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] font-black"
                            : "bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:hover:bg-zinc-800 border-black dark:border-stone-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] text-stone-800 dark:text-stone-100 font-bold"
                        )}
                      >
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="truncate flex-1">{note.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Note-Specific Content (TOC, Stats, Actions) when editing a note */}
              {noteId && activeNoteStats && (
                <div className="mt-6 border-t-[3px] border-black dark:border-zinc-800 pt-6 space-y-6">
                  
                  {/* 1. Table of Contents */}
                  <div className="space-y-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 select-none">
                      Table of Contents
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                      {activeNoteStats.headings && activeNoteStats.headings.length > 0 ? (
                        activeNoteStats.headings.map((h, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              window.dispatchEvent(
                                new CustomEvent("luman-scroll-to-heading", { detail: { index: i } })
                              );
                            }}
                            style={{ paddingLeft: `${(h.level - 1) * 8}px` }}
                            className={cn(
                              "w-full text-left flex items-start gap-1.5 text-[11px] font-black uppercase truncate transition-all hover:translate-x-[2px] cursor-pointer",
                              h.level === 1
                                ? "text-stone-900 dark:text-stone-100"
                                : h.level === 2
                                ? "text-stone-600 dark:text-stone-400"
                                : "text-stone-450 dark:text-stone-500"
                            )}
                          >
                            <span className="text-[#FBBF24] shrink-0">•</span>
                            <span className="truncate hover:underline">{h.text}</span>
                          </button>
                        ))
                      ) : (
                        <div className="text-[9px] font-bold text-center uppercase text-stone-400 py-3 border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-xl">
                          No headers found
                        </div>
                      )}
                    </div>
                  </div>


                  {/* 3. Document Actions */}
                  <div className="space-y-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 select-none">
                      Actions
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("luman-trigger-html-export"));
                        }}
                        className="flex-1 py-2 text-center text-[9px] font-black uppercase border-2 border-black dark:border-stone-100 bg-white dark:bg-zinc-950 hover:bg-stone-50 dark:hover:bg-zinc-800 rounded-xl shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-black dark:text-stone-100"
                      >
                        HTML Export
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("luman-trigger-text-export"));
                        }}
                        className="flex-1 py-2 text-center text-[9px] font-black uppercase border-2 border-black dark:border-stone-100 bg-white dark:bg-zinc-950 hover:bg-stone-50 dark:hover:bg-zinc-800 rounded-xl shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-black dark:text-stone-100"
                      >
                        Text Export
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </>
        )}

        {/* Sticky User Profile Control Panel at the bottom */}
        {user && (
          <div className="relative z-10 shrink-0 p-4 border-t-[3px] border-black dark:border-stone-100 mt-auto bg-transparent">
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-4 bg-transparent">
                {/* Settings Button */}
                <div className="relative group">
                  <Link
                    href={settingsHref}
                    className={cn(
                      "flex items-center justify-center h-11 w-11 border-[3px] border-black dark:border-stone-100 rounded-full shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[1.5px] hover:translate-y-[1.5px] transition-all",
                      pathname?.startsWith("/settings")
                        ? "bg-[#FBBF24] text-black"
                        : "bg-white dark:bg-zinc-900 text-black dark:text-stone-100"
                    )}
                  >
                    <Settings className="h-5 w-5" />
                  </Link>
                  <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-black text-[#FBBF24] border-2 border-black dark:border-stone-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md whitespace-nowrap shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                    SETTINGS
                  </div>
                </div>

                {/* Profile Circle */}
                <div className="relative group flex justify-center">
                  <div className="w-10 h-10 rounded-full bg-black dark:bg-stone-100 text-[#FBBF24] dark:text-black font-black flex items-center justify-center border-[3px] border-black dark:border-stone-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] select-none">
                    {user.email?.[0].toUpperCase() || "U"}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-[2px] border-black dark:border-stone-100 animate-pulse" />
                  </div>
                  <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-black text-[#FBBF24] border-2 border-black dark:border-stone-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md whitespace-nowrap shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                    {user.email}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Settings Link Row */}
                <Link
                  href={settingsHref}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3.5 text-xs font-black uppercase rounded-[16px] border-[3px] transition-all hover:-translate-y-0.5",
                    pathname?.startsWith("/settings")
                      ? "bg-[#FBBF24] text-black border-black dark:border-stone-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]"
                      : "bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:hover:bg-zinc-800 border-black dark:border-stone-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] text-stone-800 dark:text-stone-100"
                  )}
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">Settings</span>
                </Link>

                {/* Profile Box */}
                <div className="border-[3px] border-black dark:border-stone-100 rounded-[18px] p-3.5 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md text-black dark:text-stone-100 flex items-center gap-3.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                  <div className="w-10 h-10 rounded-full bg-black dark:bg-stone-100 text-[#FBBF24] dark:text-black font-black flex items-center justify-center border-[3px] border-black dark:border-stone-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] select-none">
                    {user.email?.[0].toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black uppercase text-stone-900 dark:text-stone-100 truncate tracking-wide select-none">
                      {user.email?.split("@")[0] || "User"}
                    </div>
                    <div className="text-[8px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest truncate select-none">
                      ACTIVE SESSION
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-[2px] border-black dark:border-stone-100 animate-pulse" />
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside className="w-full h-full min-h-0 border-none bg-transparent flex flex-col overflow-hidden relative">
      {/* Technical dot-grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-60 pointer-events-none z-0" />

      {renderCollapseButton()}

      {/* Collapsed Non-Workspace View */}
      {isCollapsed ? (
        <div className="relative z-10 flex-1 overflow-y-auto scrollbar-none py-6 flex flex-col items-center gap-6">
          {/* Dashboard Icon */}
          <div className="relative group">
            <Link
              href={dashboardHref}
              className="flex items-center justify-center h-11 w-11 border-[3px] border-black dark:border-stone-100 bg-[#FBBF24] text-black rounded-full shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[1.5px] hover:translate-y-[1.5px] transition-all"
            >
              <Home className="h-5 w-5" />
            </Link>
            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-black text-[#FBBF24] border-2 border-black dark:border-stone-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md whitespace-nowrap shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
              DASHBOARD
            </div>
          </div>

          {/* Quick Actions (Events / Tasks) */}
          <div className="flex flex-col gap-3">
            <div className="relative group">
              <Link
                href="/calendar"
                className="flex items-center justify-center h-11 w-11 border-[3px] border-black dark:border-stone-100 bg-white dark:bg-zinc-900 text-black dark:text-stone-100 rounded-full shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[1.5px] hover:translate-y-[1.5px] transition-all"
              >
                <Calendar className="h-5 w-5" />
              </Link>
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-black text-[#FBBF24] border-2 border-black dark:border-stone-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md whitespace-nowrap shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                ALL EVENTS
              </div>
            </div>
            <div className="relative group">
              <Link
                href="/dashboard/tasks"
                className="flex items-center justify-center h-11 w-11 border-[3px] border-black dark:border-stone-100 bg-white dark:bg-zinc-900 text-black dark:text-stone-100 rounded-full shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[1.5px] hover:translate-y-[1.5px] transition-all"
              >
                <CheckSquare className="h-5 w-5" />
              </Link>
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-black text-[#FBBF24] border-2 border-black dark:border-stone-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md whitespace-nowrap shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                MY TASKS
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="w-10 h-[2px] bg-stone-300 dark:bg-stone-700" />

          {/* Workspaces Collapsible Trigger Icon */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => setIsWorkspacesExpanded(!isWorkspacesExpanded)}
              className={cn(
                "flex items-center justify-center h-11 w-11 border-[3px] border-black dark:border-stone-100 rounded-full transition-all shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[1.5px] hover:translate-y-[1.5px]",
                isWorkspacesExpanded ? "bg-[#FBBF24] text-black" : "bg-white dark:bg-zinc-900 text-black dark:text-stone-100"
              )}
            >
              <Layers className="h-5 w-5" />
            </button>
            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-black text-[#FBBF24] border-2 border-black dark:border-stone-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md whitespace-nowrap shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
              {isWorkspacesExpanded ? "COLLAPSE WORKSPACES" : "EXPAND WORKSPACES"}
            </div>
          </div>

          {/* Workspaces Folders and Unfoldered Workspaces (rendered only if expanded) */}
          {isWorkspacesExpanded && (
            <div className="flex flex-col gap-4.5 w-full items-center pl-1.5 border-l-2 border-dashed border-stone-300 dark:border-stone-700 pt-2 transition-all duration-300">
              {folders.map((folder) => {
                const folderWorkspaces = workspaces.filter((w) => w.folder_id === folder.id);
                const isOpen = openFolders[folder.id];

                return (
                  <div key={folder.id} className="flex flex-col items-center gap-2">
                    <div className="relative group">
                      <button
                        type="button"
                        onClick={() => toggleFolder(folder.id)}
                        className={cn(
                          "flex items-center justify-center h-10 w-10 border-[3px] border-black dark:border-stone-100 rounded-full transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-900"
                        )}
                      >
                        <div className={cn("h-4.5 w-4.5 rounded-full border border-black dark:border-stone-100 flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]", getColorClass(folder.color))} />
                      </button>
                      <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-black text-[#FBBF24] border-2 border-black dark:border-stone-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md whitespace-nowrap shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                        {folder.name} ({folderWorkspaces.length})
                      </div>
                    </div>
                    {isOpen &&
                      folderWorkspaces.map((w) => (
                        <div key={w.id} className="relative group pl-1.5 border-l-2 border-dashed border-stone-300 dark:border-stone-700">
                          <Link
                            href={`/workspace/${w.id}`}
                            className={cn(
                              "flex items-center justify-center h-8.5 w-8.5 border-2 border-black dark:border-stone-100 rounded-full transition-all shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)]",
                              getWorkspaceCardStyle(w.color, workspaceId === w.id)
                            )}
                          >
                            <div className={cn("h-2.5 w-2.5 rounded-full border border-black", getColorClass(w.color))} />
                          </Link>
                          <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-black text-[#FBBF24] border-2 border-black dark:border-stone-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md whitespace-nowrap shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                            {w.owner_name}
                          </div>
                        </div>
                      ))}
                  </div>
                );
              })}

              {unfolderedWorkspaces.map((w) => {
                const isActive = workspaceId === w.id;
                return (
                  <div key={w.id} className="relative group">
                    <Link
                      href={`/workspace/${w.id}`}
                      className={cn(
                        "flex items-center justify-center h-10 w-10 border-[3px] border-black dark:border-stone-100 rounded-full transition-all hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]",
                        getWorkspaceCardStyle(w.color, isActive)
                      )}
                    >
                      <div className={cn("h-3.5 w-3.5 rounded-full border border-black dark:border-stone-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]", getColorClass(w.color))} />
                    </Link>
                    <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-black text-[#FBBF24] border-2 border-black dark:border-stone-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md whitespace-nowrap shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                      {w.owner_name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Expanded Non-Workspace View */
        <div className="relative z-10 flex-1 overflow-y-auto scrollbar-none p-6 space-y-8 bg-transparent">
          <nav className="space-y-6 bg-transparent">
            <div className="space-y-3 bg-transparent">
              <Link
                href={`/dashboard?org=${orgSlug || ""}`}
                className="block px-4 py-3 font-black uppercase text-center text-lg bg-[#FBBF24] hover:bg-[#FBBF24]/90 border-[3px] border-black rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                DASHBOARD
              </Link>
              <div className="grid grid-cols-2 gap-2 bg-transparent">
                <Link
                  href="/calendar"
                  className="flex items-center justify-center gap-1.5 px-2 py-2.5 text-[9px] sm:text-[10px] font-black uppercase border-[3px] border-black dark:border-stone-100 rounded-full bg-white dark:bg-zinc-900 text-black dark:text-stone-100 hover:bg-accent transition-transform hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:shadow-none"
                >
                  ALL EVENTS
                </Link>
                <Link
                  href="/dashboard/tasks"
                  className="flex items-center justify-center gap-1.5 px-2 py-2.5 text-[9px] sm:text-[10px] font-black uppercase border-[3px] border-black dark:border-stone-100 rounded-full bg-white dark:bg-zinc-900 text-black dark:text-stone-100 hover:bg-accent transition-transform hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:shadow-none"
                >
                  MY TASKS
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="text-xs opacity-50 font-black px-4 tracking-widest animate-pulse">LOADING...</div>
            ) : (
              <div className="space-y-4 bg-transparent">
                <div className="flex items-center justify-between border-y-[3px] border-black/10 py-3 my-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400 flex items-center gap-1.5 select-none">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 border border-black animate-pulse" />
                    WORKSPACES
                  </span>
                  <span className="px-2.5 py-0.5 border-2 border-black rounded-full bg-[#FBBF24] text-[9px] font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] select-none">
                    {workspaces.length} ACTIVE
                  </span>
                </div>

                {folders.map((folder) => {
                  const folderWorkspaces = workspaces.filter((w) => w.folder_id === folder.id);
                  const isOpen = openFolders[folder.id];

                  return (
                    <div
                      key={folder.id}
                      className="border-2 border-black dark:border-stone-100 rounded-[18px] bg-white dark:bg-zinc-900 p-2 text-stone-900 dark:text-stone-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] transition-all space-y-1 relative"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => toggleFolder(folder.id)}
                          className="flex-1 flex items-center gap-2 px-2.5 py-2 text-xs font-black uppercase rounded-lg hover:bg-stone-50 dark:hover:bg-zinc-800 transition-all text-left"
                        >
                          <div className={cn("h-4.5 w-4.5 rounded-full border border-black dark:border-stone-100 flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]", getColorClass(folder.color))}>
                            {isOpen ? (
                              <ChevronDown className="h-3 w-3 text-black dark:text-stone-100" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-black dark:text-stone-100" />
                            )}
                          </div>
                          <span className={`${getFolderTextColor(folder.color)} font-black tracking-wide truncate`}>
                            {folder.name}
                          </span>
                          <span className="text-[9px] font-mono bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 px-1.5 py-0.5 rounded ml-auto text-stone-900 dark:text-stone-100">
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
                          className="p-2 text-stone-400 dark:text-stone-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          title="Delete Folder"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {isOpen && (
                        <div className="pl-2 pr-1 pb-1 space-y-1.5 border-t border-dashed border-stone-100 dark:border-zinc-800 pt-2 mt-1">
                          {folderWorkspaces.length === 0 ? (
                            <div className="px-3 py-2 text-[10px] font-bold text-center uppercase text-stone-400 dark:text-stone-500 bg-stone-50 dark:bg-zinc-800 rounded-lg border border-stone-200 dark:border-zinc-700 border-dashed">
                              Empty folder
                            </div>
                          ) : (
                            folderWorkspaces.map((w) => (
                              <Link
                                key={w.id}
                                href={`/workspace/${w.id}`}
                                className={cn(
                                  "flex items-center gap-2.5 px-4 py-3 text-xs font-black uppercase rounded-[12px] border-[3px] transition-all hover:-translate-y-0.5",
                                  getWorkspaceCardStyle(w.color, workspaceId === w.id)
                                )}
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
                      className={cn(
                        "flex items-center gap-3 px-5 py-3.5 text-xs font-black uppercase rounded-[16px] border-[3px] transition-all hover:-translate-y-0.5",
                        getWorkspaceCardStyle(w.color, workspaceId === w.id)
                      )}
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
      )}

      {/* Sticky User Profile Control Panel at the bottom */}
      {user && (
        <div className="relative z-10 shrink-0 p-4 border-t-[3px] border-black dark:border-stone-100 mt-auto bg-transparent">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-4 bg-transparent">
              {/* Settings Button */}
              <div className="relative group">
                <Link
                  href={settingsHref}
                  className={cn(
                    "flex items-center justify-center h-11 w-11 border-[3px] border-black dark:border-stone-100 rounded-full shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[1.5px] hover:translate-y-[1.5px] transition-all",
                    pathname?.startsWith("/settings")
                      ? "bg-[#FBBF24] text-black"
                      : "bg-white dark:bg-zinc-900 text-black dark:text-stone-100"
                  )}
                >
                  <Settings className="h-5 w-5" />
                </Link>
                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-black text-[#FBBF24] border-2 border-black dark:border-stone-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md whitespace-nowrap shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                  SETTINGS
                </div>
              </div>

              {/* Profile Circle */}
              <div className="relative group flex justify-center">
                <div className="w-10 h-10 rounded-full bg-black dark:bg-stone-100 text-[#FBBF24] dark:text-black font-black flex items-center justify-center border-[3px] border-black dark:border-stone-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] select-none">
                  {user.email?.[0].toUpperCase() || "U"}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-[2px] border-black dark:border-stone-100 animate-pulse" />
                </div>
                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-black text-[#FBBF24] border-2 border-black dark:border-stone-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md whitespace-nowrap shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                  {user.email}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Settings Link Row */}
              <Link
                href={settingsHref}
                className={cn(
                  "flex items-center gap-3 px-5 py-3.5 text-xs font-black uppercase rounded-[16px] border-[3px] transition-all hover:-translate-y-0.5",
                  pathname?.startsWith("/settings")
                    ? "bg-[#FBBF24] text-black border-black dark:border-stone-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]"
                    : "bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:hover:bg-zinc-800 border-black dark:border-stone-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] text-stone-800 dark:text-stone-100"
                )}
              >
                <Settings className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">Settings</span>
              </Link>

              {/* Profile Box */}
              <div className="border-[3px] border-black dark:border-stone-100 rounded-[18px] p-3.5 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md text-black dark:text-stone-100 flex items-center gap-3.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                <div className="w-10 h-10 rounded-full bg-black dark:bg-stone-100 text-[#FBBF24] dark:text-black font-black flex items-center justify-center border-[3px] border-black dark:border-stone-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] select-none">
                  {user.email?.[0].toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-black uppercase text-stone-900 dark:text-stone-100 truncate tracking-wide select-none">
                    {user.email?.split("@")[0] || "User"}
                  </div>
                  <div className="text-[8px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest truncate select-none">
                    ACTIVE SESSION
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-[2px] border-black dark:border-stone-100 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
