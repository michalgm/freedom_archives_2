import { dirname, join } from "path";

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
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@chromatic-com/storybook"),
    getAbsolutePath("@storybook/experimental-addon-test"),
    getAbsolutePath("@storybook/addon-themes"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
  babel: async (options) => ({
    ...options,
    presets: [...options.presets, "@babel/preset-react"],
  }),

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
