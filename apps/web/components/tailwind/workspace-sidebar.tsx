export function WorkspaceSidebar() {
  return (
    <aside className="w-[240px] border-r bg-muted/40 p-4">
      <h2 className="font-semibold mb-4">notaprompt</h2>

      <nav className="space-y-2 text-sm">
        <div className="font-medium">Workspace</div>
        <button className="block text-left w-full hover:underline">
          All Docs
        </button>
        <button className="block text-left w-full hover:underline">
          AI Prompts
        </button>
        <button className="block text-left w-full hover:underline">
          Knowledge Base
        </button>
      </nav>
    </aside>
  );
}
