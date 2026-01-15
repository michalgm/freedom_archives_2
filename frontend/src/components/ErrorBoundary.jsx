import { Alert, AlertTitle, lighten, Paper, Stack, Typography } from "@mui/material";
import { ErrorBoundary as ErrorBoundaryComponent } from "react-error-boundary";


const isDev = import.meta.env.DEV;
export function ErrorFallback({ error }) {

  return (
    <Stack spacing={4}>
      <Paper>
        <Typography variant="h3" gutterBottom>
          Something went wrong:
        </Typography>
        {
          isDev ? (
            <>
              <Typography variant="h4">{error.message}</Typography>
              <Alert
                variant="outlined"
                severity="error"
                slotProps={{
                  message: {
                    component: "pre",
                    sx: {
                      whiteSpace: "pre-wrap",
                    },
                  },
                }}
                sx={(theme) => ({
                  backgroundColor: lighten(theme.palette.error.light, 0.9),
                  mt: 2,
                })}
              >
                <AlertTitle>Error Details</AlertTitle>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: "12px",
                  }}
                >
                  {error.stack}
                </pre>
              </Alert>
            </>
          ) : (
            <Typography variant="h4">
              An unexpected error occurred.
            </Typography>
          )
        }

      </Paper>
    </Stack>
  );
}

function ErrorBoundary({ children }) {
  return <ErrorBoundaryComponent FallbackComponent={ErrorFallback}>{children}</ErrorBoundaryComponent>;
}

export default ErrorBoundary;
