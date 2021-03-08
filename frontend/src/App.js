import './App.scss';

import {
  Button,
  Container,
  CssBaseline,
  Icon,
  Toolbar,
  Typography
} from '@material-ui/core';
import {
  Link,
  BrowserRouter as Router,
} from 'react-router-dom';
import {
  Root,
  getContent,
  getHeader,
  getMuiTreasuryScheme,
  getSidebarTrigger,
} from '@mui-treasury/layout';
import {StateProvider, useStateValue} from './appContext';

import Authentication from './Authentication';
import Breadcrumbs from './components/Breadcrumbs';
import Errors from './components/Errors';
import Loading from './views/Loading';
import React from 'react';
import Routes from './Routes'
import Sidebar from './views/Sidebar';
import {app} from './api';
import styled from 'styled-components';

const Header = getHeader(styled);
const SidebarTrigger = getSidebarTrigger(styled);
const Content = getContent(styled);

const scheme = getMuiTreasuryScheme();
// scheme.configureHeader(builder => {
//   builder
//     .registerConfig('xs', {
//       position: 'sticky',
//     })
//     .registerConfig('md', {
//       position: 'relative', // won't stick to top when scroll down
//     });
// });
// scheme.configureEdgeSidebar(builder => {
//   builder
//     .create('sidebar', { anchor: 'left' })
//     .registerTemporaryConfig('xs', {
//       anchor: 'left',
//       width: 'auto', // 'auto' is only valid for temporary variant
//     })
//     .registerPermanentConfig('md', {
//       width: 300, // px, (%, rem, em is compatible)
//       collapsible: true,
//       collapsedWidth: 64,
//     });
// });

function App() {
  return (
    <StateProvider>
      <Router>
        <Root scheme={scheme}>
          <CssBaseline>
            <Layout />
          </CssBaseline>
        </Root>
      </Router>
    </StateProvider>
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
        <SidebarTrigger sidebarId="primarySidebar" color="inherit" />
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
      <Routes isAuthenticated={isAuthenticated}/>
    </Container>
  );
}
export default App;
