"use client";

import AppShell from "@/components/layouts/app-shell";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsContent />
    </AppShell>
  );
}

function SettingsContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string; full_name?: string } | null>(null);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser({
              id: data.user.userId,
              email: data.user.email,
              full_name: data.user.ownerName, // ownerName comes from full_name or email
            });
            // Try to get the raw metadata name if possible, but session uses ownerName logic
            // Ideally we should have the raw meta name.
            // Let's rely on what the session gave us for now or fetch updated profile
            setFullName(data.user.ownerName || "");
          }
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName }),
      });

      if (res.ok) {
        toast.success("Profile updated!");
        router.refresh(); // Refresh to update server components/session
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update profile");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 md:p-12 max-w-7xl mx-auto">
        <div className="text-lg font-bold uppercase animate-pulse">LOADING SETTINGS...</div>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 max-w-3xl mx-auto">
      <h1 className="text-4xl font-black uppercase mb-12 border-l-8 border-foreground pl-6">SETTINGS</h1>

      <div className="space-y-12">
        {/* Profile Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black uppercase border-b-4 border-foreground pb-2">PROFILE</h2>

          <div className="border-brutal-thick bg-card p-8">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-black uppercase opacity-70">EMAIL ADDRESS</label>
                <div className="font-mono text-lg p-3 bg-muted border-brutal w-full opacity-60 cursor-not-allowed">
                  {user?.email}
                </div>
                <p className="text-xs opacity-50 uppercase">Email cannot be changed.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-black uppercase opacity-70">DISPLAY NAME</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-3 font-bold text-lg bg-background border-brutal focus:ring-2 focus:ring-accent"
                  placeholder="YOUR NAME"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-4 bg-foreground text-background font-black uppercase border-brutal hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "SAVING..." : "SAVE CHANGES"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
