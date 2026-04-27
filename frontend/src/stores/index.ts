// import useAppStore from "src/stores/appStore";
// import useQueryStore from "src/stores/queryStore";
import { useCallback, useMemo } from "react";
import useAppStore from "src/stores/appStore";
import { queryStores, createQueryStore } from "src/stores/queryStore";
import useSessionStore from "src/stores/sessionStore";
import { parseError } from "src/utils/parseError";

export {
  useAppStore,
  useSessionStore,
  queryStores,
  createQueryStore,
};

export const useAuth = () => {
  const isAuthenticated = useSessionStore(state => state.isAuthenticated);
  const user = useSessionStore(state => state.user);
  const login = useSessionStore(state => state.login);
  const logout = useSessionStore(state => state.logout);
  const token = useSessionStore(state => state.token);

  return useMemo(() => ({ isAuthenticated, user, login, logout, token }), [isAuthenticated, user, login, logout, token]);
};

export const useLoading = () => {
  const loading = useAppStore(state => state.loading);
  const setLoading = useAppStore(state => state.setLoading);

  return { loading, setLoading };
}

export const useTitle = () => {
  const setTitle = useAppStore(state => state.setTitle);

  return useCallback((title: string) => {
    setTitle(title);
    return () => setTitle('');
  }, [setTitle]);
};

// export const useResetSearch = (type: SearchType) => {
//     return useQueryStore(type)(state => state.resetSearch);
// };

// export const useSetSearch = (type: SearchType) => {
//     return useQueryStore(type)(state => state.setSearch);
// };

// export const useSetSearchIndex = (type: SearchType) => {
//     return useQueryStore(type)(state => state.setSearchIndex);
// };

// export const useSetFilter = (type: SearchType) => {
//     return useQueryStore(type)(state => state.setFilter);
// };

export const useRemoveNotification = () => {
  return useAppStore(state => state.removeNotification);
};

export const useAddNotification = () => {
  return useAppStore(state => state.addNotification);
};

export const useDisplayError = () => {
  const displayNotification = useAppStore(state => state.addNotification);

  return useCallback((error: unknown, prefix?: string) => {
    const parsed = parseError(error);
    const message = prefix ? `${prefix}: ${parsed}` : parsed;
    displayNotification({ severity: "error", message });
  }, [displayNotification]);
};