import { AppBar, Box, Button, Container, CssBaseline, Icon, Stack, Toolbar, Typography } from "@mui/material";
import { StyledEngineProvider, ThemeProvider, createTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import React from "react";
import { Link, BrowserRouter as Router } from "react-router-dom";
import "./App.scss";
import { StateProvider, useStateValue } from "./appContext";

import { ConfirmProvider } from "material-ui-confirm";
import { app } from "./api";
import Authentication from "./Authentication";
import Breadcrumbs from "./components/Breadcrumbs";
import ErrorBoundary from "./components/ErrorBoundary";
import Errors from "./components/Errors";
import Notifications from "./components/Notifications";
import Routes from "./Routes";
import Loading from "./views/Loading";
import Sidebar from "./views/Sidebar";

const DRAWERWIDTH = 256;

export const theme = createTheme({
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
              <ConfirmProvider>
                <Router
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <Layout />
                </Router>
              </ConfirmProvider>
            </StateProvider>
          </LocalizationProvider>
        </CssBaseline>
      </ThemeProvider>
    </StyledEngineProvider>
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
  const {
    state: { isAuthenticated },
  } = useStateValue();
  const loadingStyle = loading ? { opacity: 0.6, marginTop: "-4px" } : {};
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
        <Routes isAuthenticated={isAuthenticated} />
      </ErrorBoundary>
      <Notifications />
    </Container>
  );
}
export default App;
