"use client";

import AppShell from "@/components/layouts/app-shell";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Note = {
  id: string;
  title: string;
  created_at: string;
  tags?: string[];
};

export default function WorkspacePage() {
  const router = useRouter();
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold">Notes</h1>

          <Link
            href={`/workspace/${workspaceId}/new`}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            New Note
          </Link>
        </div>

        {/* Loading */}
        {loading && <div className="text-sm text-muted-foreground">Loading notes…</div>}

        {/* Empty state */}
        {!loading && notes.length === 0 && (
          <div className="text-sm text-muted-foreground">No notes yet. Create your first one.</div>
        )}

        {/* Notes grid */}
        <div className="grid grid-cols-3 gap-4">
          {notes.map((note) => (
            <div key={note.id} className="relative rounded-lg border bg-card p-4 hover:bg-muted transition">
              <Link href={`/workspace/${workspaceId}/note/${note.id}`} className="block">
                <div className="font-medium">{note.title}</div>

                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 mb-1">
                    {note.tags.slice(0, 3).map((tag, i) => {
                      // Color generation logic (same as TagSelector)
                      const colors = [
                        "bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-300",
                        "bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300",
                        "bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-300",
                        "bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300",
                        "bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-300",
                        "bg-pink-100 text-pink-700 dark:bg-pink-950/20 dark:text-pink-300",
                        "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-300",
                        "bg-teal-100 text-teal-700 dark:bg-teal-950/20 dark:text-teal-300",
                      ];
                      let hash = 0;
                      for (let j = 0; j < tag.length; j++) {
                        hash = tag.charCodeAt(j) + ((hash << 5) - hash);
                      }
                      const colorClass = colors[Math.abs(hash) % colors.length];

                      return (
                        <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${colorClass}`}>
                          {tag}
                        </span>
                      );
                    })}
                    {note.tags.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">+{note.tags.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="text-sm text-muted-foreground mt-1">Open note</div>
              </Link>

              {/* Delete button */}
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const ok = confirm("Delete this note?");
                  if (!ok) return;

                  await fetch(`/api/notes/${note.id}`, {
                    method: "DELETE",
                  });

                  // Optimistic UI update
                  setNotes((prev) => prev.filter((n) => n.id !== note.id));
                }}
                className="absolute top-2 right-2 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-destructive hover:text-white transition"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
