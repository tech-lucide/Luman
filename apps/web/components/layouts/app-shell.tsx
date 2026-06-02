"use client";

import Navbar from "@/components/tailwind/navbar";
import { WorkspaceSidebar } from "@/components/tailwind/workspace-sidebar";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [aiOpen, setAiOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col">
      <Navbar
        aiOpen={aiOpen}
        onToggleAI={() => setAiOpen(!aiOpen)}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setSidebarOpen(false);
            }}
          />
        )}

        {/* Sidebar */}
        <div
          style={{ width: isLeftSidebarOpen ? 300 : 0 }}
          className={cn(
            "fixed lg:static inset-y-0 left-0 z-50 transform lg:transform-none transition-all duration-300 ease-out overflow-hidden shrink-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            isLeftSidebarOpen ? "lg:w-[300px] border-r-4 border-foreground" : "lg:w-0 border-r-0"
          )}
        >
          <WorkspaceSidebar />
        </div>

        {/* Floating Left Sidebar Toggle Button (Desktop Only) */}
        <button
          onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          style={{ left: isLeftSidebarOpen ? "312px" : "12px" }}
          className="hidden lg:flex fixed top-[84px] z-40 items-center justify-center h-10 w-10 rounded-full border-[3px] border-black bg-[#FBBF24] hover:bg-[#FBBF24]/90 text-black hover:-translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          title={isLeftSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isLeftSidebarOpen ? (
            <ChevronLeft className="h-5 w-5 text-black" />
          ) : (
            <ChevronRight className="h-5 w-5 text-black animate-pulse" />
          )}
          {!isLeftSidebarOpen && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-black rounded-full text-[7px] font-black flex items-center justify-center text-[#FBBF24] ring-2 ring-black">
              DIR
            </span>
          )}
        </button>

        <main className="flex-1 overflow-y-auto bg-background w-full">{children}</main>
      </div>
    </div>
  );
}
