import React, { useEffect } from 'react';
import { app, authentication } from './api';

import { useStateValue } from './appContext';

function Authentication() {
  const {
    state: { isAuthenticated, hooks_initialized },
    dispatch,
  } = useStateValue();
  useEffect(() => {
    if (hooks_initialized) {
      return;
    }
    app.hooks({
      error: {
        all: context => {
          if (context.error && context.error.name === 'NotAuthenticated') {
            dispatch('LOGOUT');
          } else {
            console.error(
              `Error in ${context.path} calling ${context.method} method`,
              context.error
            );
            if (!context.params.noDispatchError) {
              dispatch('ERROR', { error: context.error.message });
            }
          }
          return context;
        },
      },
    });
    authentication.hooks({
      after: {
        create: ({ result: { user } }) => {
          dispatch('LOGIN', { user });
        },
        remove: () => {
          dispatch('LOGOUT');
        },
      },
    });
    dispatch('INITIALIZE_HOOKS');
  }, [dispatch, hooks_initialized]);

  useEffect(() => {
    if (isAuthenticated === null) {
      app.reAuthenticate().catch(() => {
        dispatch('LOGOUT');
      });
    }
  }, [dispatch, isAuthenticated]);

  return <></>;
}

export default Authentication;
