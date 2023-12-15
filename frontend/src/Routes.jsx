import {
  Navigate,
  Route,
  Routes as RouterRoutes,
  useLocation,
  useParams
} from 'react-router-dom';

import Collection from './views/Collection';
import Collections from './views/Collections';
import Login from './views/Login';
import React from 'react';
import Record from './views/Record';
import Records from './views/Records';
import Relationships from './views/Relationships';
import Search from './views/Search';
import Test from './views/Test';
import Users from './views/Users';

function RecordElement() {
  const {id} = useParams();
  return <Record showForm id={id}/>
}

function Routes({isAuthenticated}) {
  const location = useLocation();

  if (isAuthenticated) {
    return (
      <RouterRoutes>
        <Route exact path="/" element={<Records />} />
        <Route exact path="/test" element={<Test />} />
        <Route exact path="/collections" element={<Collections />} />
        <Route path="/collections/:id" element={<Collection />} />
        <Route exact path="/search" element={<Search />} />
        <Route exact path="/records" element={<Records />} />
        <Route path="/records/new" element={<Record showForm newRecord />} />
        <Route path="/records/:id" element={<RecordElement />} />

        <Route path="/relationships/:skip" element={<Relationships />} />
        <Route path="/relationships/" element={<Relationships />} />
        <Route path="/users" element={<Users />} />
        <Route path="/login" element={<Login />} />
      </RouterRoutes>
    );
  } else if (isAuthenticated === false) {
    return (
      <RouterRoutes>
        <Route path="/login" element={<Login/>} />
        <Route path="*" index element={<Navigate to={"/login"} state={{referrer: location}} />}/>
      </RouterRoutes>
    )
  } 
  
  return <div>Loading...</div>
}

export default React.memo(Routes)