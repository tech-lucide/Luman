"use client";

import { cn } from "@/lib/utils";
import { useChat } from "ai/react";
import { Bot, Loader2, Send, Sparkles, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
}

export default function AIChatSidebar({ noteId, isOpen, onClose }: AIChatSidebarProps) {
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading } = useChat({
    api: "/api/chat",
    body: { noteId },
    onFinish: (message) => {
      // Optional: Do something when message finishes
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  // Load chat history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`/api/chat/${noteId}`);
        if (res.ok) {
          const data = await res.json();
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
        console.error("Failed to load chat history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    if (isOpen) {
      loadHistory();
    }
  }, [noteId, isOpen, setMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-screen w-full sm:w-[420px] bg-gradient-to-br from-background via-background to-muted/20 border-l border-border shadow-2xl transform transition-transform duration-300 ease-out z-50",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
    >
      {/* Header */}
      <div className="relative h-14 border-b border-border/50 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 backdrop-blur-xl">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Sparkles className="h-5 w-5 text-violet-500 animate-pulse" />
              <div className="absolute inset-0 blur-md bg-violet-500/50" />
            </div>
            <h2 className="font-semibold text-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
              AI Assistant
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100vh-8rem)]">
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
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                    message.role === "user"
                      ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
                      : "bg-muted/50 backdrop-blur-sm border border-border/50",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>

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
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50 bg-background/80 backdrop-blur-xl">
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
