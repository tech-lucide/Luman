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

  // Live stats state
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

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

  // Bind statistics change listener to editorInstance
  useEffect(() => {
    if (!editorInstance) return;

    const updateStats = () => {
      // TipTap character-count extension support
      if (editorInstance.storage?.characterCount) {
        setWordCount(editorInstance.storage.characterCount.words() || 0);
        setCharCount(editorInstance.storage.characterCount.characters() || 0);
      } else {
        const text = editorInstance.getText() || "";
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        setWordCount(words);
        setCharCount(text.length);
      }
    };

    // Initialize counts
    updateStats();

    // Bind event
    editorInstance.on("update", updateStats);

    return () => {
      editorInstance.off("update", updateStats);
    };
  }, [editorInstance]);

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
      <div className="h-screen flex items-center justify-center bg-[#FDFBF7] dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[#FBBF24]" />
          <p className="text-xs font-black uppercase tracking-widest text-stone-500">Loading note...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#FDFBF7] dark:bg-zinc-950 overflow-hidden relative">
      {/* Technical grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-75 pointer-events-none" />

      {/* Ambient Glows */}
      <div className="pointer-events-none absolute top-12 left-1/4 h-96 w-96 rounded-full bg-[#FBBF24]/5 blur-[120px] dark:opacity-20 animate-pulse" />
      <div className="pointer-events-none absolute bottom-24 right-1/4 h-96 w-96 rounded-full bg-purple-500/5 blur-[120px] dark:opacity-20 animate-pulse" />

      {/* Clean Header */}
      <header className="shrink-0 sticky top-0 z-40 w-full border-b-4 border-black bg-white supports-[backdrop-filter]:bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-6 gap-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase border-[3px] border-black bg-white hover:bg-stone-50 transition-all rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="px-4 py-1.5 text-xs font-black uppercase tracking-wider border-[3px] border-black bg-[#FBBF24] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full truncate max-w-[150px] sm:max-w-md">
              {title}
            </span>
            <div className="hidden md:block">
              <TagSelector tags={tags} onChange={handleTagsChange} />
            </div>
          </div>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="relative inline-flex items-center gap-2 rounded-full border-[3px] border-black bg-black text-white px-4 py-2 text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            <MessageSquare className="h-4 w-4" />
            <span>AI Chat</span>
            {isChatOpen && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-black" />
            )}
          </button>
        </div>
      </header>

      {/* Split Body Layout */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        
        {/* Left Side Command Bar */}
        <aside className="w-80 shrink-0 border-r-4 border-black bg-white hidden lg:flex flex-col justify-between overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                AI WORKSPACE ASSISTANT
              </div>
              <div className="space-y-2.5">
                <button
                  onClick={() => {
                    setIsChatOpen(true);
                  }}
                  className="w-full text-left flex items-center justify-between px-4 py-3 border-2 border-black rounded-xl bg-purple-50 hover:bg-purple-100 transition-all font-black text-xs uppercase text-purple-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                >
                  <span>✨ Summarize Note</span>
                  <span className="text-[9px] bg-purple-200 border border-purple-300 px-1.5 py-0.5 rounded font-mono">AI</span>
                </button>
                <button
                  onClick={() => {
                    setIsChatOpen(true);
                  }}
                  className="w-full text-left flex items-center justify-between px-4 py-3 border-2 border-black rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-all font-black text-xs uppercase text-emerald-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                >
                  <span>📝 Find Action Items</span>
                  <span className="text-[9px] bg-emerald-200 border border-emerald-300 px-1.5 py-0.5 rounded font-mono">AI</span>
                </button>
                <button
                  onClick={() => {
                    setIsChatOpen(true);
                  }}
                  className="w-full text-left flex items-center justify-between px-4 py-3 border-2 border-black rounded-xl bg-amber-50 hover:bg-amber-100 transition-all font-black text-xs uppercase text-amber-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                >
                  <span>🚀 Improve Grammar</span>
                  <span className="text-[9px] bg-amber-200 border border-amber-300 px-1.5 py-0.5 rounded font-mono">AI</span>
                </button>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-stone-200 pt-6 space-y-3">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                EDITOR SLASH COMMANDS
              </div>
              <div className="bg-stone-50 border-2 border-black rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black uppercase text-stone-600">
                  <span>/schedule</span>
                  <span className="text-[9px] bg-white border border-stone-200 px-1.5 py-0.5 rounded font-mono">Event</span>
                </div>
                <div className="flex items-center justify-between text-xs font-black uppercase text-stone-600">
                  <span>[] Checklist</span>
                  <span className="text-[9px] bg-white border border-stone-200 px-1.5 py-0.5 rounded font-mono">Tasks</span>
                </div>
                <div className="flex items-center justify-between text-xs font-black uppercase text-stone-600">
                  <span>"" Quote block</span>
                  <span className="text-[9px] bg-white border border-stone-200 px-1.5 py-0.5 rounded font-mono">Block</span>
                </div>
                <div className="flex items-center justify-between text-xs font-black uppercase text-stone-600">
                  <span># Header 1</span>
                  <span className="text-[9px] bg-white border border-stone-200 px-1.5 py-0.5 rounded font-mono">Title</span>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-stone-200 pt-6 space-y-3">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                LIVE STATISTICS
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-center">
                  <div className="text-xl font-black text-black">{wordCount}</div>
                  <div className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mt-1">WORDS</div>
                </div>
                <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-center">
                  <div className="text-xl font-black text-black">{charCount}</div>
                  <div className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mt-1">CHARS</div>
                </div>
              </div>
              <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between px-4">
                <span className="text-[10px] font-black text-stone-500 uppercase">READ TIME</span>
                <span className="text-xs font-black text-black">
                  {Math.max(1, Math.ceil(wordCount / 200))} MIN
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 border-t-2 border-dashed border-stone-200 space-y-3 bg-stone-50/50">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
              DOCUMENT ACTIONS
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!editorInstance) return;
                  const html = editorInstance.getHTML();
                  const blob = new Blob([html], { type: "text/html" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 py-2.5 text-center text-[10px] font-black uppercase border-2 border-black bg-white hover:bg-stone-50 rounded-xl shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                HTML Export
              </button>
              <button
                onClick={() => {
                  if (!editorInstance) return;
                  const text = editorInstance.getText();
                  const blob = new Blob([text], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 py-2.5 text-center text-[10px] font-black uppercase border-2 border-black bg-white hover:bg-stone-50 rounded-xl shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                Text Export
              </button>
            </div>
          </div>
        </aside>

        {/* Right Area: Floating Paper Canvas */}
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10">
          <div className="max-w-4xl mx-auto border-[3px] border-black rounded-[24px] bg-white p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all">
            <TailwindAdvancedEditor
              key={noteId}
              noteId={noteId}
              workspaceId={workspaceId}
              initialContent={content}
              onEditorReady={setEditorInstance}
            />
          </div>
        </main>

      </div>

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
          <div className="border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-[#A7F3D0] text-black px-8 py-4 font-black uppercase text-lg rounded-2xl">
            {eventCreatedMessage}
          </div>
        </div>
      )}
    </div>
  );
}
