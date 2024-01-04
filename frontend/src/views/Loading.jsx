import { Box, LinearProgress } from "@mui/material";

import React from "react";
import { app } from "../api";
import { debounce } from "lodash-es";
import { useStateValue } from "../appContext";

let loaded = false;

export default function Loading({ children }) {
  const {
    state: { loading },
    dispatch,
  } = useStateValue();
  if (!loaded) {
    const debouncedLoaded = debounce(() => dispatch("LOADING", false), 100);
    app.hooks({
      before: {
        all: (context) => {
          if (!(context.arguments[0] && context.arguments[0].noLoading)) {
            dispatch("LOADING", true);
            debouncedLoaded.cancel();
          }
        },
      },
      after: {
        all: () => debouncedLoaded(),
      },
      error: {
        all: () => debouncedLoaded(),
      },
    });
    loaded = true;
  }

  // return true && (
  return (
    <>
      {loading && (
        <LinearProgress sx={{ width: "100%" }} color="secondary" size={100} />
      )}
      <Box
        sx={[
          {
            opacity: 1,
            transition: "opacity 0.3s",
          },
          loading && {
            marginTop: "-4px",
            opacity: 0.6,
          },
        ]}
      >
        {children}
      </Box>
    </>
  );
}
