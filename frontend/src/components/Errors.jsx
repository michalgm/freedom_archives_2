import { Alert, AlertTitle } from "@mui/material";

import React from "react";
import { useStateValue } from "../appContext";

function Errors() {
  const {
    state: { error },
    dispatch,
  } = useStateValue();

  const clearError = () => {
    dispatch("ERROR", { error: "" });
  };

  return (
    error && (
      <Alert severity="error" onClose={() => clearError()} sx={{ mb: 1 }}>
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    )
  );
}

export default Errors;
