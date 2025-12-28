"use client";

import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { validate as uuidValidate } from "uuid";


export default function NewNotePage() {
  const router = useRouter();
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;

  const [loading, setLoading] = useState(false);

  async function createNote(templateType: string) {
  setLoading(true);

  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workspaceId,
      title: templateType,
      templateType,
    }),
  });
  if (!workspaceId || workspaceId.length < 30) {
  throw new Error("Invalid workspaceId — must be UUID");
}

  const data = await res.json();

  if (!res.ok) {
    console.error("CREATE NOTE FAILED:", data);
    alert(`Failed to create note:\n${data.error}`);
    setLoading(false);
    return;
  }

  router.push(`/workspace/${workspaceId}/note/${data.id}`);
}


  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-lg font-semibold mb-4">
        Create a new note
      </h1>
      <div className="flex items-center gap-2 mb-6">
  <button
    onClick={() => router.back()}
    className="text-sm text-muted-foreground hover:text-foreground transition"
  >
    ← Back
  </button>

  <h1 className="text-lg font-semibold">New Note</h1>
</div>
      <div className="space-y-2">
        {["Daily Update", "Task Breakdown", "Brainstorm"].map(
          (type) => (
            <button
              key={type}
              onClick={() => createNote(type)}
              disabled={loading}
              className="block w-full text-left rounded-lg border p-4 hover:bg-muted disabled:opacity-50"
            >
              {type}
            </button>
          )
        )}
      </div>
    </div>
  );
}
