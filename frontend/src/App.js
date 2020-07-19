import React from 'react';
import './App.scss';
import {
  BrowserRouter as Router,
  Route,
  Link,
  Redirect,
} from 'react-router-dom';
import { StateProvider, useStateValue } from './appContext';
import Records from './Records';
import Record from './Record';
import Login from './Login';
import Relationships from './Relationships';
import Authentication from './Authentication';
import Relationship from './Relationship';
import Loading from './Loading';
import Sidebar from './Sidebar';
import Errors from './components/Errors';
import { app } from './api';
import {
  CssBaseline,
  Container,
  AppBar,
  Toolbar,
  Button,
  Typography,
} from '@material-ui/core';
import Layout, {
  Root,
  getMuiTreasuryScheme,
  getHeader,
  getDrawerSidebar,
  getSidebarTrigger,
  getSidebarContent,
  getCollapseBtn,
  getContent,
} from '@mui-treasury/layout';
import styled from 'styled-components';

const Header = getHeader(styled);
const DrawerSidebar = getDrawerSidebar(styled);
const SidebarTrigger = getSidebarTrigger(styled);
const Content = getContent(styled);
const SidebarContent = getSidebarContent(styled);
const CollapseBtn = getCollapseBtn(styled);

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
            <div className="App">
              <NavBar />
              <DrawerSidebar sidebarId={'primarySidebar'}>
                <SidebarContent>
                  <Sidebar />
                </SidebarContent>
                <CollapseBtn />
              </DrawerSidebar>
              <Content>
                <Main />
              </Content>
            </div>
          </CssBaseline>
        </Root>
      </Router>
    </StateProvider>
  );
}

function Logout() {
  const {
    state: { isAuthenticated },
  } = useStateValue();
  return isAuthenticated ? (
    <Button color="inherit" component="a" href="/login" onClick={app.logout}>
      Logout
    </Button>
  ) : (
    ''
  );
}

function NavBar() {
  return (
    <Header color="primary">
      <Toolbar>
        <SidebarTrigger sidebarId="primarySidebar" color="inherit" />
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          Freedom Archives Admin
        </Typography>
        <Logout />
      </Toolbar>
    </Header>
  );
}

function Main() {
  const {
    state: { isAuthenticated },
  } = useStateValue();
  // const title = isAuthenticated ? 'Welcome' : 'Login'
  // <h1>{title}</h1>
  return (
    <Container maxWidth="xl">
      <Authentication />
      <Loading />
      <Errors />
      {isAuthenticated ? (
        <>
          <Route exact path="/" component={Records} />
          <Route exact path="/records" component={Records} />
          <Route
            exact
            path="/record/:id"
            render={({
              match: {
                params: { id },
              },
            }) => <Record id={id} showForm />}
          />
          <Route
            path="/relationship/:id"
            render={({
              match: {
                params: { id },
              },
            }) => <Relationship id={id} />}
          />

          <Route
            path="/relationships/:skip?"
            render={({
              match: {
                params: { skip },
              },
            }) => <Relationships skip={skip} />}
          />
          <Route exact path="/login">
            <Redirect to="/" />
          </Route>
        </>
      ) : isAuthenticated === false ? (
        <>
          <Route exact path="/">
            <Redirect to="/login" />
          </Route>
          <Redirect to="/login" />
          <Route exact path="/login" component={Login} />
        </>
      ) : (
        <div>Loading...</div>
      )}
    </Container>
  );
}
export default App;
