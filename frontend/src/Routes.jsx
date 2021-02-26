import {
  Redirect,
  Route,
  Switch,
  useLocation
} from 'react-router-dom';

import Collection from './views/Collection';
import Collections from './views/Collections';
import Login from './views/Login';
import React from 'react';
import Record from './views/Record';
import Records from './views/Records';
import Relationship from './views/Relationship';
import Relationships from './views/Relationships';
import Search from './views/Search';
import Test from './views/Test';

function Routes({isAuthenticated}) {
  const location = useLocation();

  if (isAuthenticated) {
    return (
      <Switch>
        <Route exact path="/" component={Records} />
        <Route exact path="/test" component={Test} />
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
      </Switch>
    )
  } else if (isAuthenticated === false) {
    console.log(location)
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route>
          <Redirect to={{pathname: "/login", state: {referrer: location}}} />
        </Route>
      </Switch>
    )
  } 
  
  return <div>Loading...</div>
}

export default React.memo(Routes)