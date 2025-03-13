import React, { Suspense } from "react";
import { Navigate, Route, Routes as RouterRoutes, useLocation } from "react-router-dom";

const Collections = React.lazy(() => import("./views/Collections"));
const EditLists = React.lazy(() => import("./views/EditLists"));
const Login = React.lazy(() => import("./views/Login"));
const PublishSite = React.lazy(() => import("./views/PublishSite"));
const Record = React.lazy(() => import("./views/Record"));
const Records = React.lazy(() => import("./views/Records"));
const Relationships = React.lazy(() => import("./views/Relationships"));
const ReviewChanges = React.lazy(() => import("./views/ReviewChanges"));
const Search = React.lazy(() => import("./views/Search"));
const Collection = React.lazy(() => import("./views/Collection"));
const Users = React.lazy(() => import("./views/Users"));
const SiteSettings = React.lazy(() => import("./views/SiteSettings"));

function Routes({ isAuthenticated }) {
  const location = useLocation();

  if (isAuthenticated) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <RouterRoutes>
          <Route exact path="/" element={<Records />} />
          {/* <Route exact path="/test" element={<Test />} /> */}
          <Route exact path="/collections" element={<Collections />} />
          <Route path="/collections/featured" element={<Collection id={0} mode="featured_collections" />} />
          <Route path="/collections/:id" element={<Collection />} />
          <Route exact path="/search" element={<Search />} />
          <Route exact path="/records" element={<Records />} />
          <Route path="/records/featured" element={<Collection id={0} mode="featured_records" />} />
          <Route path="/records/:id" element={<Record showForm />} />

          <Route path="/relationships/:skip" element={<Relationships />} />
          <Route path="/relationships/" element={<Relationships />} />
          <Route path="/login" element={<Login />} />
          <Route path="/site/edit-list-values" element={<EditLists />} />
          <Route path="/site/review-changes" element={<ReviewChanges />} />
          <Route path="/site/settings" element={<SiteSettings />} />
          <Route path="/admin/publish-site" element={<PublishSite />} />
          <Route path="/admin/users" element={<Users />} />
        </RouterRoutes>
      </Suspense>
    );
  } else if (isAuthenticated === false) {
    return (
      <RouterRoutes>
        <Route path="/login" element={<Login />} />
        <Route path="*" index element={<Navigate to={"/login"} state={{ referrer: location }} />} />
      </RouterRoutes>
    );
  }

  return <div>Loading...</div>;
}

export default React.memo(Routes);
