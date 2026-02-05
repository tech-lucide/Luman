import Link from "next/link";
import { useParams } from "next/navigation";

export function WorkspaceSidebar() {
  const params = useParams();
  const workspaceId = params?.workspaceId;

  return (
    <aside className="w-[300px] border-r-4 border-foreground bg-background p-8 flex flex-col min-h-screen">
      <div className="space-y-12">
        <h2 className="text-3xl font-black uppercase pb-4">NOTAPROMPT</h2>

        <nav className="space-y-2">
          {workspaceId ? (
            <>
              <div className="text-xs font-black uppercase tracking-widest mb-6 opacity-50">WORKSPACE</div>
              <Link
                href={`/workspace/${workspaceId}`}
                className="block px-6 py-4 text-lg font-black uppercase border-brutal hover-brutal bg-background"
              >
                ALL DOCS
              </Link>
              <Link
                href={`/workspace/${workspaceId}/calendar`}
                className="block px-6 py-4 text-lg font-black uppercase border-brutal hover-brutal bg-background"
              >
                CALENDAR
              </Link>
            </>
          ) : (
            <div className="text-sm font-bold uppercase px-6 py-4 border-brutal bg-muted">SELECT WORKSPACE</div>
          )}

          <div className="text-xs font-black uppercase tracking-widest mb-6 mt-8 opacity-50">ORGANIZATION</div>
          <Link
            href="/calendar"
            className="block px-6 py-4 text-lg font-black uppercase border-brutal hover-brutal bg-background"
          >
            ALL EVENTS
          </Link>
          <Link
            href="/dashboard/tasks"
            className="block px-6 py-4 text-lg font-black uppercase border-brutal hover-brutal bg-background"
          >
            MY TASKS
          </Link>

          <button
            type="button"
            className="block w-full text-left px-6 py-4 text-lg font-black uppercase border-brutal bg-muted opacity-50 mt-8"
          >
            AI PROMPTS (SOON)
          </button>
        </nav>
      </div>
    </aside>
  );
}
