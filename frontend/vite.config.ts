import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  publicDir: path.resolve(__dirname, "public"),
  build: {
    outDir: path.resolve(__dirname, "../dist"),
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 5173,
    host: true,
  },
});
