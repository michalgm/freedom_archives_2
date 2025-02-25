import "./App.scss";

import { Content, EdgeTrigger, Header, Root } from "@mui-treasury/layout";
import { Box, Button, Container, CssBaseline, Icon, Toolbar, Typography } from "@mui/material";
import { StyledEngineProvider, ThemeProvider, createTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import React from "react";
import { Link, BrowserRouter as Router } from "react-router-dom";
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

// console.log(theme)
const scheme = {
  header: {
    config: {
      xs: {
        position: "fixed",
        height: 64,
        clipped: true,
      },
    },
  },
  leftEdgeSidebar: {
    autoCollapse: "sm",
    config: {
      xs: {
        variant: "temporary",
        width: 256,
        collapsible: false,
        persistentBehavior: "fit",
      },
      md: {
        variant: "permanent",
        persistentBehavior: "fit",
        width: 256,
        collapsible: false,
      },
    },
  },
  initialState: {
    leftEdgeSidebar: {
      open: true,
    },
  },
};

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
                  <Root scheme={scheme}>
                    <Layout />
                  </Root>
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
  // const style = {
  // height: "100vh",
  // marginLeft: 0,

  //   backgroundColor: "#efefef",
  // };
  return (
    <Box className="App" sx={{ backgroundColor: "#efefef", height: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar />
      {isAuthenticated && <Sidebar />}
      <Content
        sx={{
          backgroundColor: "#efefef",
        }}
        className="FlexContainer"
        style={style}
      >
        <Loading fullPage>
          <Main />
        </Loading>
      </Content>
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
    <Header color="primary">
      <Toolbar className="topnav">
        <EdgeTrigger target={{ anchor: "left", field: "open" }}>
          {(open, setOpen) => <Icon onClick={() => setOpen(!open)}>{open ? "keyboard_arrow_left" : "menu"}</Icon>}
        </EdgeTrigger>
        <Breadcrumbs />
        <Logout />
      </Toolbar>
    </Header>
  );
}

function Main() {
  const {
    state: { isAuthenticated },
  } = useStateValue();
  // console.log(isAuthenticated);
  // const title = isAuthenticated ? 'Welcome' : 'Login'
  // <h1>{title}</h1>
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
