import {LinearProgress} from '@material-ui/core';
import React from 'react';
import {app} from '../api';
import {debounce} from 'lodash';
import {makeStyles} from '@material-ui/core/styles';
import {useStateValue} from '../appContext';

const useStyles = makeStyles({
  progress: {
    width: '100%',
  },
  loadingContainer: {
    opacity: 1,
    transition: 'opacity 0.3s',
    '&.loading': {
      marginTop: -4,
      opacity: 0.6,
    }
  },
});

let loaded = false;

export default function Loading({children}) {
  const classes = useStyles();

  const {
    state: {loading},
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

  // return true && (
  return (
    <>
      {loading && <LinearProgress className={classes.progress} color="secondary" size={100} />}
      <div className={`${classes.loadingContainer} ${loading ? 'loading' : ''}`}>
        {children}
      </div>
    </>
  );
}
