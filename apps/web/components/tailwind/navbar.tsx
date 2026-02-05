"use client";
import { ThemeToggle } from "@/components/theme-toggle";
import { TodoMenu } from "@/components/todo-menu";
import { ArrowLeft, Menu, PanelRight, Settings, Share2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavbarProps {
  aiOpen: boolean;
  onToggleAI: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

interface Workspace {
  id: string;
  owner_name: string;
}

export default function Navbar({ aiOpen, onToggleAI, onToggleSidebar }: NavbarProps) {
  const params = useParams();
  const pathname = usePathname();
  const workspaceId = params?.workspaceId as string;
  const [workspaceName, setWorkspaceName] = useState("LUMAN");

  // Determine if we should show back button
  const showBackButton = workspaceId || pathname === "/calendar";

  useEffect(() => {
    if (workspaceId) {
      // Fetch workspace details
      fetch("/api/workspaces")
        .then((res) => res.json())
        .then((data: Workspace[]) => {
          if (Array.isArray(data)) {
            const ws = data.find((w) => w.id === workspaceId);
            if (ws) {
              setWorkspaceName(ws.owner_name.toUpperCase());
            }
          }
        })
        .catch((err) => console.error("Failed to fetch workspace name", err));
    } else if (pathname === "/calendar") {
      setWorkspaceName("ORGANIZATION");
    } else {
      setWorkspaceName("HOME");
    }
  }, [workspaceId, pathname]);

  return (
    <header className="h-20 w-full border-b-4 border-foreground bg-background flex items-center px-8 gap-8">
      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={onToggleSidebar}
        className="lg:hidden p-3 border-brutal hover-brutal bg-background"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Left — Brand / Back */}
      <div className="flex items-center gap-6">
        {showBackButton ? (
          <Link href="/dashboard" className="p-3 border-brutal hover-brutal bg-background" title="Back to Home">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        ) : null}

        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6" />
          <span className="hidden sm:inline text-xl font-black uppercase tracking-tight">NOTAPROMPT</span>
        </div>
      </div>

      {/* Center - Workspace Name */}
      <div className="flex-1 flex justify-center">
        {(workspaceId || pathname === "/calendar") && (
          <span className="text-lg font-black uppercase px-6 py-2 bg-accent text-accent-foreground border-brutal">
            {workspaceName}
          </span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <button
          type="button"
          onClick={onToggleAI}
          className={`p-3 border-brutal hover-brutal ${aiOpen ? "bg-accent text-accent-foreground" : "bg-background"}`}
          aria-label="Toggle AI sidebar"
        >
          <PanelRight className="h-5 w-5" />
        </button>

        <button type="button" className="p-3 border-brutal hover-brutal bg-background">
          <Share2 className="h-5 w-5" />
        </button>

        <TodoMenu workspaceId={workspaceId} />

        <Link href="/settings" className="p-3 border-brutal hover-brutal bg-background">
          <Settings className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
