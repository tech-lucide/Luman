"use client";

import { EditorBubble, useEditor } from "novel";
import { Download } from "lucide-react";
import { type FC } from "react";

export const ImageBubbleMenu: FC = () => {
  const { editor } = useEditor();

  if (!editor || !editor.isActive("image")) return null;

  const handleDownload = () => {
    const attrs = editor.getAttributes("image");
    if (attrs.src) {
      const link = document.createElement("a");
      link.href = attrs.src;
      // Try to get filename from URL
      const filename = attrs.src.split("/").pop() || "image";
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <EditorBubble
      tippyOptions={{
        placement: "top",
      }}
      className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
    >
      <button
        type="button"
        onClick={handleDownload}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Download className="h-4 w-4" />
        <span>Download</span>
      </button>
    </EditorBubble>
  );
};
