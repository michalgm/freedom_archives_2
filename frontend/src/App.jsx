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
      <Stack direction="row" sx={{ flex: 1 }}>
        {isAuthenticated && (
          <Sidebar
            variant="permanent"
            sx={{
              width: DRAWERWIDTH,
            }}
            slotProps={{
              paper: { sx: { width: DRAWERWIDTH } },
            }}
          />
        )}
        <Box
          sx={{
            backgroundColor: "#efefef",
          }}
          className="FlexContainer"
          style={style}
        >
          <Loading fullPage>
            <Main />
          </Loading>
        </Box>
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
    <AppBar
      color="primary"
      position="fixed"
      elevation={0}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, position: "relative" }}
    >
      <Toolbar className="topnav">
        <Breadcrumbs />
        <Logout />
      </Toolbar>
    </AppBar>
  );
}

function Main() {
  const {
    state: { isAuthenticated },
  } = useStateValue();
  return (
    <Container maxWidth="xl" sx={{ paddingBottom: "8px" }} className="FlexContainer">
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
