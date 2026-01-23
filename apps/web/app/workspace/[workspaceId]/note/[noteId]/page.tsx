"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";
import AIChatSidebar from "@/components/ai-chat-sidebar";
import { ArrowLeft, Loader2, MessageSquare } from "lucide-react";

export default function NoteEditorPage() {
  const { noteId, workspaceId } = useParams<{
    workspaceId: string;
    noteId: string;
  }>();

  const router = useRouter();
  const [content, setContent] = useState<any>(null);
  const [title, setTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    async function loadNote() {
      const res = await fetch(`/api/notes/${noteId}`);
      const data = await res.json();

      if (!data?.content) {
        setContent({ type: "doc", content: [] });
      } else {
        setContent(data.content);
      }

      setTitle(data?.title || "Untitled");
      setLoading(false);
    }

    loadNote();
  }, [noteId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading note...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Clean Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4 sm:px-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="flex-1 flex justify-center">
            <h1 className="text-sm font-semibold truncate max-w-md">
              {title}
            </h1>
          </div>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="relative inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">AI Chat</span>
            {isChatOpen && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
            )}
          </button>
        </div>
      </header>

      {/* Editor Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-8 px-4 sm:px-6">
          <TailwindAdvancedEditor
            key={noteId}
            noteId={noteId}
            initialContent={content}
          />
        </div>
      </main>

      {/* AI Chat Sidebar */}
      <AIChatSidebar
        noteId={noteId}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}
