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
      
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={handleDownload}
          className="bg-black/50 hover:bg-black/70 backdrop-blur-md text-white p-2 rounded-lg transition-all shadow-xl"
          title="Download image"
        >
          <Download className="h-5 w-5" />
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
