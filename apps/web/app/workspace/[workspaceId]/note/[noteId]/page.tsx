"use client";

import AIChatSidebar from "@/components/ai-chat-sidebar";
import { EventModal } from "@/components/event-modal";
import { TagSelector } from "@/components/tag-selector";
import { ArrowLeft, Loader2, MessageSquare } from "lucide-react";
import dynamic from "next/dynamic";

const TailwindAdvancedEditor = dynamic(() => import("@/components/tailwind/advanced-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NoteEditorPage() {
  const { noteId, workspaceId } = useParams<{
    workspaceId: string;
    noteId: string;
  }>();

  const router = useRouter();
  const [content, setContent] = useState<any>(null);
  const [title, setTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventCreatedMessage, setEventCreatedMessage] = useState<string | null>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);

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
      setTags(data?.tags || []);
      setLoading(false);
    }

    loadNote();
  }, [noteId]);

  // Listen for /schedule slash command
  useEffect(() => {
    const handleOpenEventModal = () => {
      setIsEventModalOpen(true);
    };

    window.addEventListener("open-event-modal", handleOpenEventModal);
    return () => window.removeEventListener("open-event-modal", handleOpenEventModal);
  }, []);

  const handleTagsChange = async (newTags: string[]) => {
    setTags(newTags);
    try {
      await fetch(`/api/notes/${noteId}/tags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: newTags }),
      });
    } catch (error) {
      console.error("Failed to update tags:", error);
    }
  };

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

          <div className="flex-1 flex flex-col items-center justify-center -space-y-0.5">
            <h1 className="text-sm font-semibold truncate max-w-md">{title}</h1>
            <div className="hidden sm:block">
              <TagSelector tags={tags} onChange={handleTagsChange} />
            </div>
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

        {/* Mobile Tags */}
        <div className="sm:hidden px-4 pb-2 border-t bg-muted/20">
          <TagSelector tags={tags} onChange={handleTagsChange} />
        </div>
      </header>

      {/* Editor Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-8 px-4 sm:px-6">
          <TailwindAdvancedEditor
            key={noteId}
            noteId={noteId}
            workspaceId={workspaceId}
            initialContent={content}
            onEditorReady={setEditorInstance}
          />
        </div>
      </main>

      {/* AI Chat Sidebar */}
      <AIChatSidebar
        noteId={noteId}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onInsert={(text) => {
          if (editorInstance) {
            editorInstance.chain().focus().insertContent(text).run();
          }
        }}
      />

      {/* Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        workspaceId={workspaceId}
        noteId={noteId}
        onEventCreated={() => {
          setEventCreatedMessage("✅ Event scheduled successfully!");
          setTimeout(() => setEventCreatedMessage(null), 4000);
        }}
      />

      {/* Event Created Notification */}
      {eventCreatedMessage && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4">
          <div className="border-brutal-thick shadow-brutal-xl bg-accent text-accent-foreground px-8 py-4 font-black uppercase text-lg">
            {eventCreatedMessage}
          </div>
        </div>
      )}
    </div>
  );
}
