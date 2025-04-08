import React, { Suspense, useMemo } from "react";
import { Navigate, Outlet, Route, createBrowserRouter, createRoutesFromElements, useLocation } from "react-router";
import { RouterProvider } from "react-router/dom";
import { useStateValue } from "./appContext";
import Layout from "./Layout";

const Collections = React.lazy(() => import("./views/Collections"));
const EditLists = React.lazy(() => import("./views/EditLists"));
const Login = React.lazy(() => import("./views/Login"));
const PublishSite = React.lazy(() => import("./views/PublishSite"));
const Record = React.lazy(() => import("./views/Record"));
const RecordOld = React.lazy(() => import("./views/RecordOld"));
const Records = React.lazy(() => import("./views/Records"));
const Relationships = React.lazy(() => import("./views/Relationships"));
const ReviewChanges = React.lazy(() => import("./views/ReviewChanges"));
const Search = React.lazy(() => import("./views/Search"));
const Collection = React.lazy(() => import("./views/Collection"));
const Users = React.lazy(() => import("./views/Users"));
const SiteSettings = React.lazy(() => import("./views/SiteSettings"));

function LoginRedirect() {
  const location = useLocation();
  return <Navigate to="/login" state={{ referrer: location }} />;
}

export default function Router() {
  const {
    state: { isAuthenticated },
  } = useStateValue();

  const router = useMemo(
    () =>
      // createBrowserRouter(
      //   createRoutesFromElements(<Route element={<div>hi</div>}>{Routes({ isAuthenticated })}</Route>)
      // ),
      createBrowserRouter(createRoutesFromElements(<Route element={<Layout />}>{Routes({ isAuthenticated })}</Route>)),
    [isAuthenticated]
  );
  return <RouterProvider key={isAuthenticated} router={router} />;
}

function Routes({ isAuthenticated }) {
  // const location = useLocation();

  if (isAuthenticated) {
    return (
      <Route
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <Outlet />
          </Suspense>
        }
      >
        <Route exact path="/" element={<Records />} />
        <Route exact path="/collections" element={<Collections />} />
        <Route path="/collections/featured" element={<Collection id={0} mode="featured_collections" />} />
        <Route path="/collections/:id" element={<Collection />} />
        <Route exact path="/search" element={<Search />} />
        <Route exact path="/records" element={<Records />} />
        <Route path="/records/featured" element={<Collection id={0} mode="featured_records" />} />
        <Route path="/records/:id" element={<Record showForm />} />
        <Route path="/records-old/:id" element={<RecordOld showForm />} />

        <Route path="/relationships/:skip" element={<Relationships />} />
        <Route path="/relationships/" element={<Relationships />} />
        <Route path="/login" element={<Login />} />
        <Route path="/site/edit-list-values" element={<EditLists />} />
        <Route path="/site/review-changes" element={<ReviewChanges />} />
        <Route path="/site/settings" element={<SiteSettings />} />
        <Route path="/admin/publish-site" element={<PublishSite />} />
        <Route path="/admin/users" element={<Users />} />
      </Route>
    );
  } else if (isAuthenticated === false) {
    return (
      <>
        <Route path="/login" element={<Login />} />
        <Route path="/*" index element={<LoginRedirect />} />
      </>
    );
  }

  return <Route path="/*" element={<div>Loading...</div>} />;
}
