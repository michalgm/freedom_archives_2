import { CacheProvider } from '@emotion/react';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { Box, CssBaseline, LinearProgress, Typography } from "@mui/material";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ConfirmProvider } from "material-ui-confirm";
import { ReactNode, useMemo } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "src/App.scss";
import { theme } from "src/theme.jsx";

import "src/utils/logger";
import createEmotionCache from './createEmotionCache.js';

declare module '@mui/material/styles' {
  interface PaletteColor {
    publicPrimary?: string;
  }

  interface SimplePaletteColorOptions {
    publicPrimary?: string;
  }
}

declare module '@mui/material/LinearProgress' {
  interface LinearProgressPropsColorOverrides {
    publicPrimary: true;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function loader({ request }) {
  const url = new URL(request.url);
  return { baseUrl: `${url.protocol}//${url.host}` };
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <meta name="theme-color" content="#000000" />
        <meta name="emotion-insertion-point" content="" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
        />

        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}


function LayoutProviders({ children }: { children: ReactNode }) {
  const cache = useMemo(() => createEmotionCache(), []);

  return (
    <CacheProvider value={cache}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </StyledEngineProvider>
    </CacheProvider>
  );
}

export function HydrateFallback() {

  return  (<LayoutProviders>
    <Box sx={{  display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
      <Box sx={{ width: '50%' }}>
        <Typography variant="h6" align="center" gutterBottom>
          Loading Freedom Archives Search
        </Typography>
        <LinearProgress color="publicPrimary"/>
      </Box>
    </Box>
  </LayoutProviders>);
}

export default function Root() {
  return (
    <LayoutProviders>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ConfirmProvider defaultOptions={{ confirmationButtonProps: { variant: "contained" } }}>
          <Outlet />
        </ConfirmProvider>
      </LocalizationProvider>
    </LayoutProviders>
  );
}
