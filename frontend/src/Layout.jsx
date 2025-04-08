import { AppBar, Box, Button, Container, Icon, Stack, Toolbar, Typography } from "@mui/material";
import { Link, Outlet, useLocation } from "react-router";
import logger from "src/utils/logger";
import { app } from "./api";
import { useStateValue } from "./appContext";
import Authentication from "./Authentication";
import Breadcrumbs from "./components/Breadcrumbs";
import ErrorBoundary from "./components/ErrorBoundary";
import Errors from "./components/Errors";
import Notifications from "./components/Notifications";
import Loading from "./views/Loading";
import Sidebar from "./views/Sidebar";

const DRAWERWIDTH = 256;

export default function Layout() {
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
export function Logout() {
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

export function Main({ loading }) {
  // const {
  //   state: { isAuthenticated },
  // } = useStateValue();
  const location = useLocation();
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
