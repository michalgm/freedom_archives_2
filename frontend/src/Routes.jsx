import React, { Suspense } from "react";
import { Navigate, Outlet, Route, createBrowserRouter, createRoutesFromElements, useLocation } from "react-router";
import { RouterProvider } from "react-router/dom";
import { hasAccess, getRoutes } from "src/config/routes";
import { useAuth } from "src/stores";

import Layout from "./Layout";

const componentMap = {
  Collections: React.lazy(() => import("./views/Collections")),
  EditLists: React.lazy(() => import("./views/EditLists")),
  Forbidden: React.lazy(() => import("./views/Forbidden")),
  Login: React.lazy(() => import("./views/Login")),
  PublishSite: React.lazy(() => import("./views/PublishSite")),
  Record: React.lazy(() => import("./views/Record")),
  Records: React.lazy(() => import("./views/Records")),
  Relationships: React.lazy(() => import("./views/Relationships")),
  ReviewChanges: React.lazy(() => import("./views/ReviewChanges")),
  Search: React.lazy(() => import("./views/Search")),
  Collection: React.lazy(() => import("./views/Collection")),
  Users: React.lazy(() => import("./views/Users")),
  SiteSettings: React.lazy(() => import("./views/SiteSettings")),
  Table: React.lazy(() => import("./views/Table")),
};

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

function RoleProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!hasAccess(user?.role, requiredRole)) {
    return <Navigate to="/forbidden" state={{ referrer: location }} replace />;
  }

  return children;
}

function createRouteElement(path, config) {
  const { component, redirect, authRole, props, public: isPublic } = config;

  if (redirect) {
    return <Route key={path} path={path} element={<Navigate replace to={redirect} />} />;
  }

  if (!component) {
    return null;
  }

  const Component = componentMap[component];
  if (!Component) {
    console.warn(`Component ${component} not found for route ${path}`);
    return null;
  }

  let element = <Component key={path} {...props} />;

  if (authRole && !isPublic) {
    element = <RoleProtectedRoute requiredRole={authRole}>{element}</RoleProtectedRoute>;
  }

  return <Route key={path} path={path} element={element} />;
}

// Generate routes from config
const publicRoutes = [];
const protectedRoutes = [];

getRoutes().forEach(([path, config]) => {
  const routeElement = createRouteElement(path, config);
  if (routeElement) {
    if (config.public) {
      publicRoutes.push(routeElement);
    } else {
      protectedRoutes.push(routeElement);
    }
  }
});

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      {publicRoutes}
      <Route
        element={
          <RequireAuth>
            <Suspense fallback={<div>Loading...</div>}>
              <Outlet />
            </Suspense>
          </RequireAuth>
        }
      >
        {protectedRoutes}
      </Route>
      <Route path="*" element={<LoginRedirect />} />
    </Route>
  )
);

export default function Router() {
  return <RouterProvider router={router} />;
}
