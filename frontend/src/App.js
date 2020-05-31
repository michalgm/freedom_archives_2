import React from 'react';
import './App.scss';
import { BrowserRouter as Router, Route, Link, Redirect } from 'react-router-dom';
import { StateProvider, useStateValue } from './appContext'
import Records from './Records';
import Record from './Record';
import Login from './Login';
import Relationships from './Relationships';
import Authentication from './Authentication';
import Relationship from './Relationship';
import Loading from './Loading';
import Errors from './components/Errors';
import { app } from './api';
import { CssBaseline, Container } from '@material-ui/core';


function App() {
  return (
    <StateProvider>
      <Router>
        <CssBaseline>
          <div className="App">
            <header className="App-header">
              <Link to="/">Search</Link>
              <Link to="/relationships">Relationships</Link>
              <Logout />
            </header>
            <Main />
          </div>
        </CssBaseline>
      </Router>
    </StateProvider>
  );
}

function Logout() {
  const { state: { isAuthenticated } } = useStateValue();
  return isAuthenticated ? <Link to="/login" onClick={app.logout}>Logout</Link> : '';
}

function Main() {
  const { state: { isAuthenticated } } = useStateValue();
  // const title = isAuthenticated ? 'Welcome' : 'Login'
  // <h1>{title}</h1>
  return <Container maxWidth="xl">
    <Authentication />
    <Loading />
    <Errors />
    {isAuthenticated ? (
      <>
        <Route exact path="/" component={Records} />
        <Route exact path="/record/:id"
          render={({ match: { params: { id } } }) => <Record id={id} showForm />}
        />
        <Route path="/relationship/:id"
          render={({ match: { params: { id } } }) => <Relationship id={id} />}
        />

        <Route path="/relationships/:skip?"
          render={({ match: { params: { skip } } }) => <Relationships skip={skip} />}
        />
        <Route exact path="/login">
          <Redirect to="/" />
        </Route>
      </>
    ) : (isAuthenticated === false ?
      <>
        <Route exact path="/">
          <Redirect to="/login" />
        </Route>
        <Redirect to="/login" />
        <Route exact path="/login" component={Login} />
      </> : <div>Loading...</div>)
    }
  </Container>
}
export default App;
