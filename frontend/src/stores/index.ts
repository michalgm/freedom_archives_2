// import useAppStore from "src/stores/appStore";
// import useQueryStore from "src/stores/queryStore";
import { useCallback, useMemo } from "react";
import useAppStore from "src/stores/appStore";
import useQueryStore from "src/stores/queryStore";
import useSessionStore from "src/stores/sessionStore";

const errorMessages = {
    "jwt expired": "Your session has expired. Please log in again.",
};

export {
    useAppStore,
    // useQueryStore,
    useSessionStore
};

const parseError = (error: string | Error) => {
    const message = typeof error === "string" ? error : error?.message || error;
    return typeof message === "string" ? errorMessages?.[message] || message : message;
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

export const useResetSearch = () => {
    return useQueryStore(state => state.resetSearch);
};

export const useSetSearch = () => {
    return useQueryStore(state => state.setSearch);
};

export const useSetFilter = () => {
    return useQueryStore(state => state.setFilter);
};

export const useSetSearchType = () => {
    return useQueryStore(state => state.setSearchType);
};

export const useRemoveNotification = () => {
    return useAppStore(state => state.removeNotification);
};

export const useAddNotification = () => {
    return useAppStore(state => state.addNotification);
};

export const useDisplayError = () => {
    const displayNotification = useAppStore(state => state.addNotification);

    return useCallback((error: string | Error) => {
        const message = parseError(error)
        displayNotification({ severity: "error", message });
    }, [displayNotification]);
};