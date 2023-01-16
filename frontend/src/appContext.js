import React, {createContext, useContext, useReducer} from 'react';
export const StateContext = createContext();
const initialState = {
  isAuthenticated: null,
  hooks_initialized: false,
  user: null,
  token: null,
  error: null,
  loading: false,
  search: {
    type: '',
    query: {},
    total: 0,
    index: 0,
    ids: []
  },
  search_index: 0,
  title: '',
  notifications: [],
};

const reducer = (state, action) => {
  const { type, payload } = action;
  switch (type) {
    case 'LOGIN':
      localStorage.setItem('user', JSON.stringify(payload.user));
      localStorage.setItem('token', JSON.stringify(payload.token));
      return {
        ...state,
        isAuthenticated: true,
        user: payload.user,
        token: payload.token,
        error: null,
      };
    case 'LOGOUT':
      console.log('LOGOUT!');
      localStorage.clear();
      return { ...state, isAuthenticated: false, user: null };
    case 'INITIALIZE_HOOKS':
      return { ...state, hooks_initialized: true };
    case 'SEARCH':
      return { ...state, search: payload };
    case 'ERROR':
      return { ...state, error: payload.error };
    case 'LOADING':
    case 'TITLE':
    case 'SEARCH_INDEX':
    case 'NOTIFICATIONS':
      return { ...state, [type.toLowerCase()]: payload };
    default:
      return state;
  }
};

export const StateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <StateContext.Provider
      value={{
        state,
        dispatch,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateValue = () => {
  const { state, dispatch } = useContext(StateContext);
  return {
    state,
    dispatch: (type, payload) => {
      dispatch({ type, payload });
    },
  };
};

export const useTitle = () => {
  const {dispatch} = useContext(StateContext);
  return title => {
    dispatch({type: 'TITLE', payload: title})
  }
}

export const useSearch = () => {
  const {dispatch} = useContext(StateContext);
  return () => {
    dispatch({type: 'SEARCH', payload: initialState.search})
    dispatch({type: 'SEARCH_INDEX', payload: 0})
  }
}

export const useAddNotification = () => {
  const { state, dispatch } = useContext(StateContext);
  return notification => {
    const id = notification.id || (Math.random() + 1).toString(36).substring(7);
    dispatch({ type: 'NOTIFICATIONS', payload: [...state.notifications, { ...notification, id }] })
  }
}

// export const useTitle = title => {
//   const {dispatch} = useContext(StateContext);
//   console.log('use', title)
//   useEffect(() => {
//     console.log('dis', title)
//     dispatch({type: 'TITLE', payload: title})
//   }, title)
//   return null
// }