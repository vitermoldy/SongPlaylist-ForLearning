import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// On this machine the working folder can arrive as c:\ or C:\; Vite then loads React twice
// (a blank page). Pinning the root with an upper-case drive letter keeps one copy.
const root = fileURLToPath(new URL(".", import.meta.url)).replace(/^[a-z]:/, (d) => d.toUpperCase());

export default defineConfig(({ mode }) => {
  // the server (npm run server) keeps the lists in MySQL; dev and preview forward /api to it.
});
