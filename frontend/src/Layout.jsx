import { AppBar, Box, Button, Container, Icon, Stack, Toolbar, Typography } from "@mui/material";
import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { useAppStore, useAuth } from "src/stores";
import logger from "src/utils/logger";

import { app } from "./api";
import Authentication from "./Authentication";
import Breadcrumbs from "./components/Breadcrumbs";
import ErrorBoundary from "./components/ErrorBoundary";
import Notifications from "./components/Notifications";
import Loading from "./views/Loading";
import Sidebar from "./views/Sidebar";

const DRAWERWIDTH = 256;

export default function Layout() {
  const { isAuthenticated } = useAuth();
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
      <NavigationListener />
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
          <Loading>
            <Main />
          </Loading>
        </Stack>
      </Stack>
    </Box>
  );
}

function NavigationListener() {
  const location = useLocation();
  const removeNotificationsOnNavigate = useAppStore((state) => state.removeNotificationsOnNavigate);

  useEffect(() => {
    // Clear navigation notifications when location changes
    removeNotificationsOnNavigate();
  }, [location, removeNotificationsOnNavigate]);

  return null;
}

export function Logout() {
  const { isAuthenticated, user } = useAuth();
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

export function Main() {
  const loading = useAppStore((state) => state.loading);

  const loadingStyle = loading
    ? {
        opacity: 0.6,
        // marginTop: "-2px",
      }
    : {};
  logger.log("Main RENDER", location);

  return (
    <Container
      maxWidth="xl"
      sx={{
        opacity: 1,
        transition: "opacity 0.3s",
        paddingBottom: "8px",
        overflow: "hidden",
        flex: "1 1 auto",
        position: "relative",
        ...loadingStyle,
      }}
    >
      <Notifications />
      <Authentication />
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </Container>
  );
}

// Main.whyDidYouRender = true;
