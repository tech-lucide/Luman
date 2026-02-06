import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Download } from "lucide-react";

const ImageComponent = ({ node }: NodeViewProps) => {
  const { src, alt, title, width, height } = node.attrs;

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = alt || title || "image";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed", error);
      window.open(src, "_blank");
    }
  };

  return (
    <NodeViewWrapper className="relative inline-block group mb-2 border rounded-lg overflow-hidden border-muted">
      <img
        src={src}
        alt={alt}
        title={title}
        style={{
          width: width ? `${width}px` : "auto",
          height: height ? `${height}px` : "auto",
          maxWidth: "100%",
        }}
        className="block"
      />
      
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
        <button
          type="button"
          onClick={handleDownload}
          className="pointer-events-auto bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-3 rounded-full transition-all transform scale-90 group-hover:scale-100 shadow-xl"
          title="Download image"
        >
          <Download className="h-6 w-6" />
        </button>
      </div>
    </NodeViewWrapper>
  );
};

const UpdatedImage = Image.extend({
  name: "image",
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent);
  },
});

export default UpdatedImage;
