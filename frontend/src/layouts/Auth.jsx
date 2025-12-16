import { LinearProgress } from "@mui/material";
import React, { useEffect, useRef } from "react";
import { Navigate, Outlet, useLocation, useMatches, useNavigate } from "react-router";
import { hasAccess, currentRouteConfig } from "src/config/routes";
import { useAuth } from "src/stores";

export default function AdminGuardLayout() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const matches = useMatches()

  const hasRedirected = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isAuthenticated === false) {// && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate("/admin/login", {
        replace: true,
        state: { referrer: location },
      });
    }
  }, [isAuthenticated, navigate, location]);

  if (isAuthenticated === null) return <LinearProgress />;
  if (isAuthenticated === false) return null;


  const requiredRole = currentRouteConfig(matches)?.authRole;
  // console.log({requiredRole, access: hasAccess(user?.role, requiredRole)}) 

  if (requiredRole && !hasAccess(user?.role, requiredRole)) {
    return (
      <Navigate to="/admin/forbidden" state={{ referrer: location }} replace />
    );
  }


  return <Outlet />;
}