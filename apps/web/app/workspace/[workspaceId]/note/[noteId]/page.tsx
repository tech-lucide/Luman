"use client";

import AIChatSidebar from "@/components/ai-chat-sidebar";
import { EventModal } from "@/components/event-modal";
import { TagSelector } from "@/components/tag-selector";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, MessageSquare, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { cn } from "@/lib/utils";

const TailwindAdvancedEditor = dynamic(() => import("@/components/tailwind/advanced-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
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

  // Live stats and dynamic outline
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [headings, setHeadings] = useState<{ text: string; level: number }[]>([]);
  const [workspaceNotes, setWorkspaceNotes] = useState<{ id: string; title: string }[]>([]);

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

  // Load other workspace notes for quick directory navigation
  useEffect(() => {
    async function loadWorkspaceNotes() {
      try {
        const res = await fetch(`/api/notes?workspaceId=${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          setWorkspaceNotes(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load workspace notes:", err);
      }
    }
    loadWorkspaceNotes();
  }, [workspaceId, noteId]);

  // Bind statistics change listener & outline heading parser to editorInstance
  useEffect(() => {
    if (!editorInstance) return;

    const updateStatsAndOutline = () => {
      // 1. Live stats
      if (editorInstance.storage?.characterCount) {
        setWordCount(editorInstance.storage.characterCount.words() || 0);
        setCharCount(editorInstance.storage.characterCount.characters() || 0);
      } else {
        const text = editorInstance.getText() || "";
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        setWordCount(words);
        setCharCount(text.length);
      }

      // 2. Headings for Table of Contents
      const json = editorInstance.getJSON();
      const extracted: { text: string; level: number }[] = [];
      const traverse = (node: any) => {
        if (node.type === "heading" && node.content?.[0]?.text) {
          extracted.push({
            text: node.content[0].text,
            level: node.attrs?.level || 1,
          });
        }
        if (node.content) {
          node.content.forEach(traverse);
        }
      };
      traverse(json);
      setHeadings(extracted);
    };

    // Initialize counts & headings on editor mount
    updateStatsAndOutline();

    // Listen for real-time keystrokes
    editorInstance.on("update", updateStatsAndOutline);

    return () => {
      editorInstance.off("update", updateStatsAndOutline);
    };
  }, [editorInstance]);

  // Clickable TOC scrolling logic with highlighted visual pulse
  const scrollToHeading = (index: number) => {
    const editorDom = document.querySelector(".tiptap, [contenteditable='true']");
    if (!editorDom) return;

    const headingElements = editorDom.querySelectorAll("h1, h2, h3, h4, h5, h6");
    const targetElement = headingElements[index];

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      
      // Temporary neobrutalist highlighting pulse
      targetElement.classList.add("bg-[#FEF08A]", "transition-all", "duration-500", "ring-4", "ring-black", "rounded-lg");
      setTimeout(() => {
        targetElement.classList.remove("bg-[#FEF08A]", "ring-4", "ring-black", "rounded-lg");
      }, 1500);
    }
  };

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
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-70 pointer-events-none" />

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

          <div className="w-[108px] flex justify-end" />
        </div>
      </header>

      {/* Split Body Layout */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        
        {/* Left Side Command Bar (IDE-like workspace directory & Table of Contents) */}
        <aside className="w-80 shrink-0 border-r-4 border-black bg-white hidden lg:flex flex-col justify-between overflow-y-auto">
          <div className="p-6 space-y-6 flex-1 flex flex-col min-h-0">
            
            {/* 1. Workspace Directory list of other notes */}
            <div className="space-y-3 flex flex-col shrink-0">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                WORKSPACE DIRECTORY
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {workspaceNotes.map((n) => {
                  const isCurrent = n.id === noteId;
                  return (
                    <Link
                      key={n.id}
                      href={`/workspace/${workspaceId}/note/${n.id}`}
                      className={cn(
                        "flex items-center gap-2 px-3.5 py-2.5 text-xs font-black uppercase rounded-xl border-2 border-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 truncate",
                        isCurrent ? "bg-[#FBBF24] text-black" : "bg-white text-stone-700 hover:bg-stone-50"
                      )}
                    >
                      <span className="shrink-0">📄</span>
                      <span className="truncate flex-1">{n.title}</span>
                    </Link>
                  );
                })}
                {workspaceNotes.length === 0 && (
                  <div className="text-[10px] font-bold text-center uppercase text-stone-400 py-3 border-2 border-dashed border-stone-200 rounded-xl">
                    No notes in workspace
                  </div>
                )}
              </div>
            </div>

            {/* 2. Live Dynamic Outline / Table of Contents */}
            <div className="border-t-2 border-dashed border-stone-200 pt-6 space-y-3 flex-1 flex flex-col min-h-0">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                TABLE OF CONTENTS
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                {headings.length === 0 ? (
                  <div className="text-[10px] font-bold text-center uppercase text-stone-400 py-6 border-2 border-dashed border-stone-200 rounded-xl bg-stone-50/50">
                    No headers found. Use # in note to create one.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {headings.map((h, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => scrollToHeading(i)}
                        style={{ paddingLeft: `${(h.level - 1) * 10}px` }}
                        className={cn(
                          "w-full text-left flex items-start gap-2 text-xs font-black uppercase truncate group transition-all hover:translate-x-[2px] cursor-pointer",
                          h.level === 1 ? "text-stone-900" : h.level === 2 ? "text-stone-600" : "text-stone-400"
                        )}
                      >
                        <span className="text-[#FBBF24] shrink-0 font-bold">•</span>
                        <span className="truncate group-hover:underline">{h.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Live Statistics Block */}
            <div className="border-t-2 border-dashed border-stone-200 pt-6 space-y-3 shrink-0">
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

          {/* Quick Document Exporters */}
          <div className="p-6 border-t-2 border-dashed border-stone-200 space-y-3 bg-stone-50/50 shrink-0">
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

        <main className="flex-1 overflow-y-auto scrollbar-none px-6 py-8 md:px-12 md:py-10">
          <div className="max-w-6xl mx-auto border-[3px] border-black rounded-[24px] bg-white p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all">
            <TailwindAdvancedEditor
              key={noteId}
              noteId={noteId}
              workspaceId={workspaceId}
              initialContent={content}
              onEditorReady={setEditorInstance}
            />
          </div>
        </main>

        {/* AI Chat Sidebar (Inline Flex Panel) */}
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

      </div>

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

      {/* Floating Neobrutalist AI Chat Toggle Button near the right-hand scrollbar at the top */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed right-6 top-[84px] z-40 flex items-center justify-center h-12 w-12 rounded-full border-[3px] border-black bg-[#FBBF24] hover:bg-[#FBBF24]/90 text-black hover:-translate-y-0.5 transition-all shadow-[-3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:shadow-[-5px_5px_0px_0px_rgba(0,0,0,1)]"
        title={isChatOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {isChatOpen ? (
          <ChevronRight className="h-6 w-6 text-black" />
        ) : (
          <ChevronLeft className="h-6 w-6 text-black animate-pulse" />
        )}
        {!isChatOpen && (
          <span className="absolute -top-1.5 -left-1.5 h-4.5 w-4.5 bg-black rounded-full text-[8px] font-black flex items-center justify-center text-[#FBBF24] ring-2 ring-black">
            AI
          </span>
        )}
      </button>
    </div>
  );
}
