import { LinearProgress } from "@mui/material";
import { debounce } from "lodash-es";
import { useLoading } from "src/stores";

import { app } from "../api";
// import { useStateValue } from "../appContext";

let loaded = false;

export default function Loading({ children }) {
  // const {
  //   state: { loading },
  //   dispatch,
  // } = useStateValue();

  const { loading, setLoading } = useLoading();
  if (!loaded) {
    const debouncedLoaded = debounce(() => setLoading(false), 100);
    app.hooks({
      before: {
        all: (context) => {
          if (!(context.arguments[0] && context.arguments[0].noLoading)) {
            // dispatch("LOADING", true);
            setLoading(true);

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
      {loading && (
        <LinearProgress sx={{ width: "100%", position: "fixed", top: 64, zIndex: 100 }} color="secondary" size={100} />
      )}
      {/* {children({ loading })} */}
      {children}
    </>
  );
}
