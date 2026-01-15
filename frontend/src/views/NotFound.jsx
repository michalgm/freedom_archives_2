import { Box, Typography } from "@mui/material";
import { isRouteErrorResponse, useRouteError } from "react-router";

// eslint-disable-next-line react-refresh/only-export-components
export function loader() {
  throw new Response("Not Found", { status: 404 });
}

export function NotFoundPage() {
  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      <Typography component="h1" variant="h4" gutterBottom>404 - Not Found</Typography>
      <Typography variant="body1">The page you are looking for does not exist.</Typography>
    </Box>
  );
}

export function ErrorBoundary() {
  const err = useRouteError();
  if (isRouteErrorResponse(err) && err.status === 404) {
    return <NotFoundPage />;
  }
  throw err; // let a higher boundary handle other errors
}

export default NotFoundPage;