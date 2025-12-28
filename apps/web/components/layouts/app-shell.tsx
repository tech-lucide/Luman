import Navbar from "@/components/tailwind/navbar";
import{ WorkspaceSidebar } from "@/components/tailwind/workspace-sidebar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <WorkspaceSidebar />

        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
