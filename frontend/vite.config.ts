import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import commonjs from "vite-plugin-commonjs";
import viteTsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // depending on your application, base can also be "/"
  base: "/",
  plugins: [
    react(),
    {
      name: "mui-icons-transformer",
      transform(code, id) {
        if (id.endsWith(".jsx") || id.endsWith(".tsx") || id.endsWith(".js") || id.endsWith(".ts")) {
          // Transform destructured MUI icon imports to direct imports
          return code.replace(
            /import\s+\{\s*([\w\s,]+)\s*\}\s+from\s+['"]@mui\/icons-material['"]/g,
            (_match, icons) => {
              return icons
                .split(",")
                .map((icon) => `import ${icon.trim()} from '@mui/icons-material/${icon.trim()}';`)
                .join("\n");
            }
          );
        }
      },
    },
    viteTsconfigPaths(),
    commonjs(),
  ],
  server: {
    port: 4040,
    proxy: {
      "/api": "http://localhost:3030",
      "/images/": "http://localhost:3030",
    },
  }
});
