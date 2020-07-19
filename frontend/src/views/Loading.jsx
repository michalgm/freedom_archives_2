import React from 'react';
import { Backdrop, CircularProgress } from '@material-ui/core';
import { useStateValue } from '../appContext';
import { app } from '../api';

import { debounce } from 'lodash';

let loaded = false;

export default function Loading() {
  const {
    state: { loading },
    dispatch,
  } = useStateValue();
  if (!loaded) {
    const debouncedLoaded = debounce(() => dispatch('LOADING', false), 100);
    app.hooks({
      before: {
        all: context => {
          if (!(context.arguments[0] && context.arguments[0].noLoading)) {
            dispatch('LOADING', true);
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
    <Backdrop open={loading} style={{ zIndex: 10000 }}>
      {loading && <CircularProgress color="primary" size={100} />}
    </Backdrop>
  );
}
