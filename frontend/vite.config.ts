import { reactRouter } from "@react-router/dev/vite";
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import commonjs from "vite-plugin-commonjs";
import viteTsconfigPaths from "vite-tsconfig-paths";
import { defineProject } from "vitest/config";

const dirname
  = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  // depending on your application, base can also be "/"
  base: "/",
  define: {
    // This will be replaced at build time
    __WDYR_ENABLED__: mode === 'development',
  },
  esbuild: {
    // Limit esbuild parallelism to avoid thread exhaustion in constrained environments
    logLevel: 'info',
  },
  build: {
    sourcemap: mode === "development",
  },
  plugins: [
    // react(),
    reactRouter(),
    // {
    //   name: "mui-icons-transformer",
    //   transform(code, id) {
    //     if (id.endsWith(".jsx") || id.endsWith(".tsx") || id.endsWith(".js") || id.endsWith(".ts")) {
    //       // Transform destructured MUI icon imports to direct imports
    //       return code.replace(
    //         /import\s+\{\s*([\w\s,]+)\s*\}\s+from\s+['"]@mui\/icons-material['"]/g,
    //         (_match, icons) => {
    //           return icons
    //             .split(",")
    //             .map((icon) => `import ${icon.trim()} from '@mui/icons-material/${icon.trim()}';`)
    //             .join("\n");
    //         }
    //       );
    //     }
    //   },
    // },
    viteTsconfigPaths(),
    commonjs(),
  ],
  server: {
    port: 4040,
    proxy: {
      "/api": "http://localhost:3030",
      "/images/": "http://localhost:3030",
    },
  },
  test: {
    // Use `workspace` field in Vitest < 3.2
    projects: [
      defineProject({
        // extends: true,
        plugins: [
          storybookTest({
            // The location of your Storybook config, main.js|ts
            configDir: path.join(dirname, '.storybook'),
            // This should match your package.json script to run Storybook
            // The --ci flag will skip prompts and not open a browser
            storybookScript: 'yarn storybook --ci',
          }),
        ],
        test: {
          name: 'storybook',
          // Enable browser mode
          browser: {
            enabled: true,
            // Make sure to install Playwright
            provider: playwright({}),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['./.storybook/vitest.setup.js'],
        },
      }),
    ],
  },
}));
