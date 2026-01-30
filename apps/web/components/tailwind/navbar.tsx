"use client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, PanelRight, Settings, Share2, Sparkles } from "lucide-react";

interface NavbarProps {
  aiOpen: boolean;
  onToggleAI: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Navbar({ aiOpen, onToggleAI, sidebarOpen, onToggleSidebar }: NavbarProps) {
  return (
    <header className="h-12 w-full border-b bg-background flex items-center px-4 gap-4">
      {/* Mobile Menu Button */}
      <button onClick={onToggleSidebar} className="lg:hidden p-1 -ml-2 text-muted-foreground hover:text-foreground">
        <Menu className="h-5 w-5" />
      </button>

      {/* Left — Brand */}
      <div className="flex items-center gap-2 font-semibold">
        <Sparkles className="h-4 w-4 text-accent" />
        <span className="hidden sm:inline">notaprompt</span>
      </div>

      {/* Center */}
      <div className="flex-1 flex justify-center">
        <span className="text-sm text-muted-foreground truncate max-w-[200px]">Untitled Workspace</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        <button
          onClick={onToggleAI}
          className={`p-1 rounded hover:bg-muted transition ${aiOpen ? "text-foreground" : "text-muted-foreground"}`}
          aria-label="Toggle AI sidebar"
        >
          <PanelRight className="h-4 w-4" />
        </button>

        <button className="text-muted-foreground hover:text-foreground transition">
          <Share2 className="h-4 w-4" />
        </button>

        <button className="text-muted-foreground hover:text-foreground transition">
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
