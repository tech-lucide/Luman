"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";

export default function NoteEditorPage() {
  const { noteId, workspaceId } = useParams<{
    workspaceId: string;
    noteId: string;
  }>();

  const router = useRouter();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNote() {
      const res = await fetch(`/api/notes/${noteId}`);
      const data = await res.json();

      if (!data?.content) {
        setContent({ type: "doc", content: [] });
      } else {
        setContent(data.content);
      }

      setLoading(false);
    }

    loadNote();
  }, [noteId]);

  if (loading) {
    return <div className="p-6">Loading…</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="h-12 border-b flex items-center px-4">
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </button>
      </div>

      <TailwindAdvancedEditor
        key={noteId}          // 🔑 FORCE RE-MOUNT
        noteId={noteId}
        initialContent={content}
      />
    </div>
  );
}
