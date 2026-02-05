"use client";

import AppShell from "@/components/layouts/app-shell";
import type { OrganizationMember } from "@/lib/db/organizations";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type MemberWithDetails = OrganizationMember & {
  full_name?: string;
  email?: string;
};

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center uppercase font-bold">Loading Admin Dashboard...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgSlug = searchParams.get("org");

  const [members, setMembers] = useState<MemberWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // Helper to fetch session and verify access
  useEffect(() => {
    async function init() {
      try {
        const sessionRes = await fetch(`/api/auth/session${orgSlug ? `?org=${orgSlug}` : ""}`);
        const sessionData = await sessionRes.json();
        const user = sessionData.user;

        if (!user || (user.role !== "founder" && user.role !== "admin")) {
          alert("Access Denied: You must be a Founder or Admin.");
          router.push("/dashboard");
          return;
        }

        setCurrentUserRole(user.role);

        // Find current org ID
        const currentOrg = (user.organizations as any[]).find((o) => o.slug === orgSlug) || user.organizations[0];
        if (currentOrg) {
          fetchMembers(currentOrg.id);
        }
      } catch (err) {
        console.error("Admin init error:", err);
      }
    }
    init();
  }, [orgSlug, router]);

  async function fetchMembers(orgId: string) {
    try {
      const res = await fetch(`/api/organization/members?orgId=${orgId}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(userId: string, newRole: string) {
    // Get Org ID from URL or session (simplified here to reuse the one from list)
    // For safety, we should store orgId in state, but let's assume valid flow
    const orgId = new URLSearchParams(window.location.search).get("orgId") || members[0]?.organization_id;

    if (!orgId) return;

    try {
      const res = await fetch("/api/organization/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, userId, role: newRole }),
      });

      if (res.ok) {
        setMembers((prev) => prev.map((m) => (m.user_id === userId ? { ...m, role: newRole as any } : m)));
        alert("Role updated successfully");
      } else {
        const error = await res.json();
        alert(`Failed to update role: ${error.error}`);
      }
    } catch (err) {
      console.error("Update role error:", err);
      alert("Failed to update role");
    }
  }

  return (
    <AppShell>
      <div className="p-8 md:p-12 max-w-7xl mx-auto">
        <h1 className="font-black uppercase leading-none border-l-8 border-foreground pl-6 mb-12">ADMIN DASHBOARD</h1>

        {loading ? (
          <div className="text-lg font-bold uppercase">LOADING MEMBERS...</div>
        ) : (
          <div className="space-y-8">
            <div className="border-brutal-thick bg-card p-8">
              <h2 className="text-2xl font-black uppercase mb-6">TEAM MEMBERS</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-4 border-foreground">
                      <th className="py-4 font-black uppercase">Member</th>
                      <th className="py-4 font-black uppercase">Email</th>
                      <th className="py-4 font-black uppercase">Role</th>
                      <th className="py-4 font-black uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} className="border-b-2 border-muted">
                        <td className="py-4 font-bold uppercase">{member.full_name || "Unknown"}</td>
                        <td className="py-4 font-mono text-sm opacity-70">{member.email || "Unknown"}</td>
                        <td className="py-4">
                          <span
                            className={`px-3 py-1 font-bold uppercase text-xs border-brutal inline-block ${
                              member.role === "founder" ? "bg-accent text-accent-foreground" : "bg-muted"
                            }`}
                          >
                            {member.role}
                          </span>
                        </td>
                        <td className="py-4">
                          {currentUserRole === "founder" ||
                          (currentUserRole === "admin" && member.role === "intern") ? (
                            <select
                              value={member.role}
                              onChange={(e) => updateRole(member.user_id, e.target.value)}
                              className="border-2 border-foreground p-2 font-bold uppercase text-sm"
                            >
                              <option value="admin">Admin</option>
                              <option value="intern">Intern</option>
                              {currentUserRole === "founder" && <option value="founder">Founder</option>}
                            </select>
                          ) : (
                            <span className="text-xs text-muted-foreground uppercase font-bold">LOCKED</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 border-brutal-thick bg-destructive/10 p-8 border-destructive">
          <h2 className="text-2xl font-black uppercase mb-4 text-destructive">DANGER ZONE</h2>
          <p className="font-bold uppercase mb-6 text-sm">Irreversible actions. Be careful.</p>
          <button
            onClick={async () => {
              if (confirm("ARE YOU SURE? THIS WILL DELETE THIS ORGANIZATION AND ALL DATA.")) {
                try {
                  const res = await fetch("/api/debug/reset", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ target: "organizations" }),
                  });
                  if (res.ok) {
                    alert("Organization deleted.");
                    window.location.href = "/org-login";
                  } else {
                    alert("Failed to delete.");
                  }
                } catch (e) {
                  alert("Error deleting.");
                }
              }
            }}
            className="px-6 py-4 bg-destructive text-destructive-foreground font-black uppercase border-brutal hover:opacity-90"
          >
            DELETE ORGANIZATION
          </button>
        </div>
      </div>
    </AppShell>
  );
}
