import { Node as TiptapNode, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { Download, File, FileText, FileSpreadsheet, FileVideo, FileAudio, FileArchive, FileImage } from "lucide-react";

const getFileIcon = (filetype: string) => {
  if (filetype.startsWith("image/")) return <FileImage className="h-8 w-8" />;
  if (filetype.startsWith("video/")) return <FileVideo className="h-8 w-8" />;
  if (filetype.startsWith("audio/")) return <FileAudio className="h-8 w-8" />;
  if (filetype.includes("pdf")) return <FileText className="h-8 w-8" />;
  if (filetype.includes("spreadsheet") || filetype.includes("excel")) return <FileSpreadsheet className="h-8 w-8" />;
  if (filetype.includes("zip") || filetype.includes("rar") || filetype.includes("7z")) return <FileArchive className="h-8 w-8" />;
  return <File className="h-8 w-8" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileAttachmentComponent = ({ node }: NodeViewProps) => {
  const { url, filename, filesize, filetype } = node.attrs;

  const handleDownload = () => {
    const link = document.body.appendChild(document.createElement("a"));
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    link.click();
    document.body.removeChild(link);
  };

  return (
    <NodeViewWrapper className="file-attachment-wrapper">
      <div className="flex items-center gap-4 p-4 my-2 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors group">
        <div className="flex-shrink-0 text-muted-foreground">
          {getFileIcon(filetype)}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{filename}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(filesize)}
          </p>
        </div>
        
        <button
          type="button"
          onClick={handleDownload}
          className="flex-shrink-0 p-2 rounded-md hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
          title="Download file"
        >
          <Download className="h-5 w-5" />
        </button>
      </div>
    </NodeViewWrapper>
  );
};

export interface FileAttachmentOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fileAttachment: {
      setFileAttachment: (options: { 
        url: string; 
        filename: string; 
        filesize: number; 
        filetype: string;
      }) => ReturnType;
    };
  }
}

export const FileAttachment = TiptapNode.create<FileAttachmentOptions>({
  name: "fileAttachment",

  group: "block",

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileAttachmentComponent);
  },

  addAttributes() {
    return {
      url: {
        default: null,
      },
      filename: {
        default: null,
      },
      filesize: {
        default: null,
      },
      filetype: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-file-attachment]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-file-attachment": "" })];
  },

  addCommands() {
    return {
      setFileAttachment:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
