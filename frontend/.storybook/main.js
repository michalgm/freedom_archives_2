// This file has been automatically migrated to valid ESM format by Storybook.
import react from "@vitejs/plugin-react";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "path";
import { mergeConfig } from "vite";

const require = createRequire(import.meta.url);
const srcDir = fileURLToPath(new URL("../src", import.meta.url));

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, "package.json")));
}

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    // getAbsolutePath("@chromatic-com/storybook"),
    getAbsolutePath("@storybook/addon-vitest"),
    getAbsolutePath("@storybook/addon-themes"),
    getAbsolutePath("@storybook/addon-docs"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
  babel: async (options) => ({
    ...options,
    presets: [...options.presets, "@babel/preset-react"],
  }),

  async viteFinal(viteConfig) {
    return mergeConfig(viteConfig, {
      plugins: [react()],
      esbuild: {
        jsx: "automatic",
      },
      resolve: {
        alias: {
          src: srcDir,
        },
      },
    });
  },

  // async viteFinal(config) {
  //   // Customize the Vite config
  //   return {
  //     ...config,
  //     server: {
  //       ...config.server,
  //       proxy: {
  //         // Proxy API requests to your dev server
  //         "/api": {
  //           target: "http://localhost:4040/api", // Your API server URL
  //           changeOrigin: true,
  //           secure: false,
  //         },
  //       },
  //     },
  //   };
  // },
};
export default config;
