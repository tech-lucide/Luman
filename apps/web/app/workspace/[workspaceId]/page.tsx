"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import AppShell from "@/components/layouts/app-shell";

type Note = {
  id: string;
  title: string;
  created_at: string;
};

export default function WorkspacePage() {
  const router = useRouter();
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  async function loadNotes() {
    const res = await fetch(
      `/api/notes?workspaceId=${workspaceId}`
    );
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
        {loading && (
          <div className="text-sm text-muted-foreground">
            Loading notes…
          </div>
        )}

        {/* Empty state */}
        {!loading && notes.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No notes yet. Create your first one.
          </div>
        )}

        {/* Notes grid */}
        <div className="grid grid-cols-3 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="relative rounded-lg border bg-card p-4 hover:bg-muted transition"
            >
              <Link
                href={`/workspace/${workspaceId}/note/${note.id}`}
                className="block"
              >
                <div className="font-medium">{note.title}</div>
                <div className="text-sm text-muted-foreground">
                  Open note
                </div>
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
                  setNotes((prev) =>
                    prev.filter((n) => n.id !== note.id)
                  );
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
