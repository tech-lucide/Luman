"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      {/* Mode Toggle */}
      <div className="flex items-center border rounded-lg p-1">
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`p-1.5 rounded-md transition-colors ${
            theme === "light" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
          }`}
          title="Light Mode"
        >
          <Sun className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setTheme("system")}
          className={`p-1.5 rounded-md transition-colors ${
            theme === "system" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
          }`}
          title="System Mode"
        >
          <Laptop className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`p-1.5 rounded-md transition-colors ${
            theme === "dark" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
          }`}
          title="Dark Mode"
        >
          <Moon className="h-4 w-4" />
        </button>
      </div>

    </div>
  );
}
