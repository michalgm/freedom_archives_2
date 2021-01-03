import React from 'react';
import { LinearProgress } from '@material-ui/core';
import { useStateValue } from '../appContext';
import { app } from '../api';
import { makeStyles } from '@material-ui/core/styles';

import { debounce } from 'lodash';

const useStyles = makeStyles({
  loadingContainer: {
    height: '100%',
    width: '100%',
    position: 'fixed',
    zIndex: 1000000,
  },
  progress: {
    width: '100%',
  },
  backdrop: {
    backdropFilter: 'blur(2px)',
    height: '100%',
    width: '100%',
    zIndex: 1000,
    marginTop: 4
  },
});


let loaded = false;

export default function Loading({children}) {
  const classes = useStyles();

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
  
    return loading && (
    <div className={classes.loadingContainer}>
      <LinearProgress className={classes.progress} color="secondary" size={100} />
      <div className={classes.backdrop}></div>
    </div>
  );
}
