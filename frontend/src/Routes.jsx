import {
  Navigate,
  Route,
  Routes as RouterRoutes,
  useLocation,
  useParams,
} from "react-router-dom";
import React, { Suspense } from "react";

import Collections from "./views/Collections";
import Login from "./views/Login";
import Record from "./views/Record";
import Records from "./views/Records";
import Relationships from "./views/Relationships";
import Search from "./views/Search";

const Collection = React.lazy(() => import("./views/Collection"));
const Users = React.lazy(() => import("./views/Users"));

function Routes({ isAuthenticated }) {
  const location = useLocation();

  if (isAuthenticated) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <RouterRoutes>
          <Route exact path="/" element={<Records />} />
          {/* <Route exact path="/test" element={<Test />} /> */}
          <Route exact path="/collections" element={<Collections />} />
          <Route
            path="/collections/featured"
            element={<Collection id={0} mode="featured_collections" />}
          />
          <Route path="/collections/:id" element={<Collection />} />
          <Route exact path="/search" element={<Search />} />
          <Route exact path="/records" element={<Records />} />
          <Route
            path="/records/featured"
            element={<Collection id={0} mode="featured_records" />}
          />
          <Route path="/records/:id" element={<Record />} />

          <Route path="/relationships/:skip" element={<Relationships />} />
          <Route path="/relationships/" element={<Relationships />} />
          <Route path="/users" element={<Users />} />
          <Route path="/login" element={<Login />} />
        </RouterRoutes>
      </Suspense>
    );
  } else if (isAuthenticated === false) {
    return (
      <RouterRoutes>
        <Route path="/login" element={<Login />} />
        <Route
          path="*"
          index
          element={<Navigate to={"/login"} state={{ referrer: location }} />}
        />
      </RouterRoutes>
    );
  }

  return <div>Loading...</div>;
}

export default React.memo(Routes);
