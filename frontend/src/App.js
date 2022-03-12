import './App.scss';

import {
  Button,
  Container,
  CssBaseline,
  Icon,
  Toolbar,
  Typography
} from '@mui/material';
import {
  Content,
  EdgeTrigger,
  Header,
  Root,
} from '@mui-treasury/layout';
import {
  Link,
  BrowserRouter as Router,
} from 'react-router-dom';
import { StateProvider, useStateValue } from './appContext';
import { StyledEngineProvider, ThemeProvider, createTheme } from '@mui/material/styles';

import Authentication from './Authentication';
import Breadcrumbs from './components/Breadcrumbs';
import Errors from './components/Errors';
import Loading from './views/Loading';
import React from 'react';
import Routes from './Routes'
import Sidebar from './views/Sidebar';
import { app } from './api';

const theme = createTheme();
// console.log(theme)
const scheme = {
  header: {
    config: {
      xs: {
        position: "fixed",
        height: 64,
        clipped: true
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
  }
};

function App() {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <StateProvider>
          <Router>
            <Root scheme={scheme}>
              <CssBaseline>
                <Layout />
              </CssBaseline>
            </Root>
          </Router>
        </StateProvider>
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
      width: '100%',
    };
  return (
    <div className="App">
      <NavBar />
      {isAuthenticated && <Sidebar />}
      <Content style={style}>
        <Loading>
          <Main />
        </Loading>
      </Content>
    </div>
  );
}

function Logout() {
  const {
    state: { isAuthenticated, user },
  } = useStateValue();
  return isAuthenticated ? (
    <div className='logout'>
      <Typography variant="caption">
        <Icon>person</Icon>
        {user.firstname} {user.lastname}
      </Typography>
      <Button color="inherit" component={Link} to="/login" onClick={app.logout}>
        Logout
      </Button>
    </div>
  ) : (
    ''
  );
}

function NavBar() {
  return (
    <Header color="primary">
      <Toolbar className='topnav'>
        <EdgeTrigger target={{ anchor: "left", field: "open" }}>
          {(open, setOpen) => (
            <Icon onClick={() => setOpen(!open)}>
              {open ? 'keyboard_arrow_left' : 'menu'}
            </Icon>
          )}
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
    <Container maxWidth="xl">
      <Authentication />
      <Errors />
      <Routes isAuthenticated={isAuthenticated} />
    </Container>
  );
}
export default App;
