import { AppBar, Box, Button, Container, CssBaseline, Icon, Stack, Toolbar, Typography } from "@mui/material";
import { StyledEngineProvider, ThemeProvider, createTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  Link,
  Outlet,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  useLocation,
} from "react-router-dom";
import logger from "src/utils/logger";
import "./App.scss";
import { StateProvider, useStateValue } from "./appContext";

import { ConfirmProvider } from "material-ui-confirm";
import { useMemo } from "react";
import Routes from "src/Routes";
import { app } from "./api";
import Authentication from "./Authentication";
import Breadcrumbs from "./components/Breadcrumbs";
import ErrorBoundary from "./components/ErrorBoundary";
import Errors from "./components/Errors";
import Notifications from "./components/Notifications";
import Loading from "./views/Loading";
import Sidebar from "./views/Sidebar";

const DRAWERWIDTH = 256;

export const theme = createTheme({
  cssVariables: true,
  typography: {
    h1: { fontSize: "2.5rem" },
    h2: { fontSize: "2.2rem" },
    h3: { fontSize: "1.9rem" },
    h4: { fontSize: "1.6rem" },
    h5: { fontSize: "1.4rem" },
    h6: { fontSize: "1.2rem" },
  },
  components: {
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: "10px",
        },
      },
      defaultProps: {},
    },
    MuiFormControl: {
      // variants: [
      //   {
      //     props: { size: "x-small" },
      //     style: xSmallInputStyles,
      //   },
      // ],
      styleOverrides: {
        root: {
          "& .MuiFormLabel-colorSuccess": {
            color: "var(--mui-palette-success-main)", // Success color for default state
          },
          "&:has(.MuiCheckbox-colorSuccess).MuiFormControl-root": {
            width: "100%",
            outline: "1px solid var(--mui-palette-success-main)",
            borderRadius: "2px",
            backgroundColor: "rgba(var(--mui-palette-success-lightChannel) / 0.1) !important",
          },
          "& .MuiCheckbox-colorSuccess": {
            color: "var(--mui-palette-success-main)", // Success color for default state
          },
          "& .MuiInputBase-colorSuccess": {
            "&": {
              backgroundColor: "rgba(var(--mui-palette-success-lightChannel) / 0.1) !important",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--mui-palette-success-main)", // Success color for default state
            },
          },
          "& .MuiFormLabel-colorWarning": {
            color: "var(--mui-palette-warning-main)", // Success color for default state
          },
          "&:has(.MuiCheckbox-colorWarning).MuiFormControl-root": {
            width: "100%",
            outline: "1px solid var(--mui-palette-warning-main)",
            borderRadius: "2px",
            backgroundColor: "rgba(var(--mui-palette-warning-lightChannel) / 0.1) !important",
          },
          "& .MuiCheckbox-colorWarning": {
            color: "var(--mui-palette-warning-main)", // Success color for default state
          },
          "& .MuiInputBase-colorWarning": {
            "&": {
              backgroundColor: "rgba(var(--mui-palette-warning-lightChannel) / 0.1) !important",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--mui-palette-warning-main)", // Success color for default state
            },
          },
        },
      },
    },
  },
});
export const darkTheme = createTheme({
  palette: {
    type: "dark",
  },
});

function App() {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <StateProvider>
              <ConfirmProvider defaultOptions={{ confirmationButtonProps: { variant: "contained" } }}>
                <Router />
              </ConfirmProvider>
            </StateProvider>
          </LocalizationProvider>
        </CssBaseline>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

function Router() {
  const {
    state: { isAuthenticated },
  } = useStateValue();

  const router = useMemo(
    () =>
      createBrowserRouter(createRoutesFromElements(<Route element={<Layout />}>{Routes({ isAuthenticated })}</Route>), {
        future: {
          v7_relativeSplatPath: true,
        },
      }),
    [isAuthenticated]
  );
  return (
    <RouterProvider
      key={isAuthenticated}
      router={router}
      future={{
        v7_startTransition: true,
      }}
    />
  );
}

function Layout() {
  const {
    state: { isAuthenticated },
  } = useStateValue();
  const style = isAuthenticated
    ? {}
    : {
        marginLeft: 0,
        width: "100%",
      };
  logger.log("Layout RENDER");
  return (
    <Box className="App" sx={{ backgroundColor: "#efefef", height: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar />
      <Stack direction="row" sx={{ overflow: "hidden", height: "100%" }}>
        {isAuthenticated && (
          <Sidebar
            variant="permanent"
            className="sidebar"
            sx={{
              width: DRAWERWIDTH,
            }}
            slotProps={{
              paper: { sx: { width: DRAWERWIDTH } },
            }}
          />
        )}
        <Stack
          sx={{
            backgroundColor: "#efefef",
          }}
          className="FlexContainer"
          style={style}
        >
          <Toolbar />
          <Loading>{({ loading }) => <Main loading={loading} />}</Loading>
        </Stack>
      </Stack>
    </Box>
  );
}

function Logout() {
  const {
    state: { isAuthenticated, user },
  } = useStateValue();
  return isAuthenticated ? (
    <div className="logout">
      <Typography variant="caption">
        <Icon>person</Icon>
        {user.firstname} {user.lastname}
      </Typography>
      <Button color="inherit" component={Link} to="/login" onClick={app.logout}>
        Logout
      </Button>
    </div>
  ) : (
    ""
  );
}

function NavBar() {
  return (
    <AppBar color="primary" position="fixed" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar className="topnav">
        <Breadcrumbs />
        <Logout />
      </Toolbar>
    </AppBar>
  );
}

function Main({ loading }) {
  // const {
  //   state: { isAuthenticated },
  // } = useStateValue();
  const { location } = useLocation();
  const loadingStyle = loading ? { opacity: 0.6, marginTop: "-4px" } : {};
  logger.log("Main RENDER");

  return (
    <Container
      maxWidth="xl"
      sx={{
        opacity: 1,
        transition: "opacity 0.3s",
        paddingBottom: "8px",
        overflow: "hidden",
        flex: "1 1 auto",

        ...loadingStyle,
      }}
    >
      <Authentication />
      <Errors />
      <ErrorBoundary>
        <Outlet context={{ location }} />
      </ErrorBoundary>
      <Notifications />
    </Container>
  );
}
export default App;
