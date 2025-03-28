import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// import commonjs from "vite-plugin-commonjs";
import viteTsconfigPaths from "vite-tsconfig-paths";
export default defineConfig({
  // depending on your application, base can also be "/"
  base: "/",
  plugins: [react(), viteTsconfigPaths()],
  // plugins: [react(), viteTsconfigPaths(), commonjs(),],
  server: {
    port: 4040,
    proxy: {
      "/api": "http://localhost:3030",
      "/images/": "http://localhost:3030",
    },
  },
});
