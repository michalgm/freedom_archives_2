/** @type { import('@storybook/react').Preview } */
// import "@fontsource/material-icons";
// import "@fontsource/roboto/300.css";
// import "@fontsource/roboto/400.css";
// import "@fontsource/roboto/500.css";
// import "@fontsource/roboto/700.css";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { initialize, mswLoader } from "msw-storybook-addon";

import { StateProvider } from "../src/appContext";
import Authentication from "../src/Authentication";
import { theme } from "../src/theme";

import "../src/utils/logger";
import { handlers } from "./mocks/handlers";

initialize({
  waitUntilReady: true,
  onUnhandledRequest: "warn", // Don't show errors for unhandled requests
});

const preview = {
  parameters: {
    controls: {
      extended: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    msw: {
      handlers,
    },
  },
  loaders: [mswLoader],
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <StateProvider>
            <Authentication />
            <Story />
          </StateProvider>
        </LocalizationProvider>
      </ThemeProvider>
    ),
  ],
};

export default preview;
