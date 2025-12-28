"use client";

import { X } from "lucide-react";

interface ChatSidebarProps {
  onClose: () => void;
}

export default function ChatSidebar({ onClose }: ChatSidebarProps) {
  return (
    <aside className="w-[360px] border-l bg-background flex flex-col">
      {/* Header */}
      <div className="h-12 px-4 border-b flex items-center justify-between">
        <span className="font-semibold text-sm">AI Co-Founder</span>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition"
          aria-label="Close AI sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 text-sm text-muted-foreground">
        Coming soon…
      </div>
    </aside>
  );
}
