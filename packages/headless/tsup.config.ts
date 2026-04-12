import { defineConfig, Options } from "tsup";

export default defineConfig((options: Options) => ({
  entry: ["src/index.ts"],
  banner: {
    js: "'use client'",
  },
  minify: true,
  format: ["cjs", "esm"],
  dts: false,
  clean: true,
  external: [
    "react",
    "react-dom",
    "lucide-react",
    "@tiptap/core",
    "@tiptap/react",
    "@tiptap/pm",
    "@radix-ui/react-slot",
  ],
  ...options,
}));
