"use client";

import { cn } from "@/lib/utils";
import { useChat } from "ai/react";
import { ArrowRightToLine, Bot, Copy, Loader2, Send, Sparkles, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "data";
  content: string;
  created_at?: string;
}

interface AIChatSidebarProps {
  noteId: string;
  isOpen: boolean;
  onClose: () => void;
  onInsert: (text: string) => void;
}

export default function AIChatSidebar({ noteId, isOpen, onClose, onInsert }: AIChatSidebarProps) {
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedModel, setSelectedModel] = useState("stepfun/step-3.5-flash:free");

  const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading, append } = useChat({
    api: "/api/chat",
    body: { noteId, model: selectedModel },
    onFinish: (message) => {
      console.log("[CHAT] Message finished:", message);
    },
    onError: (error) => {
      console.error("[CHAT ERROR]:", error);
      alert(`Chat error: ${error.message}`);
    },
  });

  // Listen for Slash Commands
  useEffect(() => {
    const handleTrigger = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        const { action, text } = detail;
        let prompt = "";
        if (action === "explain") {
          prompt = `Explain this text:\n\n"${text}"`;
        } else if (action === "fix") {
          prompt = `Fix grammar and spelling for this text:\n\n"${text}"`;
        }

        if (prompt) {
          append({
            role: "user",
            content: prompt,
          });
        }
      }
    };

    window.addEventListener("ai-chat-trigger", handleTrigger);
    return () => window.removeEventListener("ai-chat-trigger", handleTrigger);
  }, [append]);

  // Load chat history on mount or when noteId changes
  useEffect(() => {
    async function loadHistory() {
      try {
        console.log("[CHAT] Loading history for noteId:", noteId);
        setIsLoadingHistory(true);
        const res = await fetch(`/api/chat/${noteId}`);
        if (res.ok) {
          const data = await res.json();
          console.log("[CHAT] Loaded", data.length, "messages from history");
          // Map DB messages to AI SDK format if needed
          setMessages(
            data.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              createdAt: m.created_at ? new Date(m.created_at) : undefined,
            })),
          );
        }
      } catch (error) {
        console.error("[CHAT] Failed to load chat history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    loadHistory();
  }, [noteId, setMessages]);

  // Resizing logic
  const [width, setWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault(); // Prevent text selection
  };

  useEffect(() => {
    const stopResizing = () => setIsResizing(false);

    const resize = (e: MouseEvent) => {
      if (isResizing) {
        // Calculate new width: Window width - mouse X position
        // We subtract from window width because sidebar is on the right
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 300 && newWidth < 800) {
          setWidth(newWidth);
        }
      }
    };

    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    }

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const models = [
    { id: "stepfun/step-3.5-flash:free", name: "Step 3.5 Flash (Free)" },
    { id: "arcee-ai/trinity-large-preview:free", name: "Trinity Large Preview (Free)" },
    { id: "qwen/qwen3-next-80b-a3b-instruct:free", name: "Qwen3 Next 80B (Free)" },
  ];

  return (
    <div
      ref={sidebarRef}
      style={{ width: isOpen ? width : 0 }}
      className={cn(
        "fixed right-0 top-0 h-screen bg-gradient-to-br from-background via-background to-muted/20 border-l border-border shadow-2xl transition-all ease-out z-50 flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
    >
      {/* Drag Handle */}
      <div
        onMouseDown={startResizing}
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-violet-500/50 transition-colors z-50 group flex items-center justify-center -translate-x-1/2"
      >
        <div className="w-0.5 h-12 rounded-full bg-border group-hover:bg-violet-500 transition-colors" />
      </div>

      {/* Header */}
      <div className="relative h-14 border-b border-border/50 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Sparkles className="h-5 w-5 text-violet-500 animate-pulse" />
              <div className="absolute inset-0 blur-md bg-violet-500/50" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-semibold text-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                AI Assistant
              </h2>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="text-[10px] bg-transparent border-none text-muted-foreground focus:ring-0 cursor-pointer p-0 h-auto"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
            <div className="p-4 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
              <Bot className="h-8 w-8 text-violet-500" />
            </div>
            <div>
              <p className="font-medium text-sm">Start a conversation</p>
              <p className="text-xs text-muted-foreground mt-1">Ask me anything about your note</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 mt-1">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                      <Bot className="h-4 w-4 text-violet-500" />
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm overflow-hidden",
                    message.role === "user"
                      ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
                      : "bg-muted/50 backdrop-blur-sm border border-border/50",
                  )}
                >
                  <ReactMarkdown
                    className={cn(
                      "prose prose-sm dark:prose-invert max-w-none break-words",
                      message.role === "user"
                        ? "prose-headings:text-white prose-p:text-white prose-strong:text-white prose-code:text-white prose-ul:text-white"
                        : "",
                    )}
                    components={{
                      code({ node, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        const isInline = !match && !className; // Basic check for inline code

                        if (isInline) {
                          return (
                            <code className="bg-muted-foreground/20 px-1 py-0.5 rounded font-mono text-xs" {...props}>
                              {children}
                            </code>
                          );
                        }

                        return (
                          <div className="relative my-2 rounded-md overflow-hidden bg-black/80 ring-1 ring-border/50">
                            <div className="flex justify-between items-center px-4 py-1.5 bg-muted/50 border-b border-border/10">
                              <span className="text-xs text-muted-foreground font-mono">{match?.[1] || "code"}</span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => onInsert(String(children).replace(/\n$/, ""))}
                                  className="p-1 hover:bg-white/10 rounded transition-colors group flex items-center gap-1"
                                  title="Insert to editor"
                                >
                                  <ArrowRightToLine className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                                  <span className="text-[10px] text-muted-foreground group-hover:text-foreground">
                                    Insert
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(String(children).replace(/\n$/, ""))}
                                  className="p-1 hover:bg-white/10 rounded transition-colors group"
                                  title="Copy code"
                                >
                                  <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                                </button>
                              </div>
                            </div>
                            <pre className="p-4 overflow-x-auto text-xs font-mono scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          </div>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>

                {message.role === "assistant" && (
                  <div className="flex flex-col gap-1 mt-1">
                    {/* Copy entire message */}
                    <button
                      onClick={() => onInsert(message.content)}
                      className="self-start text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-muted/50 transition-colors"
                    >
                      <ArrowRightToLine className="h-3 w-3" />
                      Insert
                    </button>
                  </div>
                )}

                {message.role === "user" && (
                  <div className="flex-shrink-0 mt-1">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                      <User className="h-4 w-4 text-blue-500" />
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-xl flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1 rounded-xl border border-border/50 bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50 transition-shadow"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 disabled:hover:shadow-none"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
