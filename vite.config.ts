import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// On this machine the working folder can arrive as c:\ or C:\; Vite then loads React twice
// (a blank page). Pinning the root with an upper-case drive letter keeps one copy.
const root = fileURLToPath(new URL(".", import.meta.url)).replace(/^[a-z]:/, (d) => d.toUpperCase());

export default defineConfig({
  root,
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": `${root}src` },
    dedupe: ["react", "react-dom"],
  },
  // the deck ships its screenshots as base64 inside the JS (about 370 kB), so the one chunk is large on purpose
