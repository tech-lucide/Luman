"use client";

import { AppContext } from "@/app/providers";
import { Laptop, Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useContext } from "react";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const { themeColor, setThemeColor } = useContext(AppContext);

  const colors = [
    { name: "Default", class: "bg-slate-950" },
    { name: "Green", class: "bg-green-600" },
    { name: "Violet", class: "bg-violet-600" },
    { name: "Orange", class: "bg-orange-500" },
  ];

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

      {/* Color Toggle */}
      <div className="flex items-center border rounded-lg p-1 gap-1">
        {colors.map((c) => (
          <button
            type="button"
            key={c.name}
            onClick={() => setThemeColor(c.name)}
            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
              c.class
            } ${themeColor === c.name ? "ring-2 ring-offset-2 ring-primary" : "opacity-80 hover:opacity-100"}`}
            title={`${c.name} Theme`}
          >
            {themeColor === c.name && <Palette className="h-3 w-3 text-white" />}
          </button>
        ))}
      </div>
    </div>
  );
}
