import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Link, Redirect } from 'react-router-dom';
import { StateProvider, useStateValue } from './appContext'
import Records from './Records';
import Record from './Record';
import Login from './Login';
import { app } from './api';


function App() {
  return (
    <StateProvider>
      <Router>
        <div className="App">
          <header className="App-header">
            <Link to="/">Home</Link>
            <Logout />
          </header>
          <Main />
        </div>
      </Router>
    </StateProvider>
  );
}

function Logout() {
  const { state: { isAuthenticated } } = useStateValue();
  return isAuthenticated ? <Link to="/login" onClick={app.logout}>Logout</Link> : '';
}

function Authentication() {
  const { state: { isAuthenticated, hooks_initialized }, dispatch } = useStateValue();
  useEffect(() => {
    if (hooks_initialized) {
      return;
    }
    app.hooks({
      error: {
        all: (context) => {
          console.error(`Error in ${context.path} calling ${context.method}  method`, context.error);
          dispatch('ERROR', { error: context.error.message })
          return context;
        }
      }
    })
    app.service('authentication').hooks({
      after: {
        create: ({ result: { user } }) => {
          dispatch('LOGIN', { user })
        },
        remove: () => {
          dispatch('LOGOUT')
        }
      }
    });
    dispatch('INITIALIZE_HOOKS')
  }, [dispatch, hooks_initialized]);

  useEffect(() => {
    if (isAuthenticated === null) {
      app.reAuthenticate()
        .catch(() => { dispatch('LOGOUT') });
    }
  }, [dispatch, isAuthenticated]);

  return <></>
}

function Main() {
  const { state: { isAuthenticated, error } } = useStateValue();
  // const title = isAuthenticated ? 'Welcome' : 'Login'
  // <h1>{title}</h1>
  return <>
    <Authentication />
    {error && (<h2>{error}</h2>)}
    {isAuthenticated ? (
      <>
        <Route exact path="/" component={Records} />
        <Route exact path="/record/:id" component={Record} />
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
  </>
}
export default App;
