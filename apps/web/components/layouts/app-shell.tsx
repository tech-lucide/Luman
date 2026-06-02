"use client";

import { WorkspaceSidebar } from "@/components/tailwind/workspace-sidebar";
import { FloatingDock } from "@/components/floating-dock";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load sidebar collapsed state from localStorage on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sidebar_collapsed");
      if (stored === "true") {
        setIsCollapsed(true);
      } else if (stored === "false") {
        setIsCollapsed(false);
      } else {
        // Fallback: auto-collapse on compact screen sizes (< 1280px)
        if (window.innerWidth < 1280) {
          setIsCollapsed(true);
        }
      }
    }
  }, []);

  const handleToggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar_collapsed", String(nextState));
    }
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-[#FDFBF7] dark:bg-zinc-950">
      {/* Floating Breadcrumb Dock (Replaces the top Navbar) */}
      <FloatingDock />

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

        {/* Sidebar Container */}
        <div
          className={cn(
            "fixed lg:static inset-y-0 left-0 z-50 transform lg:transform-none transition-all duration-300 ease-out overflow-hidden shrink-0 bg-[#FDFBF7] dark:bg-zinc-950 border-r-[3px] border-black dark:border-stone-100",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            isCollapsed ? "w-[84px]" : "w-[300px]"
          )}
        >
          <WorkspaceSidebar isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
