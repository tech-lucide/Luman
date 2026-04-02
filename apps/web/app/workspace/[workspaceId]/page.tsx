"use client";

import AppShell from "@/components/layouts/app-shell";
import { NoteModal } from "@/components/note-modal";
import { createSupabaseClient } from "@/lib/supabase/client";
import { ArrowRight, Clock3, FileText, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Note = {
  id: string;
  title: string;
  created_at: string;
  tags?: string[];
};

type Workspace = {
  owner_name: string;
  color?: string | null;
};

export default function WorkspacePage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;

  const [notes, setNotes] = useState<Note[]>([]);
  const [_loading, setLoading] = useState(true);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      try {
        const supabase = createSupabaseClient();
        const [notesRes, workspaceRes] = await Promise.all([
          fetch(`/api/notes?workspaceId=${workspaceId}`),
          supabase.from("workspaces").select("owner_name, color").eq("id", workspaceId).single(),
        ]);

        const notesData = await notesRes.json();

        if (!active) return;

        setNotes(Array.isArray(notesData) ? notesData : []);
        setWorkspace(workspaceRes.data ?? null);
      } catch (err) {
        console.error("Failed to load workspace notes:", err);
        if (active) setNotes([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadWorkspace();

    return () => {
      active = false;
    };
  }, [workspaceId]);

  const filteredNotes = notes.filter((note) => {
    if (!searchQuery.trim()) return true;
    const haystack = `${note.title} ${(note.tags || []).join(" ")}`.toLowerCase();
    return haystack.includes(searchQuery.toLowerCase());
  });

  const noteCount = notes.length;
  const latestNote = notes[0];
  const workspaceName = workspace?.owner_name || "Workspace";
  const workspaceTone = workspace?.color || "yellow";

  return (
    <AppShell>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(253,224,71,0.22),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_24%),linear-gradient(to_bottom_right,_rgba(17,17,17,0.03),_transparent_40%)]" />
        <div className="pointer-events-none absolute -top-32 right-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-foreground/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-12">
          <section className="border-brutal-thick shadow-brutal-xl bg-card overflow-hidden">
            <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
              <div className="p-8 md:p-10 lg:p-12 space-y-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-black uppercase tracking-[0.3em] border-brutal bg-background">
                    <Sparkles className="h-3.5 w-3.5" />
                    Workspace Notes
                  </span>
                  <span
                    className={`px-3 py-1 text-xs font-black uppercase tracking-widest border-brutal ${
                      workspaceTone === "yellow" ? "bg-accent text-accent-foreground" : "bg-background"
                    }`}
                  >
                    {workspaceName}
                  </span>
                </div>

                <div className="space-y-4">
                  <h1 className="text-5xl md:text-7xl font-black uppercase leading-[0.9] tracking-tight">Notes</h1>
                  <p className="max-w-2xl text-base md:text-lg font-semibold uppercase leading-7 opacity-75">
                    Build, sort, and jump between notes in this workspace without losing the big picture.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => setIsNoteModalOpen(true)}
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 text-base md:text-lg font-black uppercase border-brutal hover-brutal bg-accent text-accent-foreground"
                  >
                    <Plus className="h-5 w-5" />
                    New note
                  </button>

                  <div className="flex-1 min-w-0 border-brutal bg-background px-4 py-3 flex items-center gap-3">
                    <Search className="h-4 w-4 shrink-0 opacity-60" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search titles or tags..."
                      className="w-full bg-transparent text-sm md:text-base font-bold uppercase placeholder:font-bold placeholder:uppercase focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t-4 lg:border-t-0 lg:border-l-4 border-foreground bg-muted/30 p-8 md:p-10 flex flex-col justify-between gap-8">
                <div className="space-y-4">
                  <div className="text-xs font-black uppercase tracking-[0.35em] opacity-60">Snapshot</div>
                  <div className="space-y-4">
                    <div className="border-brutal bg-background p-5 shadow-brutal">
                      <div className="text-4xl font-black uppercase leading-none">{noteCount}</div>
                      <div className="mt-2 text-sm font-bold uppercase opacity-70">notes in this workspace</div>
                    </div>
                    <div className="border-brutal bg-background p-5 shadow-brutal">
                      <div className="flex items-center gap-2 text-sm font-black uppercase">
                        <Clock3 className="h-4 w-4" />
                        Latest note
                      </div>
                      <div className="mt-3 text-xl font-black uppercase leading-tight line-clamp-2">
                        {latestNote?.title || "No notes yet"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-brutal bg-accent text-accent-foreground p-5 shadow-brutal">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-black uppercase tracking-widest">Fast path</div>
                      <p className="mt-2 text-sm font-bold uppercase leading-6">
                        Create a note, add tags later, and keep moving.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm font-black uppercase tracking-widest opacity-70">
              Showing {filteredNotes.length} of {notes.length} notes
            </div>
            <button
              type="button"
              onClick={() => setIsNoteModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-black uppercase border-brutal hover-brutal bg-background"
            >
              <Plus className="h-4 w-4" />
              New note
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredNotes.map((note, index) => (
              <div
                key={note.id}
                className="group border-brutal-thick shadow-brutal bg-card p-6 md:p-8 relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-brutal-xl"
              >
                <div className="absolute inset-x-0 top-0 h-2 bg-accent" />
                <div className="absolute -right-10 top-10 h-24 w-24 rounded-full bg-accent/15 blur-2xl transition-opacity group-hover:opacity-100 opacity-70" />
                <Link href={`/workspace/${workspaceId}/note/${note.id}`} className="block">
                  <div className="space-y-5 relative">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-[0.35em] border-brutal bg-background">
                        <FileText className="h-3.5 w-3.5" />
                        Note {String(index + 1).padStart(2, "0")}
                      </span>
                      {note.tags && note.tags.length > 0 && (
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">
                          {note.tags.length} tags
                        </span>
                      )}
                    </div>

                    <div className="text-2xl md:text-3xl font-black uppercase leading-tight line-clamp-3">
                      {note.title}
                    </div>

                    {note.tags && note.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {note.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 text-[11px] font-black uppercase border-brutal-sm bg-muted/50"
                          >
                            {tag}
                          </span>
                        ))}
                        {note.tags.length > 4 && (
                          <span className="px-3 py-1 text-[11px] font-black uppercase border-brutal-sm bg-background">
                            +{note.tags.length - 4}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm font-bold uppercase opacity-50">No tags yet</div>
                    )}

                    <div className="flex items-center gap-2 pt-4 border-t-4 border-foreground text-sm font-black uppercase">
                      <span>Open</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>

                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const ok = confirm("DELETE THIS NOTE?");
                    if (!ok) return;

                    await fetch(`/api/notes/${note.id}`, {
                      method: "DELETE",
                    });

                    setNotes((prev) => prev.filter((n) => n.id !== note.id));
                  }}
                  type="button"
                  className="absolute top-4 right-4 inline-flex items-center gap-2 px-3 py-2 text-xs font-black uppercase border-brutal bg-background text-destructive hover-brutal"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Note Modal */}
      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        workspaceId={workspaceId}
        onNoteCreated={async () => {
          const res = await fetch(`/api/notes?workspaceId=${workspaceId}`);
          const data = await res.json();
          setNotes(Array.isArray(data) ? data : []);
        }}
      />
    </AppShell>
  );
}
