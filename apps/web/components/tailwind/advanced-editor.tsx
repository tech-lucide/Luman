"use client";

import {
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  EditorRoot,
  ImageResizer,
  type JSONContent,
  handleCommandNavigation,
  handleImageDrop,
  handleImagePaste,
} from "novel";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { defaultExtensions } from "./extensions";
import { ColorSelector } from "./selectors/color-selector";
import { LinkSelector } from "./selectors/link-selector";
import { MathSelector } from "./selectors/math-selector";
import { NodeSelector } from "./selectors/node-selector";
import { Separator } from "./ui/separator";

import GenerativeMenuSwitch from "./generative/generative-menu-switch";
import { uploadFn } from "./image-upload";
import { TextButtons } from "./selectors/text-buttons";
import { slashCommand, suggestionItems } from "./slash-command";
import { Check, Clock } from "lucide-react";

const hljs = require("highlight.js");

const extensions = [...defaultExtensions, slashCommand];

interface AdvancedEditorProps {
  initialContent: any;
  noteId: string;
}

const TailwindAdvancedEditor = ({
  initialContent,
  noteId,
}: AdvancedEditorProps) => {
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [charsCount, setCharsCount] = useState<number | undefined>();

  const [openNode, setOpenNode] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [openAI, setOpenAI] = useState(false);

  // Apply Codeblock Highlighting on the HTML from editor.getHTML()
  const highlightCodeblocks = (content: string) => {
    const doc = new DOMParser().parseFromString(content, "text/html");
    doc.querySelectorAll("pre code").forEach((el) => {
      hljs.highlightElement(el);
    });
    return new XMLSerializer().serializeToString(doc);
  };

  /**
   * 🔥 AUTO-SAVE TO SUPABASE (DEBOUNCED)
   */
  const debouncedSave = useDebouncedCallback(
    async (editor) => {
      const json = editor.getJSON();
      setCharsCount(editor.storage.characterCount.words());

      await fetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: json,
          html: highlightCodeblocks(editor.getHTML()),
        }),
      });

      setSaveStatus("Saved");
    },
    800
  );

  return (
    <div className="relative w-full mx-auto">
      {/* Clean Status Bar */}
      <div className="flex items-center justify-end gap-3 mb-4">
        {saveStatus === "Saved" ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400">
            <Check className="h-3 w-3" />
            <span>Saved</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Clock className="h-3 w-3" />
            <span>Saving...</span>
          </div>
        )}
        
        {charsCount !== undefined && (
          <div className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {charsCount} {charsCount === 1 ? "word" : "words"}
          </div>
        )}
      </div>

      <EditorRoot>
        <EditorContent
          initialContent={initialContent}
          extensions={extensions}
          className="relative min-h-[600px] w-full rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md"
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) =>
                handleCommandNavigation(event),
            },
            handlePaste: (view, event) =>
              handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) =>
              handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              class:
                "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full px-8 py-6",
            },
          }}
          onUpdate={({ editor }) => {
            const json = editor.getJSON();

            // 🔒 Prevent saving empty document
            if (!json?.content?.length) return;

            setSaveStatus("Saving…");
            debouncedSave(editor);
          }}
          slotAfter={<ImageResizer />}
        >
          <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-xl border border-border bg-popover px-1 py-2 shadow-xl">
            <EditorCommandEmpty className="px-2 text-sm text-muted-foreground">
              No results
            </EditorCommandEmpty>
            <EditorCommandList>
              {suggestionItems.map((item) => (
                <EditorCommandItem
                  key={item.title}
                  value={item.title}
                  onCommand={(val) => item.command(val)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent aria-selected:bg-accent"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/50">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>

          <GenerativeMenuSwitch
            open={openAI}
            onOpenChange={setOpenAI}
          >
            <Separator orientation="vertical" />
            <NodeSelector open={openNode} onOpenChange={setOpenNode} />
            <Separator orientation="vertical" />
            <LinkSelector open={openLink} onOpenChange={setOpenLink} />
            <Separator orientation="vertical" />
            <MathSelector />
            <Separator orientation="vertical" />
            <TextButtons />
            <Separator orientation="vertical" />
            <ColorSelector
              open={openColor}
              onOpenChange={setOpenColor}
            />
          </GenerativeMenuSwitch>
        </EditorContent>
      </EditorRoot>
    </div>
  );
};

export default TailwindAdvancedEditor;
