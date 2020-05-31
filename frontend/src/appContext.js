import React, { createContext, useContext, useReducer } from "react";
export const StateContext = createContext();
const initialState = {
  isAuthenticated: null,
  hooks_initialized: false,
  user: null,
  token: null,
  error: null,
  loading: false,
  search: {
    $fullText: '',
    has_digital: true
  }
};
const reducer = (state, action) => {
  const { type, payload } = action;
  switch (type) {
    case "LOGIN":
      localStorage.setItem("user", JSON.stringify(payload.user));
      localStorage.setItem("token", JSON.stringify(payload.token));
      return {
        ...state,
        isAuthenticated: true,
        user: payload.user,
        token: payload.token,
        error: null
      };
    case "LOGOUT":
      localStorage.clear();
      return { ...state, isAuthenticated: false, user: null };
    case 'INITIALIZE_HOOKS':
      return { ...state, hooks_initialized: true }
    case 'SET_SEARCH':
      return { ...state, search: payload }
    case "ERROR":
      return { ...state, error: payload.error }
    case "LOADING":
      return { ...state, loading: payload }
    default:
      return state;
  }
};

export const StateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return <StateContext.Provider value={{
    state,
    dispatch
  }}
  >
    {children}
  </StateContext.Provider>
}

export const useStateValue = () => {
  const { state, dispatch } = useContext(StateContext);
  return { state, dispatch: (type, payload) => { dispatch({ type, payload }) } }
}
