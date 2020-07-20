import React from 'react';
import './App.scss';
import {
  BrowserRouter as Router,
  Route,
  Redirect,
  Link,
} from 'react-router-dom';
import { StateProvider, useStateValue } from './appContext';
import Records from './views/Records';
import Record from './views/Record';
import Login from './views/Login';
import Relationships from './views/Relationships';
import Authentication from './Authentication';
import Relationship from './views/Relationship';
import Collections from './views/Collections';
import Collection from './views/Collection';
import Loading from './views/Loading';
import Sidebar from './views/Sidebar';
import Errors from './components/Errors';
import { app } from './api';
import {
  CssBaseline,
  Container,
  Toolbar,
  Button,
  Typography,
} from '@material-ui/core';
import {
  Root,
  getMuiTreasuryScheme,
  getHeader,
  getSidebarTrigger,
  getContent,
} from '@mui-treasury/layout';
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
        <Main />
      </Content>
    </div>
  );
}

function Logout() {
  const {
    state: { isAuthenticated },
  } = useStateValue();
  return isAuthenticated ? (
    <Button color="inherit" component={Link} to="/login" onClick={app.logout}>
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
  // console.log(isAuthenticated);
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
          <Route exact path="/collections" component={Collections} />
          <Route
            path="/collections/:id"
            render={({
              match: {
                params: { id },
              },
            }) => <Collection id={id} />}
          />
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
