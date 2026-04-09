import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { useAppStore } from "src/stores";

function Errors() {
  const setError = useAppStore((state) => state.setError);
  const error = useAppStore((state) => state.error);

  const clearError = () => {
    setError(null);
  };

  return (
    error && (
      <Alert severity="warning" onClose={() => clearError()} sx={{ mb: 1 }}>
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    )
  );
}

export default Errors;
