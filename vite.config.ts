import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// On this machine the working folder can arrive as c:\ or C:\; Vite then loads React twice
