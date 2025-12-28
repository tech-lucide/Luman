import Link from "next/link";
import AppShell from "@/components/layouts/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();

  const { data: workspaces, error } = await supabase
    .from("workspaces")
    .select("id, owner_name, role")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <AppShell>
      <div className="p-6">
        <h1 className="text-lg font-semibold mb-4">
          All Workspaces
        </h1>

        {(!workspaces || workspaces.length === 0) && (
          <div className="text-sm text-muted-foreground">
            No workspaces found. Seed the database first.
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {workspaces?.map((ws) => (
            <Link
              key={ws.id}
              href={`/workspace/${ws.id}`}
              className="rounded-lg border bg-card p-4 hover:bg-muted transition"
            >
              <div className="font-medium">
                {ws.owner_name}
              </div>
              <div className="text-sm text-muted-foreground">
                Role: {ws.role}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
