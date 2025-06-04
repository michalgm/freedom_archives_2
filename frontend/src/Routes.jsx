import React, { Suspense } from "react";
import { Navigate, Outlet, Route, createBrowserRouter, createRoutesFromElements, useLocation } from "react-router";
import { RouterProvider } from "react-router/dom";
import { useAuth } from "src/stores";

// import { useStateValue } from "./appContext";
import Layout from "./Layout";

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
const Table = React.lazy(() => import("./views/Table"));

function LoginRedirect() {
  const location = useLocation();
  return <Navigate to="/login" state={{ referrer: location }} />;
}

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated === null) {
    // Still determining auth status
    return <div>Loading...</div>;
  }

  if (isAuthenticated === false) {
    // Redirect to login with the current location
    return <Navigate to="/login" state={{ referrer: location }} replace />;
  }

  return children;
}

// export default function Router() {
//   const { isAuthenticated } = useAuth();
//   console.log("router", isAuthenticated);

//   const router = useMemo(
//     () =>
//       // createBrowserRouter(
//       //   createRoutesFromElements(<Route element={<div>hi</div>}>{Routes({ isAuthenticated })}</Route>)
//       // ),
//       createBrowserRouter(createRoutesFromElements(<Route element={<Layout />}>{Routes({ isAuthenticated })}</Route>)),
//     [isAuthenticated]
//   );
//   return <RouterProvider key={isAuthenticated} router={router} />;
// }

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Suspense fallback={<div>Loading...</div>}>
              <Outlet />
            </Suspense>
          </RequireAuth>
        }
      >
        <Route exact path="/" element={<Navigate replace to="/records" />} />
        <Route exact path="/collections" element={<Collections />} />
        <Route
          path="/collections/featured"
          element={<Collection key="featured_collections" id={0} mode="featured_collections" />}
        />
        <Route path="/collections/:id" element={<Collection />} />
        <Route exact path="/search" element={<Search />} />
        <Route exact path="/records" element={<Records />} />
        <Route
          path="/records/featured"
          element={<Collection key="featured_records" id={0} mode="featured_records" />}
        />
        <Route path="/records/table/" element={<Table />} />

        <Route path="/records/:id" element={<Record showForm />} />
        {/* <Route path="/records-old/:id" element={<RecordOld showForm />} /> */}
        <Route path="/relationships/:skip" element={<Relationships />} />
        <Route path="/relationships/" element={<Relationships />} />
        <Route path="/login" element={<Login />} />
        <Route path="/site/edit-list-values" element={<EditLists />} />
        <Route path="/site/review-changes" element={<ReviewChanges />} />
        <Route path="/site/settings" element={<SiteSettings />} />
        <Route path="/admin/publish-site" element={<PublishSite />} />
        <Route path="/admin/users" element={<Users />} />
      </Route>

      <Route path="*" element={<LoginRedirect />} />
    </Route>
  )
);

// function Routes({ isAuthenticated }) {
//   console.log("routes", isAuthenticated);
//   // const location = useLocation();

//   if (isAuthenticated) {
//     console.log("RENDER ME THIS");
//     return (
//       <Route
//         element={
//           <Suspense fallback={<div>Loading...</div>}>
//             <Outlet />
//           </Suspense>
//         }
//       >
//         <Route exact path="/" element={<Records />} />
//         <Route exact path="/collections" element={<Collections />} />
//         <Route path="/collections/featured" element={<Collection id={0} mode="featured_collections" />} />
//         <Route path="/collections/:id" element={<Collection />} />
//         <Route exact path="/search" element={<Search />} />
//         <Route exact path="/records" element={<Records />} />
//         <Route path="/records/featured" element={<Collection id={0} mode="featured_records" />} />
//         <Route path="/records/:id" element={<Record showForm />} />
//         <Route path="/records-old/:id" element={<RecordOld showForm />} />

//         <Route path="/relationships/:skip" element={<Relationships />} />
//         <Route path="/relationships/" element={<Relationships />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/site/edit-list-values" element={<EditLists />} />
//         <Route path="/site/review-changes" element={<ReviewChanges />} />
//         <Route path="/site/settings" element={<SiteSettings />} />
//         <Route path="/admin/publish-site" element={<PublishSite />} />
//         <Route path="/admin/users" element={<Users />} />
//       </Route>
//     );
//   } else if (isAuthenticated === false) {
//     console.log("RENDER ME LOGIN");

//     return (
//       <>
//         <Route path="/login" element={<Login />} />
//         <Route path="/*" index element={<LoginRedirect />} />
//       </>
//     );
//   }
//   console.log("RENDER ME LOADING");
//   return <Route path="/*" element={<div>Loading...%%%%</div>} />;
// }

export default function Router() {
  return <RouterProvider router={router} />;
}
