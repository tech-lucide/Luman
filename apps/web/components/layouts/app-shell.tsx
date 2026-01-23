"use client";

import Navbar from "@/components/tailwind/navbar";
import { WorkspaceSidebar } from "@/components/tailwind/workspace-sidebar";
import { useState } from "react";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      <Navbar aiOpen={aiOpen} onToggleAI={() => setAiOpen(!aiOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <WorkspaceSidebar />

        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
