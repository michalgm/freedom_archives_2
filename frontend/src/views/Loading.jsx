import { LinearProgress } from "@mui/material";

import { debounce } from "lodash-es";
import React from "react";
import { app } from "../api";
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

  return (
    <>
      {loading && <LinearProgress sx={{ width: "100%" }} color="secondary" size={100} />}
      {children({ loading })}
    </>
  );
}
