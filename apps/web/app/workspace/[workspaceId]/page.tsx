"use client";

import AppShell from "@/components/layouts/app-shell";
import { NoteModal } from "@/components/note-modal";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Note = {
  id: string;
  title: string;
  created_at: string;
  tags?: string[];
};

export default function WorkspacePage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  useEffect(() => {
    async function loadNotes() {
      const res = await fetch(`/api/notes?workspaceId=${workspaceId}`);
      const data = await res.json();
      setNotes(data);
      setLoading(false);
    }

    loadNotes();
  }, [workspaceId]);

  return (
    <AppShell>
      <div className="p-8 md:p-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-16">
          <h1 className="font-black uppercase leading-none border-l-8 border-foreground pl-6">NOTES</h1>

          <button
            type="button"
            onClick={() => setIsNoteModalOpen(true)}
            className="px-8 py-4 text-lg font-black uppercase border-brutal hover-brutal bg-accent text-accent-foreground"
          >
            NEW NOTE
          </button>
        </div>

        {/* Loading */}
        {loading && <div className="text-lg font-bold uppercase">LOADING...</div>}

        {/* Empty state */}
        {!loading && notes.length === 0 && (
          <div className="border-brutal-thick p-12 bg-muted">
            <div className="max-w-2xl space-y-6">
              <h3 className="text-4xl font-black uppercase">NO NOTES</h3>
              <p className="text-xl font-bold uppercase border-l-4 border-foreground pl-6">CREATE YOUR FIRST NOTE</p>
            </div>
          </div>
        )}

        {/* Notes grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {notes.map((note) => (
            <div key={note.id} className="border-brutal shadow-brutal hover-brutal bg-card p-8 relative">
              <Link href={`/workspace/${workspaceId}/note/${note.id}`} className="block">
                <div className="space-y-6">
                  <div className="text-2xl font-black uppercase leading-tight line-clamp-3">{note.title}</div>

                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {note.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 text-xs font-black uppercase border-2 border-foreground bg-background"
                        >
                          {tag}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="px-3 py-1 text-xs font-black uppercase">+{note.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="text-sm font-bold uppercase pt-4 border-t-4 border-foreground">OPEN →</div>
                </div>
              </Link>

              {/* Delete button */}
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const ok = confirm("DELETE THIS NOTE?");
                  if (!ok) return;

                  await fetch(`/api/notes/${note.id}`, {
                    method: "DELETE",
                  });

                  // Optimistic UI update
                  setNotes((prev) => prev.filter((n) => n.id !== note.id));
                }}
                type="button"
                className="absolute top-4 right-4 px-4 py-2 text-xs font-black uppercase border-brutal bg-destructive text-destructive-foreground hover-brutal"
              >
                DELETE
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Note Modal */}
      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        workspaceId={workspaceId}
        onNoteCreated={async () => {
          // Refresh notes list
          const res = await fetch(`/api/notes?workspaceId=${workspaceId}`);
          const data = await res.json();
          setNotes(data);
        }}
      />
    </AppShell>
  );
}
