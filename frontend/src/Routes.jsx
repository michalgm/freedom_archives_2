import React from 'react';
import Records from './views/Records';
import Record from './views/Record';
import Login from './views/Login';
import Relationships from './views/Relationships';
import Relationship from './views/Relationship';
import Collections from './views/Collections';
import Collection from './views/Collection';
import Search from './views/Search';
import {
  Route,
  Redirect,
} from 'react-router-dom';

function Routes({isAuthenticated}) {
  if (isAuthenticated) {
    return (<>
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
      <Route exact path="/search" component={Search} />
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
    </>)
  } else if (isAuthenticated === false) {
    return (
      <>
      <Route exact path="/">
        <Redirect to="/login" />
      </Route>
      <Redirect to="/login" />
      <Route exact path="/login" component={Login} />
    </>

    )
  } 
  
  return <div>Loading...</div>
}

export default Routes