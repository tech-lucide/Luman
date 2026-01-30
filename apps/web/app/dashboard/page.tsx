"use client";

import AppShell from "@/components/layouts/app-shell";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Workspace = {
  id: string;
  owner_name: string;
  role: string;
  created_at: string;
};

type UserSession = {
  userId: string;
  role: "founder" | "intern";
  ownerName: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);

  async function checkSession() {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setSession(data.user);
      } else {
        router.push("/login");
      }
    } catch (err) {
      console.error("Session check failed:", err);
      router.push("/login");
    }
  }

  async function fetchWorkspaces() {
    try {
      const res = await fetch("/api/workspaces");
      const data = await res.json();
      setWorkspaces(data);
    } catch (err) {
      console.error("Failed to fetch workspaces:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkSession();
    fetchWorkspaces();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  async function handleCreateWorkspace() {
    const name = prompt("Enter workspace owner name:");
    if (!name) return;

    const role = prompt("Enter role (founder/intern):", "founder");
    if (!role || (role !== "founder" && role !== "intern")) {
      alert("Role must be either 'founder' or 'intern'");
      return;
    }

    try {
      setCreating(true);
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerName: name, role }),
      });

      if (res.ok) {
        fetchWorkspaces();
      } else {
        const errorData = await res.json();
        alert(`Failed to create workspace: ${errorData.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error creating workspace:", err);
      alert("Error creating workspace");
    } finally {
      setCreating(false);
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Filter workspaces based on user's role from session
  const filteredWorkspaces = workspaces.filter((ws) => {
    if (session.role === "founder") {
      return true; // Founders can see all workspaces
    }
    return ws.role === "intern"; // Interns can only see intern workspaces
  });

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-lg font-semibold">All Workspaces</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            {/* User Info */}
            <div className="flex items-center justify-between sm:justify-start gap-2 text-sm bg-muted/50 p-2 sm:p-0 rounded-lg sm:bg-transparent">
              <div className="text-muted-foreground mr-2 sm:mr-0">
                <span className="hidden sm:inline">Logged in as: </span>
                <span className="font-medium text-foreground">{session.ownerName}</span>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  session.role === "founder"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                }`}
              >
                {session.role}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 sm:flex-none rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted transition text-center"
              >
                Logout
              </button>
              <button
                type="button"
                onClick={handleCreateWorkspace}
                disabled={creating}
                className="flex-1 sm:flex-none rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap"
              >
                {creating ? "Creating..." : "Create Workspace"}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading workspaces...</div>
        ) : (
          <>
            {(!filteredWorkspaces || filteredWorkspaces.length === 0) && (
              <div className="text-sm text-muted-foreground border rounded-lg p-8 text-center bg-muted/50">
                {session.role === "intern"
                  ? "No intern workspaces found. Only interns can access intern workspaces."
                  : "No workspaces found. Click the button above to create one."}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkspaces?.map((ws) => (
                <Link
                  key={ws.id}
                  href={`/workspace/${ws.id}`}
                  className="rounded-lg border bg-card p-4 hover:bg-muted transition"
                >
                  <div className="font-medium text-lg mb-1">{ws.owner_name}</div>
                  <div className="text-sm text-muted-foreground">
                    Role: <span className={ws.role === "founder" ? "text-amber-500" : "text-blue-500"}>{ws.role}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground/60 mt-2">ID: {ws.id}</div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
